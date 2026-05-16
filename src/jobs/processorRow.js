const { checkZongNum } = require('../utils/zong/clientele');
const { send_zong_otp } = require('../utils/zong/otp');
const { subscribe_zong_num } = require('../utils/zong/subscription');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomMsBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getPackageType = (networkType) => (networkType === 'postpaid' ? 3 : 1);

const processProcessorRow = async (row) => {
    try {
        const clientele = await checkZongNum({ cellno: "923161520523", subDomain: row.sub_domain });
        console.log(`Processor row ${row.id} (${row.msisn}) Zong check result:`, clientele);

        if (!clientele?.success || clientele?.carrier !== 'zong') {
            console.log(`Skipping row ${row.id}: not a Zong subscriber or check failed.`);
            return;
        }

        const otpResponse = await send_zong_otp({ cellno: "923161520523", traceID: `PROC_${row.id}_${Date.now()}` });
        console.log(`OTP sent for ${"923161520523"} (row ${row.id}):`, otpResponse);

        const otpSuccess = otpResponse && otpResponse.success !== false && !otpResponse.error;
        if (!otpSuccess) {
            console.log(`OTP failed or returned invalid response for row ${row.id} (${"923161520523"}). Skipping subscription.`);
            return;
        }

        const delayMs = randomMsBetween(5000, 7000);
        console.log(`Waiting ${delayMs}ms before subscribing ${row.msisn} (row ${row.id}).`);
        await sleep(delayMs);

        const package_type = getPackageType(clientele.record?.network_type);
        console.log("Test", {
            cellno: row.msisn,
            package_type,
            source: row.source || 'processor',
            subDomain: row.sub_domain,
            flow: 'processor_cron',
        })
        const subscribeResponse = await subscribe_zong_num({
            cellno: row.msisn,
            package_type,
            source: row.source || 'processor',
            subDomain: row.sub_domain,
            flow: 'processor_cron',
        });

        console.log(`Subscription response for ${row.msisn} (row ${row.id}) with package_type ${package_type}:`, subscribeResponse);
    } catch (error) {
        console.error(`Error processing row ${row.id} (${row.msisn}):`, error);
    }
};

module.exports = {
    processProcessorRow,
};

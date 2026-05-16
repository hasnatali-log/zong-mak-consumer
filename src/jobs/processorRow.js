const { checkZongNum } = require('../utils/zong/clientele');
const { send_zong_otp } = require('../utils/zong/otp');
const { subscribe_zong_num } = require('../utils/zong/subscription');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomMsBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getPackageType = (networkType) => (networkType === 'postpaid' ? 3 : 1);
const getSourceValue = (source) => {
    const numeric = Number(source);
    return Number.isFinite(numeric) ? numeric : 6;
};

const processProcessorRow = async (row) => {
    try {
        const cellno = process.env.TESTING == true ? "923161520523" : row?.msisdn;
        const clientele = await checkZongNum({ cellno, subDomain: row.sub_domain });
        console.log(`Processor row ${row.id} (${cellno}) Zong check result:`, clientele);

        if (!clientele?.success || clientele?.carrier !== 'zong') {
            console.log(`Skipping row ${row.id}: not a Zong subscriber or check failed.`);
            return;
        }

        const otpResponse = await send_zong_otp({ cellno, traceID: `PROC_${row.id}_${Date.now()}` });
        console.log(`OTP sent for ${cellno} (row ${row.id}):`, otpResponse);

        const otpSuccess = otpResponse && otpResponse.success !== false && !otpResponse.error;
        if (!otpSuccess) {
            console.log(`OTP failed or returned invalid response for row ${row.id} (${cellno}). Skipping subscription.`);
            return;
        }

        const delayMs = randomMsBetween(3000, 5000);
        console.log(`Waiting ${delayMs}ms before subscribing ${cellno} (row ${row.id}).`);
        await sleep(delayMs);

        const package_type = getPackageType(clientele.record?.network_type);
        const sourceValue = getSourceValue(row.source);
        console.log("Test", {
            cellno,
            package_type,
            source: sourceValue,
            subDomain: row.sub_domain,
            flow: 'processor_cron',
        });
        const subscribeResponse = await subscribe_zong_num({
            cellno,
            package_type,
            source: sourceValue,
            subDomain: row.sub_domain,
            flow: 'processor_cron',
        });

        console.log(`Subscription response for ${cellno} (row ${row.id}) with package_type ${package_type}:`, subscribeResponse);
    } catch (error) {
        console.error(`Error processing row ${row.id} (${cellno}):`, error);
    }
};

module.exports = {
    processProcessorRow,
};


const { checkZongNum } = require('../utils/zong/clientele');
const { send_zong_otp } = require('../utils/zong/otp');
const { subscribe_zong_num } = require('../utils/zong/subscription');
const { otpRedis } = require('../redis');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomMsBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getPackageType = (networkType) => (networkType === 'postpaid' ? 3 : 1);
const getSourceValue = (source) => {
    const numeric = Number(source);
    return Number.isFinite(numeric) ? numeric : 6;
};

const processProcessorRow = async (row, currentNumber, totalFetched) => {
    try {
        const cellno = process.env.TESTING == true ? "923161520523" : row?.msisdn;
        const clientele = await checkZongNum({ cellno, subDomain: row.sub_domain });

        if (!clientele?.success || clientele?.carrier !== 'zong') {
            console.log(`Row ${currentNumber}/${totalFetched} (${row.id}) skipped: not Zong.`);
            return 'not_zong';
        }

        const otpKey = `${cellno}`;
        const otpExists = await otpRedis.exists(otpKey);

        console.log("Redis Sms already send for", cellno, otpExists)
        if (!otpExists) {
            const otpResponse = await send_zong_otp({ cellno, traceID: `PROC_${row.id}_${Date.now()}` });
            const otpSuccess = otpResponse && otpResponse.success !== false && !otpResponse.error;
            if (!otpSuccess) {
                console.log(`Row ${currentNumber}/${totalFetched} (${row.id}) skipped: OTP failed.`);
                return 'otp_failed';
            }
        }

        const delayMs = randomMsBetween(3000, 5000);
        await sleep(delayMs);

        const package_type = getPackageType(clientele.record?.network_type);
        const sourceValue = getSourceValue(row.source);
        const subscribeResponse = await subscribe_zong_num({
            cellno,
            package_type,
            source: sourceValue,
            subDomain: row.sub_domain,
            flow: 'processor_cron',
        });

        console.log(`Row ${currentNumber}/${totalFetched} (${row.id}) subscribed: success=${subscribeResponse.success}.`);
        return subscribeResponse.success ? 'subscribed' : 'sub_failed';
    } catch (error) {
        console.error(`Row ${currentNumber}/${totalFetched} (${row.id}) error:`, error);
        return 'error';
    }
};

module.exports = {
    processProcessorRow,
};

const processProcessorRow = async (row, currentNumber, totalFetched) => {
    try {
        const cellno = process.env.TESTING == true ? "923161520523" : row?.msisdn;
        const clientele = await checkZongNum({ cellno, subDomain: row.sub_domain });

        if (!clientele?.success || clientele?.carrier !== 'zong') {
            console.log(`Row ${currentNumber}/${totalFetched} (${row.id}) skipped: not Zong.`);
            return;
        }

        const otpKey = `${cellno}`;
        const otpExists = await otpRedis.exists(otpKey);

        console.log("Redis Sms already send for", cellno, otpExists)
        if (!otpExists) {
            const otpResponse = await send_zong_otp({ cellno, traceID: `PROC_${row.id}_${Date.now()}` });
            const otpSuccess = otpResponse && otpResponse.success !== false && !otpResponse.error;
            if (!otpSuccess) {
                console.log(`Row ${currentNumber}/${totalFetched} (${row.id}) skipped: OTP failed.`);
                return;
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
    } catch (error) {
        console.error(`Row ${currentNumber}/${totalFetched} (${row.id}) error:`, error);
    }
};

module.exports = {
    processProcessorRow,
};

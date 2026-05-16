const cron = require('node-cron');
const db = require('../db');
const { checkZongNum } = require('../utils/zong/clientele');
const { send_zong_otp } = require('../utils/zong/otp');
const { subscribe_zong_num } = require('../utils/zong/subscription');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomMsBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function fetchProcessorCount() {
  try {
    const query = `SELECT * FROM processor
      WHERE status = 0
        AND created_at >= NOW() - INTERVAL 1 HOUR`;
    const [rows] = await db.execute(query);
    const count = rows.length;

    console.log('rows', rows);
    console.log(new Date().toISOString(), 'Processor numbers last hour with status 0:', count);

    for (const row of rows) {
      console.log(`ID: ${row.id}, Cellno: ${row.msisn}, Status: ${row.status}, Created At: ${row.created_at}`);
      await processProcessorRow(row);
    }
  } catch (error) {
    console.error('Error fetching processor count:', error);
  }
}
const processProcessorRow = async (row) => {
  try {
    const clientele = await checkZongNum({ cellno: row.msisn, subDomain: row.sub_domain });
    console.log(`Processor row ${row.id} (${row.msisn}) Zong check result:`, clientele);

    if (!clientele?.success || clientele?.carrier !== 'zong') {
      console.log(`Skipping row ${row.id}: not a Zong subscriber or check failed.`);
      return;
    }

    const otpResponse = await send_zong_otp({ cellno: row.msisn, traceID: `PROC_${row.id}_${Date.now()}` });
    console.log(`OTP sent for ${row.msisn} (row ${row.id}):`, otpResponse);

    const otpSuccess = otpResponse && otpResponse.success !== false && !otpResponse.error;
    if (!otpSuccess) {
      console.log(`OTP failed or returned invalid response for row ${row.id} (${row.msisn}). Skipping subscription.`);
      return;
    }

    const delayMs = randomMsBetween(5000, 7000);
    console.log(`Waiting ${delayMs}ms before subscribing ${row.msisn} (row ${row.id}).`);
    await sleep(delayMs);

    const package_type = clientele.record?.network_type === 'postpaid' ? 3 : 1;
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

async function startProcessorCron() {
  await fetchProcessorCount();
  // run at minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    console.log(new Date().toISOString(), 'Running hourly processor cron job');
    await fetchProcessorCount();
  });

  console.log('Processor cron scheduled: 0 * * * *');
}

if (require.main === module) {
  fetchProcessorCount()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  startProcessorCron,
  fetchProcessorCount,
};

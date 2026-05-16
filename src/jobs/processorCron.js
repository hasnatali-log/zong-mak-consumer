const cron = require('node-cron');
const db = require('../db');
const { checkZongNum } = require('../utils/zong/clientele');

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
  checkZongNum({ cellno: row.msisn, subDomain: row.sub_domain })
}
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

const cron = require('node-cron');
const db = require('../db');
const { processProcessorRows } = require('./processorBatch');

async function markRowsFetched(ids) {
  if (!ids.length) return;

  const placeholders = ids.map(() => '?').join(', ');
  const updateQuery = `UPDATE processor SET status = 1 WHERE id IN (${placeholders})`;
  await db.execute(updateQuery, ids);
  console.log(`Marked ${ids.length} rows as fetched.`);
}

async function fetchProcessorCount() {
  try {
    const query = process.env.TESTING == true ? "SELECT * FROM processor WHERE status = 0 AND created_at >= NOW() - INTERVAL 1 HOUR limit 1" : "SELECT * FROM processor WHERE status = 0 AND created_at >= NOW() - INTERVAL 1 HOUR";
    const [rows] = await db.execute(query);
    const count = rows.length;

    console.log(`Fetched ${count} processor rows.`);

    const ids = rows.map((row) => row.id);
    await markRowsFetched(ids);

    const metrics = await processProcessorRows(rows);
    console.log(`Processing complete: ${metrics.totalProcessed}/${metrics.totalFetched} numbers across ${metrics.totalBatches} batches.`);
  } catch (error) {
    console.error('Error fetching processor rows:', error);
  }
}

async function startProcessorCron() {
  // await fetchProcessorCount();
  // run at minute 0 of every hour
  cron.schedule('06 * * * *', async () => {
    console.log(new Date().toISOString(), 'Running hourly processor cron job');
    await fetchProcessorCount();
  });

  console.log('Processor cron scheduled: 34 * * * *');
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

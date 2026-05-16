const cron = require('node-cron');
const db = require('../db');
const { processProcessorRows } = require('./processorBatch');

async function markRowsFetched(ids) {
  if (!ids.length) return;

  const placeholders = ids.map(() => '?').join(', ');
  const updateQuery = `UPDATE processor SET status = 1 WHERE id IN (${placeholders})`;
  await db.execute(updateQuery, ids);
  console.log(`Marked ${ids.length} processor rows as fetched with status 1.`);
}

async function fetchProcessorCount() {
  try {
    const query = process.env.TESTING == true ? "SELECT * FROM processor WHERE status = 0 AND created_at >= NOW() - INTERVAL 1 HOUR limit 1" : "SELECT * FROM processor WHERE status = 0 AND created_at >= NOW() - INTERVAL 1 HOUR";
    const [rows] = await db.execute(query);
    const count = rows.length;

    console.log('rows', rows);
    console.log(new Date().toISOString(), 'Processor numbers last hour with status 0:', count);

    const ids = rows.map((row) => row.id);
    await markRowsFetched(ids);

    await processProcessorRows(rows);
  } catch (error) {
    console.error('Error fetching processor count:', error);
  }
}

async function startProcessorCron() {
  // await fetchProcessorCount();
  // run at minute 0 of every hour
  cron.schedule('32 * * * *', async () => {
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

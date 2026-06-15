const db = require('../db');
const { processProcessorRows } = require('./processorBatch');

const FETCH_BATCH_SIZE = 60;
const IDLE_DELAY_MS = 5000;

async function markRowsFetched(ids) {
  if (!ids.length) return;
  const placeholders = ids.map(() => '?').join(', ');
  await db.execute(`UPDATE processor SET status = 1 WHERE id IN (${placeholders})`, ids);
  console.log(`Marked ${ids.length} rows as fetched.`);
}

async function countPendingRows() {
  const [[{ count }]] = await db.execute(
    `SELECT COUNT(*) AS count FROM processor WHERE status = 0 AND created_at >= NOW() - INTERVAL 24 HOUR`
  );
  return Number(count);
}

async function fetchBatch() {
  const limit = process.env.TESTING == true ? 1 : FETCH_BATCH_SIZE;
  const [rows] = await db.execute(
    `SELECT * FROM processor WHERE status = 0 AND created_at >= NOW() - INTERVAL 24 HOUR ORDER BY created_at ASC LIMIT ${limit}`
  );
  return rows;
}

const MIN_PENDING_TO_START = 180;

async function runContinuousProcessor() {
  console.log(new Date().toISOString(), 'Starting continuous processor...');

  while (true) {
    try {
      const pending = await countPendingRows();

      if (pending < MIN_PENDING_TO_START) {
        console.log(`${new Date().toISOString()} Waiting — only ${pending} pending rows (need ${MIN_PENDING_TO_START}).`);
        await new Promise((resolve) => setTimeout(resolve, IDLE_DELAY_MS));
        continue;
      }

      const rows = await fetchBatch();

      if (rows.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, IDLE_DELAY_MS));
        continue;
      }

      const ids = rows.map((row) => row.id);
      await markRowsFetched(ids);

      const metrics = await processProcessorRows(rows);
      const o = metrics.outcomes;
      console.log(
        `${new Date().toISOString()} Batch complete: ${metrics.totalFetched} fetched across ${metrics.totalBatches} batches — ` +
          `subscribed=${o.subscribed}, sub_failed=${o.sub_failed}, ` +
          `not_zong=${o.not_zong}, otp_failed=${o.otp_failed}, ` +
          `already_subscribed=${o.already_subscribed}, no_msisdn=${o.no_msisdn}, error=${o.error}`
      );
    } catch (error) {
      console.error('Error in continuous processor:', error);
      await new Promise((resolve) => setTimeout(resolve, IDLE_DELAY_MS));
    }
  }
}

function startProcessorCron() {
  runContinuousProcessor();
  console.log('Continuous processor started.');
}

if (require.main === module) {
  runContinuousProcessor().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  startProcessorCron,
};

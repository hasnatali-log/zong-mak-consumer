const cron = require('node-cron');
const db = require('../db');
const { weatherPool } = require('../db');

async function syncSubscriberStatus() {
    console.log(`[syncSubscriberStatus] ${new Date().toISOString()} Starting sync...`);

    const [processorRows] = await db.execute(
        'SELECT id, msisdn FROM processor WHERE status = 0 AND msisdn IS NOT NULL and Date(created_at) >= CURDATE()'
    );

    if (processorRows.length === 0) {
        console.log('[syncSubscriberStatus] No unprocessed rows found.');
        return;
    }

    const msisdns = processorRows.map(r => r.msisdn);
    const placeholders = msisdns.map(() => '?').join(', ');

    const [subscriberRows] = await weatherPool.execute(
        `SELECT mobile FROM subscriber WHERE mobile IN (${placeholders})`,
        msisdns
    );

    if (subscriberRows.length === 0) {
        console.log('[syncSubscriberStatus] No matching subscribers found in processor.');
        return;
    }

    const matchedMsisdns = new Set(subscriberRows.map(r => r.mobile));
    const idsToUpdate = processorRows
        .filter(r => matchedMsisdns.has(r.msisdn))
        .map(r => r.id);

    if (idsToUpdate.length === 0) {
        console.log('[syncSubscriberStatus] No processor rows matched subscriber records.');
        return;
    }

    const idPlaceholders = idsToUpdate.map(() => '?').join(', ');
    await db.execute(
        `UPDATE processor SET status = 1 WHERE id IN (${idPlaceholders})`,
        idsToUpdate
    );

    console.log(`[syncSubscriberStatus] Marked ${idsToUpdate.length}/${processorRows.length} rows as status=1 (already subscribed).`);
}

function startSubscriberSyncJob() {
    cron.schedule('*/15 * * * *', async () => {
        try {
            await syncSubscriberStatus();
        } catch (err) {
            console.error('[syncSubscriberStatus] Error:', err);
        }
    });

    console.log('Subscriber sync job scheduled (every 15 minutes).');
}

module.exports = { startSubscriberSyncJob };

const { processProcessorRow } = require('./processorRow');
const { weatherPool } = require('../db');

const BATCH_SIZE = 100;

const chunkRows = (rows, size) => {
    const chunks = [];
    for (let i = 0; i < rows.length; i += size) {
        chunks.push(rows.slice(i, i + size));
    }
    return chunks;
};

const isWeatherSubscriber = async (msisdn) => {
    try {
        const [rows] = await weatherPool.execute('SELECT 1 FROM subscriber WHERE mobile = ?', [msisdn]);
        return rows.length > 0;
    } catch (error) {
        console.error(`Failed checking WeatherWalay subscriber status for ${msisdn}:`, error);
        return false;
    }
};

const processBatch = async (batch, batchIndex, totalBatches, startIndex, totalFetched) => {
    console.log(`Batch ${batchIndex + 1}/${totalBatches}: ${batch.length} rows.`);

    const counts = { no_msisdn: 0, already_subscribed: 0, not_zong: 0, otp_failed: 0, subscribed: 0, sub_failed: 0, error: 0 };

    for (const [rowIndex, row] of batch.entries()) {
        const currentNumber = startIndex + rowIndex + 1;

        if (!row?.msisdn) {
            console.log(`Skipping row ${row.id || 'unknown'} (${currentNumber}/${totalFetched}): missing msisdn.`);
            counts.no_msisdn += 1;
            continue;
        }

        const alreadySubscribed = await isWeatherSubscriber(row.msisdn);
        if (alreadySubscribed) {
            console.log(`Skipping row ${row.id} (${currentNumber}/${totalFetched}): already subscribed.`);
            counts.already_subscribed += 1;
            continue;
        }

        const outcome = await processProcessorRow(row, currentNumber, totalFetched);
        counts[outcome] = (counts[outcome] ?? 0) + 1;
    }

    return counts;
};

const processProcessorRows = async (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        console.log('No processor rows to process.');
        return { totalFetched: 0, totalBatches: 0, outcomes: {} };
    }

    const batches = chunkRows(rows, BATCH_SIZE);
    const totals = { no_msisdn: 0, already_subscribed: 0, not_zong: 0, otp_failed: 0, subscribed: 0, sub_failed: 0, error: 0 };

    for (const [batchIndex, batch] of batches.entries()) {
        const startIndex = batchIndex * BATCH_SIZE;
        const counts = await processBatch(batch, batchIndex, batches.length, startIndex, rows.length);
        for (const key of Object.keys(totals)) {
            totals[key] += counts[key] ?? 0;
        }
    }

    return {
        totalFetched: rows.length,
        totalBatches: batches.length,
        outcomes: totals,
    };
};

module.exports = {
    processProcessorRows,
};

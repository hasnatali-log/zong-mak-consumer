const { processProcessorRow } = require('./processorRow');
const { weatherPool } = require('../db');

const BATCH_SIZE = 30;

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

const processBatch = async (batch, batchIndex, totalBatches) => {
    console.log(`Processing batch ${batchIndex + 1}/${totalBatches} with ${batch.length} rows.`);

    for (const row of batch) {
        const alreadySubscribed = await isWeatherSubscriber(row?.msisdn);
        if (alreadySubscribed) {
            console.log(`Skipping row ${row.id}: ${row.msisn} is already a subscriber in WeatherWalay.`);
            continue;
        }

        await processProcessorRow(row);
    }
};

const processProcessorRows = async (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        console.log('No processor rows to process.');
        return;
    }

    const batches = chunkRows(rows, BATCH_SIZE);

    for (const [batchIndex, batch] of batches.entries()) {
        await processBatch(batch, batchIndex, batches.length);
    }
};

module.exports = {
    processProcessorRows,
};

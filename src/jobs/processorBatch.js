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

const processBatch = async (batch, batchIndex, totalBatches, startIndex, totalFetched) => {
    console.log(`Batch ${batchIndex + 1}/${totalBatches}: ${batch.length} rows.`);

    let processedInBatch = 0;
    for (const [rowIndex, row] of batch.entries()) {
        const currentNumber = startIndex + rowIndex + 1;

        if (!row?.msisdn) {
            console.log(`Skipping row ${row.id || 'unknown'} (${currentNumber}/${totalFetched}): missing msisdn.`);
            continue;
        }

        const alreadySubscribed = await isWeatherSubscriber(row.msisdn);
        if (alreadySubscribed) {
            console.log(`Skipping row ${row.id} (${currentNumber}/${totalFetched}): already subscribed.`);
            continue;
        }

        await processProcessorRow(row, currentNumber, totalFetched);
        processedInBatch += 1;
    }

    return processedInBatch;
};

const processProcessorRows = async (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        console.log('No processor rows to process.');
        return { totalFetched: 0, totalBatches: 0, totalProcessed: 0 };
    }

    const batches = chunkRows(rows, BATCH_SIZE);
    let totalProcessed = 0;

    for (const [batchIndex, batch] of batches.entries()) {
        const startIndex = batchIndex * BATCH_SIZE;
        totalProcessed += await processBatch(batch, batchIndex, batches.length, startIndex, rows.length);
    }

    return {
        totalFetched: rows.length,
        totalBatches: batches.length,
        totalProcessed,
    };
};

module.exports = {
    processProcessorRows,
};

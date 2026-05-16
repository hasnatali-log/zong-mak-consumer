const { processProcessorRow } = require('./processorRow');

const BATCH_SIZE = 30;

const chunkRows = (rows, size) => {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
};

const processProcessorRows = async (rows) => {
  const batches = chunkRows(rows, BATCH_SIZE);

  for (const [batchIndex, batch] of batches.entries()) {
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} rows.`);
    for (const row of batch) {
      await processProcessorRow(row);
    }
  }
};

module.exports = {
  processProcessorRows,
};

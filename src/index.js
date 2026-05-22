require('dotenv').config();
const app = require('./app');
const { startProcessorCron } = require('./jobs/processorCron');
const { startSubscriberSyncJob } = require('./jobs/syncSubscriberStatus');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

startProcessorCron();
startSubscriberSyncJob();

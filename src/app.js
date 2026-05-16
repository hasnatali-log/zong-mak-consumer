const express = require('express');
const processorRouter = require('./routes/processor');

const app = express();
app.use(express.json());
app.use('/api/processor', processorRouter);

app.get('/', (req, res) => {
  res.json({ message: 'zong-mak-consumer is running' });
});

module.exports = app;

const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT msisdn FROM processor');
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch processor rows:', error);
    res.status(500).json({ error: 'Unable to fetch processor rows' });
  }
});

module.exports = router;

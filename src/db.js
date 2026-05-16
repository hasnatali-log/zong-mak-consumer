const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zong_mak',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const weatherPool = mysql.createPool({
  host: process.env.WEATHER_DB_HOST || "192.168.12.177",
  port: Number(process.env.WEATHER_DB_PORT || 3306),
  user: process.env.WEATHER_DB_USER || "admin",
  password: process.env.WEATHER_DB_PASSWORD || "Z0ng@34df6o0",
  database: process.env.WEATHER_DB_NAME || 'WeatherWalay',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
module.exports.weatherPool = weatherPool;

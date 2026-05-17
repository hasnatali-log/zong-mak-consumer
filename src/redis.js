const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const redisClient = createClient({ url: redisUrl });
const otpRedis = createClient({ url: redisUrl, database: 2 });

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

otpRedis.on('error', (err) => {
  console.error('Redis OTP client error:', err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect primary Redis client:', error);
  }

  try {
    await otpRedis.connect();
  } catch (error) {
    console.error('Failed to connect OTP Redis client:', error);
  }
})();

module.exports = {
  redisClient,
  otpRedis,
};

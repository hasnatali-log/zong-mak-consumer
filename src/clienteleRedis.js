const { createClient } = require('redis');

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || '';

const redisUrl = `redis://:${redisPassword}@${redisHost}:${redisPort}`;

const redisClient = createClient({
    url: redisUrl,
});

const clienteleRedis = createClient({
    url: redisUrl,
    database: 3,
});

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});

clienteleRedis.on('error', (err) => {
    console.error('Redis OTP client error:', err);
});

(async () => {
    try {
        await redisClient.connect();
        console.log('Primary Redis connected');
    } catch (error) {
        console.error('Failed to connect primary Redis client:', error);
    }

    try {
        await clienteleRedis.connect();
        console.log('OTP Redis connected');
    } catch (error) {
        console.error('Failed to connect OTP Redis client:', error);
    }
})();

module.exports = {
    redisClient,
    clienteleRedis,
};
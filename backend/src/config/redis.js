const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis server');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
  // Depending on the app's needs, you might want to exit or attempt reconnection.
  // For now, we'll just log the error.
});

// It's good practice to connect explicitly.
// The client will attempt to reconnect automatically if the connection is lost.
async function connectRedis() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error('Failed to connect to Redis on startup:', err);
      // Handle startup connection failure (e.g., exit, or run in a degraded mode)
    }
  }
}

// Call connectRedis on module load or before server start.
// For simplicity here, we'll export it to be called in server.js or app.js.

module.exports = {
  redisClient,
  connectRedis,
};

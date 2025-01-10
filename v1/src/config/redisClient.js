const redis = require("redis");
const Logger = require("../scripts/logger/board");

let redisClient = null;

const createRedisClient = async () => {
  try {
    if (redisClient !== null) {
      return redisClient;
    }

    const client = redis.createClient({
      url: 'redis://forsicoRedisCache.redis.cache.windows.net:6379',
      password: 'j1hRUVSdyRqq3ss4608oA0IuHIGpoI17UAzCaL4hUvI=',
      socket: {
        connectTimeout: 10000,
        keepAlive: 5000,
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
      }
    });

    client.on('error', (err) => {
      Logger.log('error', 'Redis Client Error:', err);
    });

    client.on('connect', () => Logger.log('info', 'Redis Client Connected'));
    client.on('ready', () => Logger.log('info', 'Redis Client Ready'));
    client.on('reconnecting', () => Logger.log('warn', 'Redis Client Reconnecting'));
    client.on('end', () => {
      Logger.log('warn', 'Redis Client Connection Ended');
      redisClient = null;
    });

    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    Logger.log('error', 'Failed to create Redis client:', error);
    return null;
  }
};

const getRedisClient = async () => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return await createRedisClient();
    }
    return redisClient;
  } catch (error) {
    Logger.log('error', 'Error getting Redis client:', error);
    return null;
  }
};

module.exports = getRedisClient;
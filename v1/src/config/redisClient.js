const redis = require("redis");
const Logger = require("../scripts/logger/board");

const createRedisClient = async () => {
  const client = redis.createClient({
    url: 'redis://forsicoRedisCache.redis.cache.windows.net:6379',
    password: 'j1hRUVSdyRqq3ss4608oA0IuHIGpoI17UAzCaL4hUvI='
  });

  client.on('error', (err) => Logger.log('error', 'Redis Client Error:', err));
  client.on('connect', () => Logger.log('info', 'Redis Client Connected'));
  client.on('ready', () => Logger.log('info', 'Redis Client Ready'));
  client.on('reconnecting', () => Logger.log('warn', 'Redis Client Reconnecting'));

  await client.connect();

  return client;
};

let redisClient;

const getClient = async () => {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
  return redisClient;
};

module.exports = getClient;
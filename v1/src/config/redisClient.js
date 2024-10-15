const redis = require("redis");
const redisClient = redis.createClient({
  url: 'redis://forsicoRedisCache.redis.cache.windows.net:6379',
  password: 'j1hRUVSdyRqq3ss4608oA0IuHIGpoI17UAzCaL4hUvI='
});

module.exports = redisClient;
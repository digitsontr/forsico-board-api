const redis = require("redis");

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

module.exports = redisClient;
const redis = require("../../config/redisClient");

const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("There is an issue on cache reading:", err);
    return null;
  }
};

const setCache = async (key, value, ttl = 600) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    console.error("There is an issue on cache writing:", err);
  }
};

const delCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error("There is an issue on cache removing:", err);
  }
};

module.exports = {
  getCache,
  setCache,
  delCache,
};

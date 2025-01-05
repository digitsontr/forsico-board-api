const getRedisClient = require("../config/redisClient");
const Logger = require("../scripts/logger/board");

class CacheService {
  static generateKey(tenantId, entity, identifier) {
    return `tenant:${tenantId}:${entity}:${identifier}`;
  }

  static async get(key) {
    try {
      const redis = await getRedisClient();
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      Logger.log('error', `Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key, data, ttl = 300) {
    try {
      const redis = await getRedisClient();
      await redis.set(key, JSON.stringify(data), {
        EX: ttl
      });
      return true;
    } catch (error) {
      Logger.log('error', `Cache set error for key ${key}:`, error);
      return false;
    }
  }

  static async del(key) {
    try {
      const redis = await getRedisClient();
      await redis.del(key);
      return true;
    } catch (error) {
      Logger.log('error', `Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  static async delByPattern(pattern) {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      return true;
    } catch (error) {
      Logger.log('error', `Cache delete by pattern error for ${pattern}:`, error);
      return false;
    }
  }

  static async invalidateTenantCache(tenantId) {
    return this.delByPattern(`tenant:${tenantId}:*`);
  }

  static async invalidateEntityCache(tenantId, entity) {
    return this.delByPattern(`tenant:${tenantId}:${entity}:*`);
  }
}

const CACHE_TTL = {
  WORKSPACE: 3600,    // 1 hour
  BOARD: 900,        // 15 minutes
  TASK_LIST: 300,    // 5 minutes
  USER: 1800,        // 30 minutes
  PERMISSIONS: 1800  // 30 minutes
};

module.exports = {
  CacheService,
  CACHE_TTL
}; 
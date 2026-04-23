/**
 * Redis Caching Configuration
 * Implements Redis cache layer for high-traffic scenario
 */

const redis = require('redis');
const envConfig = require('./env');
const logger = require('../utils/logger');

let redisClient = null;

const initRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: envConfig.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > envConfig.REDIS_MAX_RETRIES) {
            logger.error('No more retries. Redis connection failed.');
            return new Error('Max retries reached');
          }
          return retries * 100;
        },
      },
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });
    
    redisClient.on('connect', () => {
      logger.info('✓ Redis connected successfully');
    });
    
    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
};

const getRedisClient = () => {
  return redisClient;
};

// Cache helper functions
const setCache = async (key, value, ttl = envConfig.REDIS_CACHE_TTL) => {
  if (!redisClient) return;
  
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    logger.error(`Cache SET failed for ${key}:`, error);
  }
};

const getCache = async (key) => {
  if (!redisClient) return null;
  
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(cached);
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Cache GET failed for ${key}:`, error);
    return null;
  }
};

const deleteCache = async (key) => {
  if (!redisClient) return;
  
  try {
    await redisClient.del(key);
    logger.debug(`Cache DELETE: ${key}`);
  } catch (error) {
    logger.error(`Cache DELETE failed for ${key}:`, error);
  }
};

const clearPattern = async (pattern) => {
  if (!redisClient) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache cleared ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error(`Cache clear failed for pattern ${pattern}:`, error);
  }
};

const getCacheStats = async () => {
  if (!redisClient) return null;
  
  try {
    const info = await redisClient.info('stats');
    const memoryInfo = await redisClient.info('memory');
    return { stats: info, memory: memoryInfo };
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    return null;
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  clearPattern,
  getCacheStats,
};

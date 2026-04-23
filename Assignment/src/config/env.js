/**
 * Environment Configuration
 * Loads environment variables and provides validated configuration
 */

require('dotenv').config();

const envConfig = {
  // Server Config
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || 'localhost',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
  MONGODB_POOL_SIZE: parseInt(process.env.MONGODB_POOL_SIZE) || 50,
  MONGODB_MAX_IDLE_TIME: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 60000,
  
  // Redis Cache
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_CACHE_TTL: parseInt(process.env.REDIS_CACHE_TTL) || 3600, // 1 hour default
  REDIS_MAX_RETRIES: parseInt(process.env.REDIS_MAX_RETRIES) || 10,
  
  // Message Queue (Bull)
  QUEUE_NAME: process.env.QUEUE_NAME || 'orders',
  QUEUE_CONCURRENCY: parseInt(process.env.QUEUE_CONCURRENCY) || 50,
  
  // External Services
  PAYMENT_GATEWAY_URL: process.env.PAYMENT_GATEWAY_URL || 'https://api.payment.local',
  PAYMENT_GATEWAY_TIMEOUT: parseInt(process.env.PAYMENT_GATEWAY_TIMEOUT) || 10000,
  
  // Scaling
  AUTO_SCALE_ENABLED: process.env.AUTO_SCALE_ENABLED === 'true',
  MIN_DYNOS: parseInt(process.env.MIN_DYNOS) || 1,
  MAX_DYNOS: parseInt(process.env.MAX_DYNOS) || 500,
  SCALE_UP_THRESHOLD: parseInt(process.env.SCALE_UP_THRESHOLD) || 80, // CPU %
  SCALE_DOWN_THRESHOLD: parseInt(process.env.SCALE_DOWN_THRESHOLD) || 30, // CPU %
  
  // Monitoring
  NEW_RELIC_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY,
  NEW_RELIC_APP_NAME: process.env.NEW_RELIC_APP_NAME || 'ecommerce-platform',
  ALERT_RESPONSE_TIME_THRESHOLD: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD) || 2000, // ms
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret',
  
  // Cost Management
  BUDGET_LIMIT: parseInt(process.env.BUDGET_LIMIT) || 50000,
  HOURLY_COST_LIMIT: parseInt(process.env.HOURLY_COST_LIMIT) || 2000,
};

// Validate critical config
const validateConfig = () => {
  const requiredInProduction = ['MONGODB_URI'];
  
  if (envConfig.NODE_ENV === 'production') {
    requiredInProduction.forEach(key => {
      if (!envConfig[key]) {
        throw new Error(`Missing critical environment variable: ${key}`);
      }
    });
  }
};

validateConfig();

module.exports = envConfig;

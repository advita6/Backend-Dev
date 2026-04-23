/**
 * Database Configuration
 * MongoDB with connection pooling and resilience
 */

const mongoose = require('mongoose');
const envConfig = require('./env');
const logger = require('../utils/logger');

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 10;

const mongooseOptions = {
  maxPoolSize: envConfig.MONGODB_POOL_SIZE, // Connection pooling
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  maxIdleTimeMS: envConfig.MONGODB_MAX_IDLE_TIME,
  // Retry logic
  retryWrites: true,
  retryReads: true,
  w: 'majority',
};

const connectDB = async () => {
  try {
    logger.info(`Attempting to connect to MongoDB (attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS})...`);
    
    await mongoose.connect(envConfig.MONGODB_URI, mongooseOptions);
    
    logger.info('✓ MongoDB connected successfully');
    connectionAttempts = 0; // Reset on successful connection
    
    // Monitor connection health
    monitorConnectionHealth();
    
    return mongoose.connection;
  } catch (error) {
    connectionAttempts++;
    
    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      logger.error('Failed to connect to MongoDB after max attempts:', error);
      process.exit(1);
    }
    
    // Exponential backoff retry
    const retryDelay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 10000);
    logger.warn(`MongoDB connection failed. Retrying in ${retryDelay}ms...`);
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(connectDB()), retryDelay);
    });
  }
};

const monitorConnectionHealth = () => {
  const db = mongoose.connection;
  
  db.on('connected', () => {
    logger.info('✓ Mongoose connected to MongoDB');
  });
  
  db.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
  });
  
  db.on('disconnected', () => {
    logger.warn('Mongoose disconnected from MongoDB');
  });
  
  // Connection pool monitoring
  setInterval(() => {
    const connectedCount = db.collection.db.topology?.s?.poolSize || 0;
    logger.debug(`DB Pool Status - Connected: ${connectedCount}, Options: ${envConfig.MONGODB_POOL_SIZE}`);
  }, 60000);
};

const getConnectionStats = () => {
  const db = mongoose.connection;
  return {
    state: db.readyState,
    host: db.host,
    name: db.name,
    poolSize: envConfig.MONGODB_POOL_SIZE,
  };
};

module.exports = {
  connectDB,
  getConnectionStats,
  mongooseOptions,
};

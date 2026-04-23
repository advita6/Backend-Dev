/**
 * Main Server Entry Point
 * Express application with comprehensive deployment features
 */

require('dotenv').config();

// New Relic monitoring (should be first)
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const envConfig = require('./config/env');
const { connectDB } = require('./config/database');
const { initRedis } = require('./config/redis');
const { logger, pinoHttp } = require('./utils/logger');

const app = express();

// ============= SECURITY MIDDLEWARE =============
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// ============= COMPRESSION & BODY PARSING =============
app.use(compression()); // gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============= LOGGING & MONITORING =============
app.use(pinoHttp);

// ============= REQUEST METRICS MIDDLEWARE =============
app.use((req, res, next) => {
  res.startTime = Date.now();
  
  // Intercept res.send to capture metrics
  const originalSend = res.send;
  res.send = function (data) {
    const responseTime = Date.now() - res.startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Alert if response time exceeds threshold
    if (responseTime > envConfig.ALERT_RESPONSE_TIME_THRESHOLD) {
      logger.warn({
        type: 'SLOW_REQUEST',
        path: req.path,
        method: req.method,
        responseTime,
        threshold: envConfig.ALERT_RESPONSE_TIME_THRESHOLD,
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

// ============= HEALTH CHECK ENDPOINT =============
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: envConfig.NODE_ENV,
    };
    
    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ status: 'DOWN', error: error.message });
  }
});

// ============= METRICS ENDPOINT =============
app.get('/metrics', async (req, res) => {
  try {
    const { getConnectionStats } = require('./config/database');
    const { getCacheStats } = require('./config/redis');
    
    const metrics = {
      database: getConnectionStats(),
      cache: await getCacheStats(),
      process: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
    
    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= API ROUTES =============
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));

// ============= ERROR HANDLING =============
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
      timestamp: new Date().toISOString(),
    },
  });
});

// ============= 404 HANDLER =============
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// ============= STARTUP SEQUENCE =============
const startServer = async () => {
  try {
    logger.info('Starting e-commerce platform server...');
    
    // Connect to database
    await connectDB();
    
    // Initialize Redis cache
    await initRedis();
    
    // Start Express server
    const server = app.listen(envConfig.PORT, envConfig.HOST, () => {
      logger.info(`✓ Server running on http://${envConfig.HOST}:${envConfig.PORT}`);
      logger.info(`✓ Environment: ${envConfig.NODE_ENV}`);
      logger.info(`✓ Database Pool Size: ${envConfig.MONGODB_POOL_SIZE}`);
      logger.info(`✓ Auto-scaling: ${envConfig.AUTO_SCALE_ENABLED ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;

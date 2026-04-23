/**
 * Logging Configuration
 * Structured logging with Pino
 */

const pino = require('pino');
const envConfig = require('../config/env');

const loggerConfig = {
  level: process.env.LOG_LEVEL || (envConfig.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport:
    envConfig.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

const logger = pino(loggerConfig);

// Request logger middleware
const pinoHttp = require('pino-http')({
  logger,
  customLogLevel: (req, res, err) => {
    const status = res.statusCode;
    if (status >= 400 && status < 500) return 'warn';
    if (status >= 500) return 'error';
    if (status >= 300 && status < 400) return 'info';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => {
      return req.url === '/health' || req.url.startsWith('/metrics');
    },
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode} (${res.getHeader('X-Response-Time')}ms)`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err?.message}`;
  },
});

// Helper functions for structured logging
const logRequest = (req, data = {}) => {
  logger.info({
    type: 'REQUEST',
    method: req.method,
    path: req.path,
    ip: req.ip,
    ...data,
  });
};

const logError = (error, context = {}) => {
  logger.error({
    type: 'ERROR',
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

const logEvent = (event, data = {}) => {
  logger.info({
    type: 'EVENT',
    event,
    ...data,
  });
};

const logMetric = (metric, value, tags = {}) => {
  logger.debug({
    type: 'METRIC',
    metric,
    value,
    tags,
  });
};

module.exports = {
  logger,
  pinoHttp,
  logRequest,
  logError,
  logEvent,
  logMetric,
};

/**
 * Checkout API Routes
 * Handles checkout process with payment gateway integration and failure handling
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getCache, deleteCache } = require('../config/redis');
const { logger } = require('../utils/logger');
const envConfig = require('../config/env');

// Circuit breaker for payment gateway
class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
      logger.info('Circuit breaker transitioning to HALF_OPEN');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('Circuit breaker transitioned to CLOSED');
    }
  }
  
  onFailure() {
    this.failureCount++;
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      logger.warn(`Circuit breaker opened. Next attempt at ${new Date(this.nextAttempt)}`);
    }
  }
}

const paymentCircuitBreaker = new CircuitBreaker();
const pendingOrders = [];

// Initiate checkout
router.post('/initiate', async (req, res, next) => {
  try {
    const { sessionId, cart, email } = req.body;
    
    if (!sessionId || !cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Invalid cart or sessionId' });
    }
    
    const order = {
      orderId: `ORDER-${Date.now()}`,
      sessionId,
      email,
      items: cart.items,
      total: cart.total,
      status: 'PROCESSING',
      createdAt: new Date(),
    };
    
    logger.info(`Checkout initiated for order ${order.orderId}`);
    
    res.json({
      orderId: order.orderId,
      total: order.total,
      message: 'Checkout initiated',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error initiating checkout:', error);
    next(error);
  }
});

// Process payment
router.post('/pay', async (req, res, next) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Try to process payment with circuit breaker pattern
    let paymentResult;
    const paymentSuccess = await paymentCircuitBreaker
      .execute(async () => {
        try {
          const response = await axios.post(
            `${envConfig.PAYMENT_GATEWAY_URL}/charge`,
            { orderId, amount, paymentMethod },
            { timeout: envConfig.PAYMENT_GATEWAY_TIMEOUT }
          );
          return response.data;
        } catch (error) {
          throw new Error(`Payment gateway error: ${error.message}`);
        }
      })
      .catch(async (error) => {
        // Payment gateway is down or circuit is open
        logger.warn(`Payment processing failed: ${error.message}. Queueing order...`);
        
        // Queue order for later processing
        pendingOrders.push({
          orderId,
          amount,
          paymentMethod,
          queuedAt: new Date(),
          attempts: 0,
        });
        
        return null;
      });
    
    if (paymentSuccess) {
      logger.info(`Payment processed successfully for order ${orderId}`);
      
      res.json({
        orderId,
        status: 'COMPLETED',
        transactionId: paymentSuccess.transactionId,
        message: 'Payment processed successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Order queued
      res.status(202).json({
        orderId,
        status: 'QUEUED',
        message: 'Payment gateway unavailable. Order has been queued for processing.',
        estimatedTime: '5-10 minutes',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Error processing payment:', error);
    next(error);
  }
});

// Get pending orders queue status
router.get('/queue/status', (req, res) => {
  res.json({
    pendingOrders: pendingOrders.length,
    orders: pendingOrders.map((o) => ({
      orderId: o.orderId,
      amount: o.amount,
      queuedAt: o.queuedAt,
      attempts: o.attempts,
    })),
    circuitBreakerState: paymentCircuitBreaker.state,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

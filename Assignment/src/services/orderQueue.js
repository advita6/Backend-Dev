const Bull = require('bull');
const envConfig = require('../config/env');
const logger = require('../utils/logger');
const axios = require('axios');
const Order = require('../models/Order');

// Initialize the order queue
const orderQueue = new Bull(envConfig.QUEUE_NAME, envConfig.REDIS_URL);

// Process the queue
orderQueue.process(envConfig.QUEUE_CONCURRENCY, async (job) => {
  const { orderId, amount, paymentMethod } = job.data;
  
  logger.info(`Processing queued payment for order: ${orderId} (Attempt: ${job.attemptsMade + 1})`);
  
  try {
    // Simulate payment gateway call
    const response = await axios.post(
      `${envConfig.PAYMENT_GATEWAY_URL}/charge`,
      { orderId, amount, paymentMethod },
      { timeout: envConfig.PAYMENT_GATEWAY_TIMEOUT }
    );
    
    // Update order status in DB
    await Order.findOneAndUpdate(
      { orderId },
      { 
        status: 'COMPLETED',
        paymentInfo: {
          transactionId: response.data.transactionId,
          method: paymentMethod,
          timestamp: new Date()
        }
      }
    );
    
    logger.info(`Successfully processed queued payment for order: ${orderId}`);
    return response.data;
    
  } catch (error) {
    logger.error(`Failed to process queued payment for order: ${orderId}. Error: ${error.message}`);
    
    // If it's a gateway error, we let Bull handle the retry based on configuration
    throw error;
  }
});

// Event listeners
orderQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed for order ${job.data.orderId}: ${err.message}`);
  
  // If max retries reached, mark order as failed
  if (job.attemptsMade >= job.opts.attempts) {
    Order.findOneAndUpdate(
      { orderId: job.data.orderId },
      { status: 'FAILED' }
    ).exec().catch(e => logger.error(`Failed to update order status to FAILED: ${e.message}`));
  }
});

orderQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed successfully for order ${job.data.orderId}`);
});

module.exports = {
  orderQueue,
  addToQueue: (data) => orderQueue.add(data, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true
  })
};

/**
 * Orders API Routes
 * Handles order tracking and management
 */

const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../config/redis');
const { logger } = require('../utils/logger');

const orders = {};

// Get order by ID
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const cacheKey = `order:${orderId}`;
    
    let order = await getCache(cacheKey);
    if (!order) {
      order = orders[orderId];
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found', orderId });
    }
    
    res.json({
      data: order,
      cached: !!await getCache(cacheKey),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    next(error);
  }
});

// Create order
router.post('/', async (req, res, next) => {
  try {
    const { email, items, total, shippingAddress } = req.body;
    
    if (!email || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const order = {
      orderId: `ORD-${Date.now()}`,
      email,
      items,
      total,
      shippingAddress,
      status: 'CONFIRMED',
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    };
    
    // Save to cache and memory
    const cacheKey = `order:${order.orderId}`;
    await setCache(cacheKey, order, 86400); // Cache for 24 hours
    orders[order.orderId] = order;
    
    logger.info(`Order created: ${order.orderId}`);
    
    res.status(201).json({
      data: order,
      message: 'Order created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    next(error);
  }
});

// Get orders by email
router.get('/email/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const cacheKey = `orders:email:${email}`;
    
    let cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        data: cached,
        cached: true,
        email,
        timestamp: new Date().toISOString(),
      });
    }
    
    const userOrders = Object.values(orders).filter((o) => o.email === email);
    
    // Cache results
    await setCache(cacheKey, userOrders, 600);
    
    res.json({
      data: userOrders,
      cached: false,
      email,
      count: userOrders.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching user orders:', error);
    next(error);
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }
    
    const order = orders[orderId];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = status;
    order.updatedAt = new Date();
    
    // Update cache
    const cacheKey = `order:${orderId}`;
    await setCache(cacheKey, order, 86400);
    
    logger.info(`Order ${orderId} status updated to ${status}`);
    
    res.json({
      data: order,
      message: 'Order status updated',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating order:', error);
    next(error);
  }
});

module.exports = router;

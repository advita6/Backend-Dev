/**
 * Orders API Routes
 * Handles order tracking and management
 */

const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../config/redis');
const { logger } = require('../utils/logger');

const Order = require('../models/Order');

// Get order by ID
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const cacheKey = `order:${orderId}`;
    
    // Try cache first
    let order = await getCache(cacheKey);
    
    if (!order) {
      order = await Order.findOne({ orderId }).lean();
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found', orderId });
    }
    
    // Cache if it was a DB hit
    if (!await getCache(cacheKey)) {
      await setCache(cacheKey, order, 3600);
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
    
    const newOrder = new Order({
      orderId: `ORD-${Date.now()}`,
      email,
      items,
      total,
      status: 'PENDING',
    });
    
    await newOrder.save();
    
    // Cache the new order
    const cacheKey = `order:${newOrder.orderId}`;
    await setCache(cacheKey, newOrder.toObject(), 86400); // Cache for 24 hours
    
    logger.info(`Order created: ${newOrder.orderId}`);
    
    res.status(201).json({
      data: newOrder,
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
    
    const userOrders = await Order.find({ email }).sort({ createdAt: -1 }).lean();
    
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
    
    const order = await Order.findOneAndUpdate(
      { orderId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update cache
    const cacheKey = `order:${orderId}`;
    await setCache(cacheKey, order.toObject(), 86400);
    
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

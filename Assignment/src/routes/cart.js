/**
 * Shopping Cart API Routes
 * Handles cart operations
 */

const express = require('express');
const router = express.Router();
const { getCache, setCache, deleteCache } = require('../config/redis');
const { logger } = require('../utils/logger');

// In-memory cart storage (in production, use database/cache)
const carts = {};

// Get cart
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const cacheKey = `cart:${sessionId}`;
    
    let cart = await getCache(cacheKey);
    if (!cart) {
      cart = carts[sessionId] || { items: [], total: 0 };
    }
    
    res.json({
      data: cart,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching cart:', error);
    next(error);
  }
});

// Add to cart
router.post('/:sessionId/add', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { productId, quantity, price } = req.body;
    
    if (!productId || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const cacheKey = `cart:${sessionId}`;
    let cart = await getCache(cacheKey);
    
    if (!cart) {
      cart = carts[sessionId] || { items: [], total: 0 };
    }
    
    // Add or update item
    const existingItem = cart.items.find((i) => i.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, price });
    }
    
    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Save to cache and memory
    await setCache(cacheKey, cart, 3600);
    carts[sessionId] = cart;
    
    logger.info(`Item ${productId} added to cart ${sessionId}`);
    
    res.json({
      data: cart,
      message: 'Item added to cart',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error adding to cart:', error);
    next(error);
  }
});

// Clear cart
router.post('/:sessionId/clear', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const cacheKey = `cart:${sessionId}`;
    
    await deleteCache(cacheKey);
    delete carts[sessionId];
    
    logger.info(`Cart ${sessionId} cleared`);
    
    res.json({
      message: 'Cart cleared',
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error clearing cart:', error);
    next(error);
  }
});

module.exports = router;

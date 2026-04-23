/**
 * Inventory Management API Routes
 * Handles inventory tracking and item reservation during checkout
 */

const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../config/redis');
const { logger } = require('../utils/logger');

const Inventory = require('../models/Inventory');

// Get inventory for product
router.get('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cacheKey = `inventory:${productId}`;
    
    let cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    const item = await Inventory.findOne({ productId }).lean();
    if (!item) {
      return res.status(404).json({ error: 'Product inventory not found' });
    }
    
    // Cache inventory
    await setCache(cacheKey, item, 60); // Cache for 1 minute
    
    res.json({
      data: item,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching inventory:', error);
    next(error);
  }
});

// Check availability
router.post('/check', async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { productId, quantity }
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items array' });
    }
    
    const availability = await Promise.all(items.map(async (item) => {
      const inventoryItem = await Inventory.findOne({ productId: item.productId });
      const available = inventoryItem
        ? (inventoryItem.available - inventoryItem.reserved) >= item.quantity
        : false;
      
      return {
        productId: item.productId,
        requestedQuantity: item.quantity,
        available,
        availableStock: inventoryItem?.available || 0,
        reservedStock: inventoryItem?.reserved || 0,
      };
    }));
    
    const allAvailable = availability.every((item) => item.available);
    
    res.json({
      allAvailable,
      items: availability,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    next(error);
  }
});

// Reserve items (during checkout)
router.post('/reserve', async (req, res, next) => {
  try {
    const { reservationId, items } = req.body;
    
    if (!reservationId || !items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const reserved = [];
    const failed = [];
    
    for (const item of items) {
      // Use atomic update to prevent race conditions
      const inventoryItem = await Inventory.findOneAndUpdate(
        { 
          productId: item.productId,
          $expr: { $gte: [{ $subtract: ["$available", "$reserved"] }, item.quantity] }
        },
        { $inc: { reserved: item.quantity } },
        { new: true }
      );
      
      if (inventoryItem) {
        reserved.push({
          productId: item.productId,
          quantity: item.quantity,
          status: 'RESERVED',
        });
        
        // Update cache
        const cacheKey = `inventory:${item.productId}`;
        await setCache(cacheKey, inventoryItem.toObject(), 60);
      } else {
        const currentItem = await Inventory.findOne({ productId: item.productId });
        failed.push({
          productId: item.productId,
          requested: item.quantity,
          available: currentItem ? (currentItem.available - currentItem.reserved) : 0,
          reason: currentItem ? 'Insufficient stock' : 'Product not found',
        });
      }
    }
    
    const reservationKey = `reservation:${reservationId}`;
    await setCache(
      reservationKey,
      {
        reservationId,
        items: reserved,
        timestamp: new Date(),
      },
      900
    ); // Cache for 15 minutes
    
    logger.info(`Reservation ${reservationId} created: ${reserved.length} items`);
    
    res.status(reserved.length > 0 ? 201 : 400).json({
      reservationId,
      reserved,
      failed,
      totalReserved: reserved.length,
      totalFailed: failed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error reserving items:', error);
    next(error);
  }
});

// Release reservation (if checkout fails)
router.post('/release/:reservationId', async (req, res, next) => {
  try {
    const { reservationId } = req.params;
    
    const reservationKey = `reservation:${reservationId}`;
    const reservation = await getCache(reservationKey);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    // Release all items
    for (const item of reservation.items) {
      const inventoryItem = await Inventory.findOneAndUpdate(
        { productId: item.productId },
        { $inc: { reserved: -item.quantity } },
        { new: true }
      );
      
      if (inventoryItem) {
        // Update cache
        const cacheKey = `inventory:${item.productId}`;
        await setCache(cacheKey, inventoryItem.toObject(), 60);
      }
    }
    
    // Delete reservation from cache
    await deleteCache(reservationKey);
    
    logger.info(`Reservation ${reservationId} released`);
    
    res.json({
      reservationId,
      message: 'Reservation released',
      itemsReleased: reservation.items.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error releasing reservation:', error);
    next(error);
  }
});

// Get inventory status
router.get('/', async (req, res) => {
  const allInventory = await Inventory.find().lean();
  const status = allInventory.map((item) => ({
    ...item,
    percentage: Math.round((item.available / (item.available + item.reserved)) * 100),
  }));
  
  res.json({
    data: status,
    totalItems: status.length,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

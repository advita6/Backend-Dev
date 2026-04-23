/**
 * Inventory Management API Routes
 * Handles inventory tracking and item reservation during checkout
 */

const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../config/redis');
const { logger } = require('../utils/logger');

// In-memory inventory (in production, use database)
const inventory = {
  '1': { productId: '1', available: 1000, reserved: 0 },
  '2': { productId: '2', available: 500, reserved: 0 },
  '3': { productId: '3', available: 200, reserved: 0 },
};

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
    
    const item = inventory[productId];
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
    
    const availability = items.map((item) => {
      const inventoryItem = inventory[item.productId];
      const available = inventoryItem
        ? inventoryItem.available - inventoryItem.reserved >= item.quantity
        : false;
      
      return {
        productId: item.productId,
        requestedQuantity: item.quantity,
        available,
        availableStock: inventoryItem?.available || 0,
        reservedStock: inventoryItem?.reserved || 0,
      };
    });
    
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
      const inventoryItem = inventory[item.productId];
      
      if (!inventoryItem) {
        failed.push({ productId: item.productId, reason: 'Product not found' });
        continue;
      }
      
      const available = inventoryItem.available - inventoryItem.reserved;
      
      if (available >= item.quantity) {
        inventoryItem.reserved += item.quantity;
        reserved.push({
          productId: item.productId,
          quantity: item.quantity,
          status: 'RESERVED',
        });
        
        // Update cache
        const cacheKey = `inventory:${item.productId}`;
        await setCache(cacheKey, inventoryItem, 60);
      } else {
        failed.push({
          productId: item.productId,
          requested: item.quantity,
          available,
          reason: 'Insufficient stock',
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
      const inventoryItem = inventory[item.productId];
      if (inventoryItem) {
        inventoryItem.reserved = Math.max(0, inventoryItem.reserved - item.quantity);
        
        // Update cache
        const cacheKey = `inventory:${item.productId}`;
        await setCache(cacheKey, inventoryItem, 60);
      }
    }
    
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
router.get('/', (req, res) => {
  const status = Object.values(inventory).map((item) => ({
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

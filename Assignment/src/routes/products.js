/**
 * Products API Routes
 * Handles product listing, searching, and details
 */

const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../config/redis');
const { logger } = require('../utils/logger');

const Product = require('../models/Product');

// Get all products (cached)
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'products:all';
    
    // Try to get from cache first
    let cached = await getCache(cacheKey);
    if (cached) {
      logger.debug('Returning products from cache');
      return res.json({
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // If not cached, fetch from DB
    const products = await Product.find().lean();
    
    // Cache them for 10 minutes
    await setCache(cacheKey, products, 600);
    
    res.json({
      data: products,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    next(error);
  }
});

// Get product by ID (cached)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `products:${id}`;
    
    // Try cache first
    let cached = await getCache(cacheKey);
    if (cached) {
      logger.debug(`Product ${id} returned from cache`);
      return res.json({
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Find product in DB
    const product = await Product.findById(id).lean();
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        id,
      });
    }
    
    // Cache the product
    await setCache(cacheKey, product, 600);
    
    res.json({
      data: product,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error fetching product ${req.params.id}:`, error);
    next(error);
  }
});

// Search products
router.get('/search/query', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const cacheKey = `products:search:${q.toLowerCase()}`;
    
    // Try cache
    let cached = await getCache(cacheKey);
    if (cached) {
      logger.debug(`Search results for "${q}" returned from cache`);
      return res.json({
        data: cached,
        cached: true,
        query: q,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Search products in DB using text index
    const results = await Product.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).lean();
    
    // Cache results
    await setCache(cacheKey, results, 300); // Cache for 5 minutes
    
    res.json({
      data: results,
      cached: false,
      query: q,
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error searching products:', error);
    next(error);
  }
});

module.exports = router;

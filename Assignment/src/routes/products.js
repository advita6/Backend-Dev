/**
 * Products API Routes
 * Handles product listing, searching, and details
 */

const express = require('express');
const router = express.Router();
const { getCache, setCache } = require('../config/redis');
const { logger } = require('../utils/logger');

// Mock product database (in production, would be MongoDB)
const products = [
  {
    id: '1',
    name: 'Premium Headphones',
    price: 299.99,
    description: 'High-quality wireless headphones',
    stock: 1000,
    category: 'Electronics',
  },
  {
    id: '2',
    name: 'Smart Watch',
    price: 199.99,
    description: 'Latest smart watch with fitness tracking',
    stock: 500,
    category: 'Electronics',
  },
  {
    id: '3',
    name: '4K Monitor',
    price: 599.99,
    description: 'Ultra HD 4K professional monitor',
    stock: 200,
    category: 'Electronics',
  },
];

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
    
    // If not cached, return products and cache them
    await setCache(cacheKey, products, 600); // Cache for 10 minutes
    
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
    
    // Find product
    const product = products.find((p) => p.id === id);
    
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
    
    // Search products
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.description.toLowerCase().includes(q.toLowerCase()) ||
        p.category.toLowerCase().includes(q.toLowerCase())
    );
    
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

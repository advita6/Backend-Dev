const mongoose = require('mongoose');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const envConfig = require('../config/env');
const logger = require('./logger');

const seedData = async () => {
  try {
    logger.info('Starting database seeding...');
    
    // Connect to DB
    await mongoose.connect(envConfig.MONGODB_URI);
    
    // Clear existing data
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    
    const products = [
      {
        name: 'Premium Headphones',
        price: 299.99,
        description: 'High-quality wireless headphones with noise cancellation',
        category: 'Electronics',
        images: ['https://example.com/headphones.jpg']
      },
      {
        name: 'Smart Watch',
        price: 199.99,
        description: 'Latest smart watch with fitness tracking and heart rate monitor',
        category: 'Electronics',
        images: ['https://example.com/watch.jpg']
      },
      {
        name: '4K Monitor',
        price: 599.99,
        description: 'Ultra HD 4K professional monitor for designers',
        category: 'Electronics',
        images: ['https://example.com/monitor.jpg']
      }
    ];
    
    const createdProducts = await Product.insertMany(products);
    
    const inventoryData = createdProducts.map(p => ({
      productId: p._id.toString(),
      available: 1000,
      reserved: 0
    }));
    
    await Inventory.insertMany(inventoryData);
    
    logger.info(`✓ Seeded ${createdProducts.length} products and inventory items`);
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();

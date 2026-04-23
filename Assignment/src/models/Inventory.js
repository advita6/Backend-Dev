const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  available: { type: Number, required: true, default: 0 },
  reserved: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Method to check if quantity is available
inventorySchema.methods.isAvailable = function(quantity) {
  return (this.available - this.reserved) >= quantity;
};

module.exports = mongoose.model('Inventory', inventorySchema);

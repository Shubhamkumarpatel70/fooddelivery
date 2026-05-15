const mongoose = require('mongoose');

const chargeSchema = new mongoose.Schema({
  platformFee: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 50,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one active charge configuration exists
chargeSchema.statics.getActiveCharges = async function() {
  let charges = await this.findOne({ isActive: true });
  if (!charges) {
    // Create default charges if none exist
    charges = await this.create({
      platformFee: 0,
      deliveryFee: 50,
      tax: 5,
      isActive: true
    });
  }
  return charges;
};

module.exports = mongoose.model('Charge', chargeSchema);


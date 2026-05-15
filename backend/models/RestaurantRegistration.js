const mongoose = require('mongoose');

const restaurantRegistrationSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true,
    trim: true
  },
  restaurantAddress: {
    type: String,
    required: true,
    trim: true
  },
  frontImage: {
    type: String,
    required: true
  },
  restaurantImage: {
    type: String,
    required: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  ownerEmail: {
    type: String,
    required: true,
    trim: true
  },
  closingTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RestaurantRegistration', restaurantRegistrationSchema);


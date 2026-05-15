const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cuisine: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  deliveryTime: {
    type: String,
    required: true
  },
  costForTwo: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/300x200'
  },
  location: {
    type: String,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  closingTime: {
    type: String,
    default: '23:00'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  menu: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  upiId: {
    type: String,
    default: ''
  },
  paymentLastChanged: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);


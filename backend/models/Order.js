const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out for delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'cash on delivery'
  },
  couponCode: {
    type: String,
    default: null
  },
  discount: {
    type: Number,
    default: 0
  },
  cancelReason: {
    type: String,
    default: null
  },
  utrNumber: {
    type: String,
    default: null
  },
  upiId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'approved', 'rejected'],
    default: 'pending'
  },
  paymentApprovalStatus: {
    type: String,
    default: null,
    required: false,
    validate: {
      validator: function(value) {
        return value === null || value === undefined || ['pending', 'approved', 'rejected'].includes(value);
      },
      message: 'Payment approval status must be pending, approved, rejected, or null'
    }
  },
  paymentCollected: {
    type: Boolean,
    default: false
  },
  restaurantPaid: {
    type: Boolean,
    default: false
  },
  deliveryOtp: {
    type: String,
    default: null
  },
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);


const express = require('express');
const router = express.Router();
const RestaurantCoupon = require('../models/RestaurantCoupon');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all coupons for a restaurant (public - for cart/checkout)
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Get active coupons for the restaurant
    const coupons = await RestaurantCoupon.find({ 
      restaurant: req.params.restaurantId,
      isActive: true
    })
      .populate('applicableItems', 'name price')
      .sort({ createdAt: -1 });
    
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create restaurant coupon (restaurant owner only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findById(req.body.restaurant);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (user.role !== 'admin' && restaurant.owner?.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if coupon code already exists for this restaurant
    const existingCoupon = await RestaurantCoupon.findOne({
      code: req.body.code.toUpperCase(),
      restaurant: req.body.restaurant
    });

    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists for this restaurant' });
    }

    const coupon = new RestaurantCoupon({
      ...req.body,
      code: req.body.code.toUpperCase()
    });
    await coupon.save();
    
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update restaurant coupon (restaurant owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const coupon = await RestaurantCoupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const restaurant = await Restaurant.findById(coupon.restaurant);
    if (user.role !== 'admin' && restaurant.owner?.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }

    const updatedCoupon = await RestaurantCoupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('applicableItems', 'name price');
    
    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete restaurant coupon (restaurant owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const coupon = await RestaurantCoupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const restaurant = await Restaurant.findById(coupon.restaurant);
    if (user.role !== 'admin' && restaurant.owner?.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await RestaurantCoupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate restaurant coupon (public)
router.post('/validate', async (req, res) => {
  try {
    const { code, restaurantId, orderAmount, items } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    if (orderAmount === undefined || orderAmount === null) {
      return res.status(400).json({ message: 'Order amount is required' });
    }
    
    const coupon = await RestaurantCoupon.findOne({
      code: code.toUpperCase(),
      restaurant: restaurantId,
      isActive: true
    }).populate('applicableItems');

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({ message: 'Coupon has expired or is not yet valid' });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
      });
    }

    // Check if order contains applicable items
    if (coupon.applicableItems && coupon.applicableItems.length > 0) {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          message: 'Cart items are required for this coupon' 
        });
      }
      
      const itemIds = items.map(item => {
        const id = item.menuItem || item.menuItemId || item._id;
        return id ? id.toString() : null;
      }).filter(Boolean);
      
      const couponItemIds = coupon.applicableItems.map(item => item._id.toString());
      const hasApplicableItem = itemIds.some(itemId => couponItemIds.includes(itemId));
      
      if (!hasApplicableItem) {
        return res.status(400).json({ 
          message: 'This coupon is not applicable to items in your cart' 
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      valid: true,
      discount: Math.round(discount),
      coupon: coupon
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


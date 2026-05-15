const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Rating = require('../models/Rating');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const User = require('../models/User');

// Create rating (user only, for delivered orders)
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only rate delivered orders' });
    }

    // Check if rating already exists for this order
    const existingRating = await Rating.findOne({ order: orderId });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this order' });
    }

    // Create rating
    const newRating = new Rating({
      user: userId,
      restaurant: order.restaurant,
      order: orderId,
      rating: rating,
      comment: comment || ''
    });

    await newRating.save();

    // Update restaurant rating (calculate average)
    const ratings = await Rating.find({ restaurant: order.restaurant });
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    await Restaurant.findByIdAndUpdate(order.restaurant, {
      rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
    });

    res.status(201).json(newRating);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already rated this order' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all ratings (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const ratings = await Rating.find()
      .populate('user', 'name email')
      .populate('restaurant', 'name')
      .populate('order', 'totalAmount createdAt')
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ratings for a restaurant (restaurant owner or admin)
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is admin or restaurant owner
    const isAdmin = user.role === 'admin';
    const isOwner = restaurant.owner && restaurant.owner.toString() === req.user.userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const ratings = await Rating.find({ restaurant: req.params.restaurantId })
      .populate('user', 'name email')
      .populate('order', 'totalAmount createdAt')
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if user has rated an order
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const rating = await Rating.findOne({ order: req.params.orderId })
      .populate('user', 'name')
      .populate('restaurant', 'name');

    if (!rating) {
      return res.json({ hasRated: false });
    }

    res.json({ hasRated: true, rating });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update rating (user only, for their own rating)
router.put('/:id', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existingRating = await Rating.findById(req.params.id);
    if (!existingRating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Check if user owns this rating
    if (existingRating.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own ratings.' });
    }

    // Update rating
    existingRating.rating = rating;
    existingRating.comment = comment || '';
    await existingRating.save();

    // Update restaurant rating (calculate average)
    const ratings = await Rating.find({ restaurant: existingRating.restaurant });
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    await Restaurant.findByIdAndUpdate(existingRating.restaurant, {
      rating: Math.round(averageRating * 10) / 10
    });

    res.json(existingRating);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete rating (user only, for their own rating)
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Check if user owns this rating
    if (rating.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own ratings.' });
    }

    const restaurantId = rating.restaurant;
    await Rating.findByIdAndDelete(req.params.id);

    // Update restaurant rating (calculate average)
    const ratings = await Rating.find({ restaurant: restaurantId });
    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: Math.round(averageRating * 10) / 10
      });
    } else {
      // If no ratings left, set to 0
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: 0
      });
    }

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


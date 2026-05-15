const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const router = express.Router();

// Get all users for a restaurant (restaurant owner or admin)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    
    if (!restaurant && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const restaurantId = restaurant ? restaurant._id : null;
    const users = await User.find({ 
      restaurant: restaurantId,
      role: { $in: ['delivery_boy', 'owner'] }
    }).select('-password').sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create user for restaurant (restaurant owner or admin)
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    
    if (!restaurant && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['delivery_boy', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be delivery_boy or owner' });
    }

    // Check if phone or email already exists
    const existingUser = await User.findOne({
      $or: [
        { phone: phone },
        { email: phone } // Use phone as email if no email provided
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    const newUser = new User({
      name,
      phone,
      email: phone, // Use phone as email for delivery boys
      password,
      role,
      restaurant: restaurant ? restaurant._id : null
    });

    await newUser.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update restaurant user
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!restaurant && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (targetUser.restaurant && targetUser.restaurant.toString() !== restaurant._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(targetUser, req.body);
    await targetUser.save();
    const userResponse = targetUser.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete restaurant user
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findOne({ owner: req.user.userId });
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!restaurant && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (targetUser.restaurant && targetUser.restaurant.toString() !== restaurant._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


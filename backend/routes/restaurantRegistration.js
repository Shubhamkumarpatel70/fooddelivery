const express = require('express');
const auth = require('../middleware/auth');
const RestaurantRegistration = require('../models/RestaurantRegistration');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const router = express.Router();

// Submit restaurant registration (auth optional - can register without login)
router.post('/', async (req, res) => {
  try {
    let userId = null;
    
    // Try to get user from token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
      } catch (err) {
        // Token invalid - continue without user
        console.log('Invalid token, continuing without user');
      }
    }
    
    // Validate required fields
    if (!req.body.restaurantName || !req.body.restaurantAddress) {
      return res.status(400).json({ message: 'Restaurant name and address are required' });
    }

    if (!req.body.ownerEmail) {
      return res.status(400).json({ message: 'Owner email is required' });
    }

    // Validate required image fields
    if (!req.body.frontImage && !req.body.restaurantFrontImage) {
      return res.status(400).json({ message: 'Restaurant front image is required' });
    }
    if (!req.body.restaurantImage) {
      return res.status(400).json({ message: 'Restaurant image is required' });
    }

    const registration = new RestaurantRegistration({
      restaurantName: req.body.restaurantName,
      restaurantAddress: req.body.restaurantAddress,
      frontImage: req.body.frontImage || req.body.restaurantFrontImage,
      restaurantImage: req.body.restaurantImage,
      ownerName: req.body.ownerName || 'Not provided',
      ownerEmail: req.body.ownerEmail,
      closingTime: req.body.closingTime || '23:00',
      user: userId
    });
    
    await registration.save();
    res.status(201).json({ 
      message: 'Restaurant registration submitted successfully! Please wait for admin approval.',
      registration 
    });
  } catch (error) {
    console.error('Error submitting registration:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all registrations (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const registrations = await RestaurantRegistration.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve registration (admin only)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const registration = await RestaurantRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Create restaurant
    const restaurant = new Restaurant({
      name: registration.restaurantName,
      location: registration.restaurantAddress,
      image: registration.frontImage || registration.restaurantImage, // Use frontImage as primary, fallback to restaurantImage
      cuisine: 'Multi-cuisine',
      rating: 0,
      deliveryTime: '30-40 mins',
      costForTwo: 500,
      isOpen: true,
      isActive: true,
      isOnline: true,
      closingTime: registration.closingTime,
      owner: registration.user
    });

    await restaurant.save();

    // Update user role to restaurant
    await User.findByIdAndUpdate(registration.user, { role: 'restaurant' });

    // Update registration status
    registration.status = 'approved';
    await registration.save();

    res.json({ restaurant, registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject registration (admin only)
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const registration = await RestaurantRegistration.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const RestaurantRegistration = require('../models/RestaurantRegistration');
const router = express.Router();

// Get all restaurants (only active ones for public, all for admin)
router.get('/', async (req, res) => {
  try {
    const { cuisine, search, admin } = req.query;
    let query = {};

    // Build search query first
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { cuisine: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') }
      ];
    }

    if (cuisine) {
      query.cuisine = new RegExp(cuisine, 'i');
    }

    let restaurants = await Restaurant.find(query).populate('menu');
    
    // For public users, show all active restaurants (including offline ones)
    // Offline restaurants will be shown but marked as not accepting orders
    if (!admin) {
      const filtered = restaurants.filter(restaurant => {
        // Only filter out inactive restaurants, but show offline ones
        if (restaurant.isActive === false) {
          return false;
        }
        // Show both online and offline restaurants
        return true;
      });
      
      // Sort by location if location query is provided
      const { location } = req.query;
      if (location) {
        // Simple location-based sorting (can be enhanced with actual distance calculation)
        filtered.sort((a, b) => {
          const aMatch = a.location?.toLowerCase().includes(location.toLowerCase()) ? 0 : 1;
          const bMatch = b.location?.toLowerCase().includes(location.toLowerCase()) ? 0 : 1;
          return aMatch - bMatch;
        });
      }
      
      return res.json(filtered);
    }

    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant by owner (for restaurant dashboard) - MUST be before /:id route
router.get('/my-restaurant', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.userId }).populate('menu');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single restaurant
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('menu')
      .populate('owner', 'name email phone');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    // For public users, allow viewing offline restaurants but they won't accept orders
    // Only block inactive restaurants
    if (!req.query.admin) {
      // Only block if explicitly inactive
      if (restaurant.isActive === false) {
        return res.status(403).json({ message: 'Restaurant is not available' });
      }
      // Allow viewing offline restaurants - frontend will show they don't accept orders
    }
    res.json(restaurant);
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update restaurant (admin or restaurant owner)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is admin or restaurant owner
    const isOwner = restaurant.owner && restaurant.owner.toString() === req.user.userId.toString();
    if (user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Access denied. Only admin or restaurant owner can update.' });
    }

    // Only update allowed fields (exclude upiId from general update - use separate route)
    const allowedUpdates = ['name', 'cuisine', 'location', 'deliveryTime', 'costForTwo', 'image', 'isOpen', 'isOnline', 'closingTime', 'rating'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('menu');

    // Also update RestaurantRegistration if it exists
    try {
      const registration = await RestaurantRegistration.findOne({ user: restaurant.owner });
      if (registration && registration.status === 'approved') {
        // Update registration with restaurant details
        const registrationUpdates = {};
        if (updates.name) registrationUpdates.restaurantName = updates.name;
        if (updates.location) registrationUpdates.restaurantAddress = updates.location;
        if (updates.closingTime) registrationUpdates.closingTime = updates.closingTime;
        if (updates.image) {
          registrationUpdates.restaurantImage = updates.image;
          registrationUpdates.frontImage = updates.image; // Also update front image
        }
        
        if (Object.keys(registrationUpdates).length > 0) {
          await RestaurantRegistration.findByIdAndUpdate(
            registration._id,
            registrationUpdates,
            { new: true, runValidators: true }
          );
        }
      }
    } catch (regError) {
      // Don't fail the restaurant update if registration update fails
      console.error('Error updating restaurant registration:', regError);
    }

    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete restaurant (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    await Restaurant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment settings (restaurant owner only) with 14-day restriction
router.put('/:id/payment', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is restaurant owner
    const isOwner = restaurant.owner && restaurant.owner.toString() === req.user.userId.toString();
    if (!isOwner && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only restaurant owner can update payment settings.' });
    }

    const { upiId } = req.body;

    // Check if payment was changed before (not first time)
    if (restaurant.paymentLastChanged) {
      const lastChanged = new Date(restaurant.paymentLastChanged);
      const now = new Date();
      const daysSinceLastChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24));

      // If less than 14 days have passed, prevent change
      if (daysSinceLastChange < 14) {
        const daysRemaining = 14 - daysSinceLastChange;
        return res.status(400).json({ 
          message: `Payment settings cannot be changed before 14 days. You can change again after ${daysRemaining} day(s).`,
          daysRemaining,
          canChange: false
        });
      }
    }

    // Update payment settings
    restaurant.upiId = upiId || '';
    restaurant.paymentLastChanged = new Date();
    await restaurant.save();

    res.json({ 
      message: 'Payment settings updated successfully',
      restaurant,
      canChange: true
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle restaurant active status (admin only)
router.put('/:id/toggle-active', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


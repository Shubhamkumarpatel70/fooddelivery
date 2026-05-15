const express = require('express');
const auth = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const router = express.Router();

// Get menu items by restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ 
      restaurant: req.params.restaurantId
    }).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Filter by search term if provided
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    // Only show available items (default to true if not set)
    query.isAvailable = { $ne: false };
    
    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'name cuisine location image isActive isOnline')
      .sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create menu item (restaurant owner only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findById(req.body.restaurant);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is restaurant owner or admin
    if (user.role !== 'admin' && restaurant.owner?.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    
    // Add to restaurant menu
    restaurant.menu.push(menuItem._id);
    await restaurant.save();

    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update menu item (restaurant owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const restaurant = await Restaurant.findById(menuItem.restaurant);
    
    // Check if user is restaurant owner or admin
    if (user.role !== 'admin' && restaurant.owner?.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete menu item (restaurant owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const restaurant = await Restaurant.findById(menuItem.restaurant);
    
    // Check if user is restaurant owner or admin
    if (user.role !== 'admin' && restaurant.owner?.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);
    
    // Remove from restaurant menu
    restaurant.menu = restaurant.menu.filter(id => id.toString() !== req.params.id);
    await restaurant.save();

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


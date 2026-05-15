const express = require('express');
const auth = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

// In-memory cart storage (in production, use Redis or database)
let carts = {};

// Get cart
router.get('/', auth, (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const userId = req.user.userId.toString();
    const cart = carts[userId] || { items: [], total: 0 };
    res.json(cart);
  } catch (error) {
    console.error('Cart get error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to cart
router.post('/add', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user.userId.toString();
    const { menuItemId, quantity } = req.body;

    if (!menuItemId) {
      return res.status(400).json({ message: 'Menu item ID is required' });
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (!carts[userId]) {
      carts[userId] = { items: [], total: 0 };
    }

    const existingItemIndex = carts[userId].items.findIndex(
      item => item.menuItemId.toString() === menuItemId.toString()
    );

    if (existingItemIndex > -1) {
      carts[userId].items[existingItemIndex].quantity += quantity || 1;
    } else {
      carts[userId].items.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image,
        restaurantId: menuItem.restaurant.toString(),
        quantity: quantity || 1
      });
    }

    carts[userId].total = carts[userId].items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    res.json(carts[userId]);
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item
router.put('/update', auth, (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.userId.toString();
    const { menuItemId, quantity } = req.body;

    if (!menuItemId) {
      return res.status(400).json({ message: 'Menu item ID is required' });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    if (!carts[userId]) {
      carts[userId] = { items: [], total: 0 };
    }

    const itemIndex = carts[userId].items.findIndex(
      item => item.menuItemId.toString() === menuItemId.toString()
    );

    if (itemIndex > -1) {
      if (quantity <= 0) {
        carts[userId].items.splice(itemIndex, 1);
      } else {
        carts[userId].items[itemIndex].quantity = parseInt(quantity);
      }

      carts[userId].total = carts[userId].items.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
      );
    } else {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    res.json(carts[userId]);
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from cart
router.delete('/remove/:menuItemId', auth, (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user.userId.toString();
    const { menuItemId } = req.params;

    if (!menuItemId) {
      return res.status(400).json({ message: 'Menu item ID is required' });
    }

    if (!carts[userId]) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    carts[userId].items = carts[userId].items.filter(
      item => item.menuItemId.toString() !== menuItemId.toString()
    );

    carts[userId].total = carts[userId].items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    res.json(carts[userId]);
  } catch (error) {
    console.error('Cart remove error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear cart
router.delete('/clear', auth, (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user.userId.toString();
    carts[userId] = { items: [], total: 0 };
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


const express = require('express');
const auth = require('../middleware/auth');
const Carousel = require('../models/Carousel');
const User = require('../models/User');
const router = express.Router();

// Get all active carousel items
router.get('/', async (req, res) => {
  try {
    const carousels = await Carousel.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });
    res.json(carousels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all carousel items (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const carousels = await Carousel.find().sort({ order: 1, createdAt: -1 });
    res.json(carousels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create carousel item (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const carousel = new Carousel(req.body);
    await carousel.save();
    res.status(201).json(carousel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update carousel item (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const carousel = await Carousel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!carousel) {
      return res.status(404).json({ message: 'Carousel item not found' });
    }

    res.json(carousel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete carousel item (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    await Carousel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Carousel item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


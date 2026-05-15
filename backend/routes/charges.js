const express = require('express');
const router = express.Router();
const Charge = require('../models/Charge');
const auth = require('../middleware/auth');

// Get active charges
router.get('/', async (req, res) => {
  try {
    const charges = await Charge.getActiveCharges();
    res.json(charges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all charges (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const charges = await Charge.find().sort({ createdAt: -1 });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update charges (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { platformFee, deliveryFee, tax } = req.body;

    // Deactivate all existing charges
    await Charge.updateMany({}, { isActive: false });

    // Create new active charges
    const charges = new Charge({
      platformFee: platformFee || 0,
      deliveryFee: deliveryFee || 50,
      tax: tax || 5,
      isActive: true
    });

    await charges.save();
    res.json(charges);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update charges (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { platformFee, deliveryFee, tax, isActive } = req.body;
    
    // If setting as active, deactivate all others first
    if (isActive) {
      await Charge.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    }

    const charges = await Charge.findByIdAndUpdate(
      req.params.id,
      { platformFee, deliveryFee, tax, isActive },
      { new: true, runValidators: true }
    );

    if (!charges) {
      return res.status(404).json({ message: 'Charges not found' });
    }

    res.json(charges);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete charges (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const charges = await Charge.findByIdAndDelete(req.params.id);
    if (!charges) {
      return res.status(404).json({ message: 'Charges not found' });
    }

    res.json({ message: 'Charges deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


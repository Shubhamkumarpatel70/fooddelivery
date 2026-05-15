const express = require('express');
const auth = require('../middleware/auth');
const Address = require('../models/Address');
const router = express.Router();

// Get all addresses for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get default address for logged in user
router.get('/default', auth, async (req, res) => {
  try {
    const address = await Address.findOne({ user: req.user.userId, isDefault: true });
    if (!address) {
      // Return first address if no default
      const firstAddress = await Address.findOne({ user: req.user.userId }).sort({ createdAt: -1 });
      return res.json(firstAddress);
    }
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create address
router.post('/', auth, async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      user: req.user.userId
    };
    const address = new Address(addressData);
    await address.save();
    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update address
router.put('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    Object.assign(address, req.body);
    await address.save();
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set default address
router.put('/:id/set-default', auth, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Set all addresses to non-default
    await Address.updateMany(
      { user: req.user.userId },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await Address.findByIdAndDelete(req.params.id);
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


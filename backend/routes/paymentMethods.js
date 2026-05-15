const express = require('express');
const auth = require('../middleware/auth');
const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');
const router = express.Router();

// Get all payment methods (admin only for management)
router.get('/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const paymentMethods = await PaymentMethod.find().sort({ createdAt: -1 });
    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get active payment methods (public - for checkout)
router.get('/', async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create payment method (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const paymentMethod = new PaymentMethod(req.body);
    await paymentMethod.save();
    res.status(201).json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment method (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const paymentMethod = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    res.json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle payment method active status (admin only)
router.put('/:id/toggle-active', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const paymentMethod = await PaymentMethod.findById(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    paymentMethod.isActive = !paymentMethod.isActive;
    await paymentMethod.save();
    res.json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete payment method (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    await PaymentMethod.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


const express = require('express');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const router = express.Router();

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress } = req.body;
    const userId = req.user.userId;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if restaurant is active and online
    if (!restaurant.isActive) {
      return res.status(403).json({ message: 'This restaurant is currently inactive and not accepting orders' });
    }
    
    if (!restaurant.isOnline) {
      return res.status(403).json({ message: 'This restaurant is currently offline and not accepting orders' });
    }

    // Check closing time - use India/Kolkata timezone
    if (restaurant.closingTime) {
      const now = new Date();
      // Convert to India/Kolkata timezone
      const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const currentHour = kolkataTime.getHours();
      const currentMinute = kolkataTime.getMinutes();
      
      const [closingHour, closingMinute] = restaurant.closingTime.split(':').map(Number);
      
      // Check if current time is past closing time
      const isClosed = currentHour > closingHour || (currentHour === closingHour && currentMinute >= closingMinute);
      
      if (isClosed) {
        return res.status(403).json({ 
          message: `Restaurant is closed. Closing time is ${restaurant.closingTime}. Please order during business hours.` 
        });
      }
    }

    const orderItems = items.map(item => ({
      menuItem: item.menuItemId,
      quantity: item.quantity,
      price: item.price
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    const order = new Order({
      user: userId,
      restaurant: restaurantId,
      items: orderItems,
      totalAmount: totalAmount - (req.body.discount || 0),
      deliveryAddress: deliveryAddress || 'Address not provided',
      paymentMethod: req.body.paymentMethod || 'cash on delivery',
      couponCode: req.body.couponCode || null,
      discount: req.body.discount || 0,
      upiId: req.body.upiId || null,
      utrNumber: req.body.utrNumber || null,
      paymentStatus: req.body.paymentMethod === 'upi' ? 'pending' : 'pending',
      paymentApprovalStatus: req.body.paymentMethod === 'upi' ? 'pending' : null
    });

    await order.save();
    await order.populate('restaurant');
    await order.populate('items.menuItem');

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders (admin only) - MUST be before /:id route
router.get('/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const orders = await Order.find()
      .populate('restaurant', 'name location')
      .populate('user', 'name email')
      .populate('items.menuItem', 'name price')
      .populate('deliveryBoy', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get restaurant orders (restaurant owner only)
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is restaurant owner or admin
    const isOwner = restaurant.owner && restaurant.owner.toString() === req.user.userId.toString();
    if (user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await Order.find({ restaurant: req.params.restaurantId })
      .populate('restaurant', 'name location upiId')
      .populate('user', 'name email')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .populate('restaurant')
      .populate('items.menuItem')
      .populate('deliveryBoy', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant')
      .populate('items.menuItem')
      .populate('deliveryBoy', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const user = await User.findById(req.user.userId);
    const restaurant = await Restaurant.findById(order.restaurant);
    
    // Allow access if user is admin, restaurant owner, or order owner
    const isAdmin = user.role === 'admin';
    const isRestaurantOwner = restaurant.owner && restaurant.owner.toString() === req.user.userId.toString();
    const isOrderOwner = order.user.toString() === req.user.userId.toString();
    
    if (!isAdmin && !isRestaurantOwner && !isOrderOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status (admin, restaurant owner, or order owner)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions: admin, restaurant owner, or order owner can update
    const restaurant = await Restaurant.findById(order.restaurant);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const isAdmin = user.role === 'admin';
    const isRestaurantOwner = restaurant.owner && restaurant.owner.toString() === req.user.userId.toString();
    const isRestaurantUser = user.role === 'restaurant' && user.restaurant && user.restaurant.toString() === order.restaurant.toString();
    const isOrderOwner = order.user && order.user.toString() === req.user.userId.toString();

    // If status is provided, validate and update it
    if (status) {
      // Allow users to cancel their own orders
      if (status === 'cancelled' && isOrderOwner) {
        if (!cancelReason || cancelReason.trim() === '') {
          return res.status(400).json({ message: 'Cancel reason is required' });
        }
        order.status = status;
        order.cancelReason = cancelReason.trim();
        await order.save();
        
        try {
          await order.populate('restaurant');
          await order.populate('items.menuItem');
        } catch (populateError) {
          console.error('Error populating order:', populateError);
          // Continue even if populate fails
        }
        
        return res.json(order);
      }

      // For other status updates, require admin, restaurant owner, or restaurant user
      if (!isAdmin && !isRestaurantOwner && !isRestaurantUser) {
        return res.status(403).json({ message: 'Access denied. Only admin or restaurant staff can update order status.' });
      }

      order.status = status;
      if (status === 'cancelled' && cancelReason) {
        order.cancelReason = cancelReason.trim();
      }
      
      // Generate OTP when status changes to "out for delivery"
      if (status === 'out for delivery' && !order.deliveryOtp) {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        order.deliveryOtp = otp;
        console.log(`Generated OTP for order ${order._id}: ${otp}`);
      }
    } else {
      // If no status is provided, check if we're only updating payment-related fields
      // Require admin, restaurant owner, or restaurant user for payment updates
      if (!isAdmin && !isRestaurantOwner && !isRestaurantUser) {
        return res.status(403).json({ message: 'Access denied. Only admin or restaurant staff can update order details.' });
      }
    }
    
    // Update payment status and UTR if provided
    if (req.body.paymentStatus !== undefined) {
      order.paymentStatus = req.body.paymentStatus;
    }
    if (req.body.utrNumber !== undefined) {
      order.utrNumber = req.body.utrNumber;
    }
    if (req.body.paymentCollected !== undefined) {
      order.paymentCollected = req.body.paymentCollected;
    }
    if (req.body.restaurantPaid !== undefined) {
      order.restaurantPaid = req.body.restaurantPaid;
    }
    if (req.body.deliveryBoy !== undefined) {
      order.deliveryBoy = req.body.deliveryBoy;
    }
    
    await order.save();
    
    try {
      await order.populate('restaurant');
      await order.populate('items.menuItem');
    } catch (populateError) {
      console.error('Error populating order:', populateError);
      // Continue even if populate fails
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve or reject payment (admin only)
router.put('/:id/payment-approval', auth, async (req, res) => {
  try {
    const { approvalStatus } = req.body; // 'approved' or 'rejected'
    const user = await User.findById(req.user.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Payment approval applicable for online payment methods (UPI, scan_and_pay, bank_transfer, card)
    const onlinePaymentMethods = ['upi', 'scan_and_pay', 'bank_transfer', 'card'];
    if (!onlinePaymentMethods.includes(order.paymentMethod)) {
      return res.status(400).json({ message: 'Payment approval only applicable for online payment methods' });
    }

    order.paymentApprovalStatus = approvalStatus;
    order.paymentStatus = approvalStatus === 'approved' ? 'paid' : 'failed';
    await order.save();
    await order.populate('restaurant');
    await order.populate('items.menuItem');

    res.json(order);
  } catch (error) {
    console.error('Error updating payment approval:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and mark as delivered (delivery boy)
router.put('/:id/verify-delivery', auth, async (req, res) => {
  try {
    const { otp, paymentCollected } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (user.role !== 'delivery_boy') {
      return res.status(403).json({ message: 'Access denied. Delivery boy only.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.deliveryBoy && order.deliveryBoy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'This order is assigned to another delivery boy' });
    }

    if (order.deliveryOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    order.status = 'delivered';
    if (paymentCollected !== undefined) {
      order.paymentCollected = paymentCollected;
    }
    await order.save();
    await order.populate('restaurant');
    await order.populate('items.menuItem');
    await order.populate('user', 'name email phone');

    res.json(order);
  } catch (error) {
    console.error('Error verifying delivery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get delivery boy orders
router.get('/delivery/my-orders', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user.role !== 'delivery_boy') {
      return res.status(403).json({ message: 'Access denied. Delivery boy only.' });
    }

    // Only return orders if delivery boy is approved
    if (user.approvalStatus !== 'approved') {
      return res.json([]);
    }

    const orders = await Order.find({ 
      deliveryBoy: req.user.userId,
      status: 'out for delivery'
    })
      .populate('restaurant', 'name location')
      .populate('user', 'name email phone')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get delivered and cancelled orders for delivery boy
router.get('/delivery/delivered-orders', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user.role !== 'delivery_boy') {
      return res.status(403).json({ message: 'Access denied. Delivery boy only.' });
    }

    // Only return orders if delivery boy is approved
    if (user.approvalStatus !== 'approved') {
      return res.json([]);
    }

    const orders = await Order.find({ 
      deliveryBoy: req.user.userId,
      status: { $in: ['delivered', 'cancelled'] }
    })
      .populate('restaurant', 'name location')
      .populate('user', 'name email phone')
      .populate('items.menuItem', 'name price')
      .populate('deliveryBoy', 'name')
      .sort({ updatedAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching delivered orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign order to delivery boy
router.put('/:id/assign-delivery', auth, async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const user = await User.findById(req.user.userId);
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const restaurant = await Restaurant.findById(order.restaurant);
    const isAdmin = user.role === 'admin';
    const isRestaurantOwner = restaurant.owner && restaurant.owner.toString() === req.user.userId.toString();
    
    if (!isAdmin && !isRestaurantOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'out for delivery') {
      return res.status(400).json({ message: 'Order must be in "out for delivery" status' });
    }

    const deliveryBoy = await User.findById(deliveryBoyId);
    if (!deliveryBoy || deliveryBoy.role !== 'delivery_boy') {
      return res.status(400).json({ message: 'Invalid delivery boy' });
    }

    order.deliveryBoy = deliveryBoyId;
    await order.save();
    await order.populate('restaurant');
    await order.populate('items.menuItem');
    await order.populate('deliveryBoy', 'name phone');

    res.json(order);
  } catch (error) {
    console.error('Error assigning delivery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

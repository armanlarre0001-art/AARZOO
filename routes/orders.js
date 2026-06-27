const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('./auth');

// @route   POST /api/orders
// @desc    Create a new order
router.post('/', protect, async (req, res) => {
  const { orderItems, shippingAddress, itemsPrice, shippingPrice, totalPrice } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Check stock for all items and reduce stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }
    }

    // Reduce stock levels
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      const newStock = product.stock - item.qty;
      await Product.findByIdAndUpdate(item.product, { stock: newStock });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod: 'Card',
      itemsPrice: Number(itemsPrice),
      shippingPrice: Number(shippingPrice),
      totalPrice: Number(totalPrice),
      isPaid: true, // Auto-paid for mock checkout
      paidAt: new Date(),
      status: 'Paid'
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/orders/mine
// @desc    Get logged in user orders
router.get('/mine', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    // Sort by newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check user match or admin access
    if (order.user !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({});
    // Sort by newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updateData = { status };
    if (status === 'Paid') {
      updateData.isPaid = true;
      updateData.paidAt = new Date();
    } else if (status === 'Delivered') {
      updateData.isDelivered = true;
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');
const { getIsConnected } = require('../db');
const fileDB = require('./fileDB');

const orderSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Store user ID as string for compatibility
  orderItems: [{
    product: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String },
    image: { type: String },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    size: { type: Number, required: true }
  }],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentMethod: { type: String, default: 'Card' },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  status: { type: String, enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

let MongooseOrder;
try {
  MongooseOrder = mongoose.model('Order', orderSchema);
} catch (e) {
  MongooseOrder = mongoose.model('Order');
}

const Order = {
  async find(query = {}) {
    if (getIsConnected()) {
      return await MongooseOrder.find(query);
    }
    return await fileDB.Order.find(query);
  },
  async findById(id) {
    if (getIsConnected()) {
      return await MongooseOrder.findById(id);
    }
    return await fileDB.Order.findById(id);
  },
  async create(data) {
    if (getIsConnected()) {
      return await MongooseOrder.create(data);
    }
    return await fileDB.Order.create(data);
  },
  async findByIdAndUpdate(id, data, options = { new: true }) {
    if (getIsConnected()) {
      return await MongooseOrder.findByIdAndUpdate(id, data, options);
    }
    return await fileDB.Order.findByIdAndUpdate(id, data, options);
  }
};

module.exports = Order;

const mongoose = require('mongoose');
const { getIsConnected } = require('../db');
const fileDB = require('./fileDB');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  sizes: [{ type: Number }],
  images: [{ type: String }],
  description: { type: String },
  rating: { type: Number, default: 4.5 },
  numReviews: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 10 },
  featured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

let MongooseProduct;
try {
  MongooseProduct = mongoose.model('Product', productSchema);
} catch (e) {
  MongooseProduct = mongoose.model('Product');
}

const Product = {
  async find(query = {}) {
    if (getIsConnected()) {
      return await MongooseProduct.find(query);
    }
    return await fileDB.Product.find(query);
  },
  async findById(id) {
    if (getIsConnected()) {
      return await MongooseProduct.findById(id);
    }
    return await fileDB.Product.findById(id);
  },
  async create(data) {
    if (getIsConnected()) {
      return await MongooseProduct.create(data);
    }
    return await fileDB.Product.create(data);
  },
  async findByIdAndUpdate(id, data, options = { new: true }) {
    if (getIsConnected()) {
      return await MongooseProduct.findByIdAndUpdate(id, data, options);
    }
    return await fileDB.Product.findByIdAndUpdate(id, data, options);
  },
  async findByIdAndDelete(id) {
    if (getIsConnected()) {
      return await MongooseProduct.findByIdAndDelete(id);
    }
    return await fileDB.Product.findByIdAndDelete(id);
  }
};

module.exports = Product;

const mongoose = require('mongoose');
const { getIsConnected } = require('../db');
const fileDB = require('./fileDB');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  wishlist: [{ type: String }], // Store product IDs as string
  createdAt: { type: Date, default: Date.now }
});

let MongooseUser;
try {
  MongooseUser = mongoose.model('User', userSchema);
} catch (e) {
  MongooseUser = mongoose.model('User');
}

const User = {
  async findOne(query) {
    if (getIsConnected()) {
      // Mongoose select('+password') is needed because password is set to select: false
      return await MongooseUser.findOne(query).select('+password');
    }
    return await fileDB.User.findOne(query);
  },
  async findById(id) {
    if (getIsConnected()) {
      return await MongooseUser.findById(id);
    }
    return await fileDB.User.findById(id);
  },
  async create(data) {
    if (getIsConnected()) {
      return await MongooseUser.create(data);
    }
    return await fileDB.User.create(data);
  },
  async find(query = {}) {
    if (getIsConnected()) {
      return await MongooseUser.find(query);
    }
    return await fileDB.User.find(query);
  },
  async findByIdAndUpdate(id, data, options = { new: true }) {
    if (getIsConnected()) {
      return await MongooseUser.findByIdAndUpdate(id, data, options);
    }
    return await fileDB.User.findByIdAndUpdate(id, data, options);
  }
};

module.exports = User;

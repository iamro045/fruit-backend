const mongoose = require('mongoose');

// A schema for individual items in the cart
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: String, // We'll use our fruit 'id' (e.g., 'apple-fuji')
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { _id: false }); // Don't create a separate _id for cart items

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  // NEW: Add a role to differentiate users
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  // NEW: Add the cart as an array of items
  cart: [cartItemSchema]
});

module.exports = mongoose.model('User', userSchema);
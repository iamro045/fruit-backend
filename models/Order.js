const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ productId: String, name: String, quantity: Number, price: Number }],
  totalAmount: { type: Number, required: true },
  shippingAddress: { name: String, phone: String, street: String, city: String, pincode: String, state: String },
  orderId: { type: String, required: true, unique: true },
  status: { type: String, default: 'Order Confirmed' },
  
  // --- NEW FIELDS ---
  estimatedDelivery: { type: Date },
  trackingHistory: [{
    status: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
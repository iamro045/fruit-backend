const mongoose = require('mongoose');

const fruitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  images: [String],
  inStock: Boolean,
  price: Number,
  unit: String,
  category: String,
  rating: Number,
  reviews: Number,
  highlights: [String],
  description: String,
  nutrition: mongoose.Schema.Types.Mixed,
  customerReviews: [mongoose.Schema.Types.Mixed]
});

module.exports = mongoose.model('Fruit', fruitSchema);
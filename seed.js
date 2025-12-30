const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// The Schema must match the one in server.js
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
const Fruit = mongoose.model('Fruit', fruitSchema);

const fruitsData = JSON.parse(fs.readFileSync('fruits.json', 'utf-8'));

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    await Fruit.deleteMany();
    console.log('Old fruit data cleared.');

    await Fruit.insertMany(fruitsData);
    console.log('✅ Fruit data successfully imported!');

  } catch (error) {
    console.error('❌ Error with data import:', error);
  } finally {
    mongoose.connection.close();
  }
};

importData();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Import Middleware & Models ---
const auth = require('./middleware/auth');
const admin = require('./middleware/admin');
const Fruit = require('./models/Fruit');
const User = require('./models/User');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- PUBLIC API ROUTES ---
app.get('/api/fruits', async (req, res) => {
  try {
    const fruits = await Fruit.find();
    res.json(fruits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fruits', error });
  }
});

// --- AUTHENTICATION & USER ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/users/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with that email' });
    }
    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ 
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/auth/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// --- CART API ROUTES ---
app.get('/api/cart', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const fruitIds = user.cart.map(item => item.productId);
    const fruits = await Fruit.find({ id: { $in: fruitIds } });
    const cartWithDetails = user.cart.map(cartItem => {
      const fruitDetail = fruits.find(fruit => fruit.id === cartItem.productId);
      if (!fruitDetail) return null;
      return { ...fruitDetail.toObject(), quantity: cartItem.quantity };
    }).filter(Boolean);
    res.json(cartWithDetails);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/cart', auth, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const cartItemIndex = user.cart.findIndex(item => item.productId === productId);
    if (cartItemIndex > -1) {
      user.cart[cartItemIndex].quantity = quantity;
    } else {
      user.cart.push({ productId, quantity });
    }
    await user.save();
    res.json(user.cart);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

app.delete('/api/cart/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(item => item.productId !== req.params.productId);
    await user.save();
    res.json(user.cart);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// --- ORDER PROCESSING ROUTES ---
app.post('/api/orders', auth, async (req, res) => {
  try {
    const { cartItems, address, totalAmount } = req.body;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    const newOrder = new Order({
      user: req.user.id,
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount,
      shippingAddress: address,
      orderId: `GROOTT-${Date.now().toString().slice(-6)}`,
      status: 'Order Confirmed',
      estimatedDelivery: deliveryDate,
      trackingHistory: [{ status: 'Order Confirmed' }]
    });
    const savedOrder = await newOrder.save();
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).send('Server Error');
  }
});

app.get('/api/orders/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.orderId,
      user: req.user.id
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error("Fetch order failed:", error);
    res.status(500).send('Server Error');
  }
});

app.get('/api/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders failed:", error);
    res.status(500).send('Server Error');
  }
});

app.put('/api/orders/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.orderId,
      user: req.user.id 
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order with status: ${order.status}` });
    }
    order.status = 'Cancelled';
    order.trackingHistory.push({ status: 'Cancelled' });
    await order.save();
    res.json(order);
  } catch (error) {
    console.error("Cancel order failed:", error);
    res.status(500).send('Server Error');
  }
});

// --- ADMIN FRUIT CRUD ROUTES ---
app.post('/api/fruits', [auth, admin], async (req, res) => {
  try {
    const newFruit = new Fruit(req.body);
    const savedFruit = await newFruit.save();
    res.status(201).json(savedFruit);
  } catch (error) {
    res.status(400).json({ message: 'Error creating fruit', error });
  }
});

app.put('/api/fruits/:id', [auth, admin], async (req, res) => {
  try {
    const updatedFruit = await Fruit.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updatedFruit) {
      return res.status(404).json({ message: 'Fruit not found' });
    }
    res.json(updatedFruit);
  } catch (error) {
    res.status(400).json({ message: 'Error updating fruit', error });
  }
});

app.delete('/api/fruits/:id', [auth, admin], async (req, res) => {
  try {
    const deletedFruit = await Fruit.findOneAndDelete({ id: req.params.id });
    if (!deletedFruit) {
      return res.status(404).json({ message: 'Fruit not found' });
    }
    res.json({ message: 'Fruit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fruit', error });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});
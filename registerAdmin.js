const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const User = require('./models/User');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const registerAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for admin registration...');

    rl.question('Enter admin email: ', (email) => {
      // 1. ADDED: Ask for the name
      rl.question('Enter admin name: ', (name) => {
        rl.question('Enter admin password (min 6 chars): ', async (password) => {
          if (!email || !password || !name) {
            console.log('Email, name, and password are required.');
            rl.close();
            mongoose.connection.close();
            return;
          }

          const existingUser = await User.findOne({ email });
          if (existingUser) {
            console.log('An admin with this email already exists.');
            rl.close();
            mongoose.connection.close();
            return;
          }

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // 2. ADDED: Include the name when creating the new user
          const newUser = new User({
            name,
            email,
            password: hashedPassword,
          });

          await newUser.save();
          console.log('✅ Admin user created successfully!');
          rl.close();
          mongoose.connection.close();
        });
      });
    });
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

registerAdmin();
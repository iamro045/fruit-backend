const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const User = require('./models/User');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for password reset...');

    rl.question('Enter the email of the account to reset: ', async (email) => {
      const user = await User.findOne({ email });

      if (!user) {
        console.log('No user found with that email address.');
        rl.close();
        mongoose.connection.close();
        return;
      }

      rl.question('Enter the new password: ', async (newPassword) => {
        if (!newPassword || newPassword.length < 6) {
          console.log('Password must be at least 6 characters long.');
          rl.close();
          mongoose.connection.close();
          return;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        console.log('✅ Password has been reset successfully!');
        rl.close();
        mongoose.connection.close();
      });
    });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
};

resetPassword();
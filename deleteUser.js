const mongoose = require('mongoose');
const readline = require('readline');
const User = require('./models/User');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const deleteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for user deletion...');

    rl.question('Enter the email of the user to delete: ', async (email) => {
      const result = await User.deleteOne({ email: email.toLowerCase() });

      if (result.deletedCount === 0) {
        console.log('No user found with that email address.');
      } else {
        console.log(`✅ User with email '${email}' has been deleted.`);
      }
      rl.close();
      mongoose.connection.close();
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    process.exit(1);
  }
};

deleteUser();
// middleware/admin.js
const User = require('../models/User');

module.exports = async function(req, res, next) {
  try {
    // We get req.user.id from the 'auth' middleware which runs before this
    const user = await User.findById(req.user.id);

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // If user is an admin, proceed to the route handler
    next();
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
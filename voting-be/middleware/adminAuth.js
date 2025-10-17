const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Check if user exists in request (from auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // For development: Check if it's our mock admin user
    if (req.user.id === '64a1b2c3d4e5f67890123457') {
      return next(); // Allow access for mock admin
    }

    // Try to get user from database to check role
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(403).json({ message: 'User not found' });
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Access denied. Admin privileges required.' 
        });
      }

      // Add admin info to request
      req.admin = {
        id: user._id,
        name: user.name,
        email: user.email
      };

      next();
    } catch (dbError) {
      // If database lookup fails, check mock admin
      if (req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error in admin authentication' });
  }
};
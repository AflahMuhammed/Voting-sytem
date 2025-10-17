const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Check for token in header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development: use mock user if no token
      req.user = { 
        id: '64a1b2c3d4e5f67890123456', 
        role: 'user'  // Default to regular user
      };
      return next();
    }

    // If token exists, verify it
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database to check role
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      req.user = {
        id: user._id,
        role: user.role,
        email: user.email,
        name: user.name
      };
      
      next();
    } catch (jwtError) {
      // If token is invalid, fall back to mock user for development
      console.log('JWT invalid, using mock user for development');
      req.user = { 
        id: '64a1b2c3d4e5f67890123456', 
        role: 'user' 
      };
      next();
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Fall back to mock user for development
    req.user = { 
      id: '64a1b2c3d4e5f67890123456', 
      role: 'user' 
    };
    next();
  }
};
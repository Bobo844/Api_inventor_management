const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware pour vérifier le token JWT et charger l'utilisateur
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // On charge l'utilisateur complet depuis la base
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ message: 'User is not active' });
      }
      
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('[AUTH] JWT verification error');
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('[AUTH] General error');
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware pour vérifier le rôle de l'utilisateur
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    const allowedRoles = roles.map(r => r.toUpperCase());
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    
    next();
  };
};

module.exports = {
  verifyToken,
  checkRole
}; 
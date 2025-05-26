const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    const allowed = allowedRoles.map(r => r.toUpperCase());
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Accès refusé: vous n\'avez pas les permissions nécessaires' 
      });
    }

    next();
  };
};

module.exports = roleMiddleware; 
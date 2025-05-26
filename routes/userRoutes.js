const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Toutes les routes sont protégées et réservées à l'admin
router.use(verifyToken, checkRole(['ADMIN']));

// Liste des utilisateurs
router.get('/', userController.getAllUsers);

// Détail d'un utilisateur
router.get('/:id', userController.getUserById);

// Modification d'un utilisateur
router.put('/:id', [
  body('username').optional().isLength({ min: 3 }),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['ADMIN', 'MANAGER', 'USER']),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE'])
], userController.updateUser);

// Suppression d'un utilisateur
router.delete('/:id', userController.deleteUser);

module.exports = router; 
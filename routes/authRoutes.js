const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// Validation des données d'inscription
const registerValidation = [
  body('username').notEmpty().withMessage('Le nom d\'utilisateur est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role')
    .isIn(['ADMIN', 'MANAGER', 'USER'])
    .withMessage('Rôle invalide')
];

// Validation des données de connexion
const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
];

// Routes d'authentification
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

module.exports = router; 
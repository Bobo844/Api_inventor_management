const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth');
const storeController = require('../controllers/storeController');

// Validation middleware
const storeValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du magasin doit contenir entre 2 et 100 caractères'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('L\'adresse doit contenir entre 5 et 200 caractères'),
  body('phone')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Le numéro de téléphone doit contenir entre 10 et 20 caractères'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('L\'email doit être valide'),
  body('managerId')
    .optional()
    .isInt()
    .withMessage('L\'ID du gestionnaire doit être un nombre entier valide')
];

// Appliquer le middleware d'authentification à toutes les routes
router.use(verifyToken);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);

// Routes accessibles uniquement aux administrateurs et gestionnaires
router.post(
  '/',
  checkRole(['ADMIN', 'MANAGER']),
  storeValidation,
  storeController.createStore
);

router.put(
  '/:id',
  checkRole(['ADMIN', 'MANAGER']),
  storeValidation,
  storeController.updateStore
);

router.delete(
  '/:id',
  checkRole(['ADMIN']),
  storeController.deleteStore
);

module.exports = router; 
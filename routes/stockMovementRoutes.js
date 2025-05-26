const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const stockMovementController = require('../controllers/stockMovementController');
const { verifyToken } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// Validation des données de mouvement de stock
const stockMovementValidation = [
  body('product_id')
    .notEmpty()
    .withMessage('L\'ID du produit est requis')
    .isInt()
    .withMessage('L\'ID du produit doit être un nombre entier'),
  body('type')
    .notEmpty()
    .withMessage('Le type de mouvement est requis')
    .isIn(['IN', 'OUT'])
    .withMessage('Le type doit être "IN" ou "OUT"'),
  body('quantity')
    .notEmpty()
    .withMessage('La quantité est requise')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('reason')
    .optional()
    .isString()
    .withMessage('La raison doit être une chaîne de caractères')
];

// Validation des dates pour la recherche par période
const periodValidation = [
  query('start_date')
    .notEmpty()
    .withMessage('La date de début est requise')
    .isISO8601()
    .withMessage('Format de date invalide'),
  query('end_date')
    .notEmpty()
    .withMessage('La date de fin est requise')
    .isISO8601()
    .withMessage('Format de date invalide')
];

// Routes protégées par authentification
router.use(verifyToken);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', stockMovementController.getAllStockMovements);
router.get('/period', periodValidation, stockMovementController.getStockMovementsByPeriod);
router.get('/product/:product_id', stockMovementController.getProductStockHistory);
router.get('/:id', stockMovementController.getStockMovementById);

// Routes accessibles uniquement aux employés et supérieurs
router.post(
  '/',
  roleMiddleware(['admin', 'manager', 'employee']),
  stockMovementValidation,
  stockMovementController.createStockMovement
);

module.exports = router; 
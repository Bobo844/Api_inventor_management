const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// Validation des données de commande
const orderValidation = [
  body('supplier_id')
    .optional()
    .isInt()
    .withMessage('L\'ID du fournisseur doit être un nombre entier'),
  body('items')
    .isArray()
    .withMessage('Les articles doivent être un tableau')
    .notEmpty()
    .withMessage('Au moins un article est requis'),
  body('items.*.product_id')
    .isInt()
    .withMessage('L\'ID du produit doit être un nombre entier'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('items.*.unit_price')
    .isFloat({ min: 0 })
    .withMessage('Le prix unitaire doit être un nombre positif')
];

// Validation du statut de commande
const statusValidation = [
  body('status')
    .isIn(['EN_ATTENTE', 'EN_TRAITEMENT', 'EXPEDIEE', 'LIVREE', 'ANNULEE'])
    .withMessage('Statut invalide')
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
router.get('/', orderController.getAllOrders);
router.get('/period', periodValidation, orderController.getOrdersByPeriod);
router.get('/:id', orderController.getOrderById);

// Routes accessibles uniquement aux gestionnaires et administrateurs
router.post(
  '/',
  roleMiddleware(['admin', 'manager']),
  orderValidation,
  orderController.createOrder
);

router.put(
  '/:id/status',
  roleMiddleware(['admin', 'manager']),
  statusValidation,
  orderController.updateOrderStatus
);

router.put(
  '/:id/cancel',
  roleMiddleware(['admin', 'manager']),
  orderController.cancelOrder
);

module.exports = router; 
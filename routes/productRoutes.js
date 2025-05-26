const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// Validation des données de produit
const productValidation = [
  body('name')
    .notEmpty()
    .withMessage('Le nom du produit est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne doit pas dépasser 100 caractères'),
  body('description')
    .optional()
    .isString()
    .withMessage('La description doit être une chaîne de caractères'),
  body('sku')
    .notEmpty()
    .withMessage('Le SKU est requis')
    .isLength({ max: 50 })
    .withMessage('Le SKU ne doit pas dépasser 50 caractères'),
  body('price')
    .notEmpty()
    .withMessage('Le prix est requis')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  body('current_stock')
    .notEmpty()
    .withMessage('Le stock actuel est requis')
    .isInt({ min: 0 })
    .withMessage('Le stock doit être un nombre entier positif'),
  body('min_stock_level')
    .notEmpty()
    .withMessage('Le stock minimum est requis')
    .isInt({ min: 0 })
    .withMessage('Le stock minimum doit être un nombre entier positif'),
  body('category_id')
    .notEmpty()
    .withMessage('La catégorie est requise')
    .isInt()
    .withMessage('L\'ID de la catégorie doit être un nombre entier'),
  body('store_id')
    .notEmpty()
    .withMessage('Le magasin est requis')
    .isInt()
    .withMessage('L\'ID du magasin doit être un nombre entier'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Le statut doit être ACTIVE ou INACTIVE')
];

// Routes protégées par authentification
router.use(verifyToken);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', productController.getAllProducts);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/:id', productController.getProductById);

// Routes accessibles uniquement aux administrateurs et gestionnaires
router.post(
  '/',
  roleMiddleware(['admin', 'manager']),
  productValidation,
  productController.createProduct
);

router.put(
  '/:id',
  roleMiddleware(['admin', 'manager']),
  productValidation,
  productController.updateProduct
);

router.delete(
  '/:id',
  roleMiddleware(['admin', 'manager']),
  productController.deleteProduct
);

module.exports = router; 
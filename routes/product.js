const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { verifyToken, checkRole } = require('../middleware/auth');
const router = express.Router();

// Validation middleware
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('sku')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('categoryId')
    .isInt()
    .withMessage('Category ID must be a valid integer'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer')
];

const stockMovementValidation = [
  body('type')
    .isIn(['IN', 'OUT'])
    .withMessage('Movement type must be either IN or OUT'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('reason')
    .isIn(['purchase', 'sale', 'adjustment', 'return', 'loss'])
    .withMessage('Invalid reason for stock movement'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes accessible to all authenticated users
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Routes accessible only to managers and admins
router.post(
  '/',
  checkRole('admin', 'manager'),
  productValidation,
  productController.createProduct
);

router.put(
  '/:id',
  checkRole('admin', 'manager'),
  productValidation,
  productController.updateProduct
);

router.delete(
  '/:id',
  checkRole('admin'),
  productController.deleteProduct
);

// Stock movement route (accessible to managers and admins)
router.post(
  '/:id/stock',
  checkRole('admin', 'manager'),
  stockMovementValidation,
  productController.updateStock
);

module.exports = router; 
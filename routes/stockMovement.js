const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const stockMovementController = require('../controllers/stockMovementController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Validation middleware
const validateStockMovement = [
  body('productId').isInt().withMessage('Product ID must be a valid integer'),
  body('type').isIn(['IN', 'OUT']).withMessage('Type must be either IN or OUT'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reason').isIn([
    'PURCHASE',
    'SALE',
    'RETURN',
    'ADJUSTMENT',
    'DAMAGE',
    'TRANSFER'
  ]).withMessage('Invalid reason'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
];

const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
];

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes accessible to all authenticated users
router.get(
  '/',
  validateDateRange,
  stockMovementController.getAllStockMovements
);

router.get(
  '/:id',
  stockMovementController.getStockMovementById
);

router.get(
  '/stats',
  validateDateRange,
  stockMovementController.getStockMovementStats
);

// Routes accessible only to managers and admins
router.post(
  '/',
  checkRole(['admin', 'manager']),
  validateStockMovement,
  stockMovementController.createStockMovement
);

module.exports = router; 
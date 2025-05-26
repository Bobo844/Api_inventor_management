const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const orderController = require('../controllers/orderController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Validation middleware
const validateOrderItems = [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').isInt().withMessage('Product ID must be a valid integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number')
];

const validateOrder = [
  body('supplierId').isInt().withMessage('Supplier ID must be a valid integer'),
  body('expectedDeliveryDate').optional().isISO8601().withMessage('Invalid delivery date format'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  ...validateOrderItems
];

const validateOrderStatus = [
  body('status').isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid order status'),
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
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid status'),
  orderController.getAllOrders
);

router.get(
  '/:id',
  orderController.getOrderById
);

// Routes accessible only to managers and admins
router.post(
  '/',
  checkRole(['admin', 'manager']),
  validateOrder,
  orderController.createOrder
);

router.put(
  '/:id/status',
  checkRole(['admin', 'manager']),
  validateOrderStatus,
  orderController.updateOrderStatus
);

router.put(
  '/:id/cancel',
  checkRole(['admin', 'manager']),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  orderController.cancelOrder
);

module.exports = router; 
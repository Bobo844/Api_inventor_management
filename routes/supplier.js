const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const supplierController = require('../controllers/supplierController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Validation middleware
const validateSupplier = [
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('phone').isLength({ min: 10, max: 20 }).withMessage('Phone must be between 10 and 20 characters'),
  body('address').isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
  body('contactPerson').isLength({ max: 100 }).withMessage('Contact person must not exceed 100 characters'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
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
  query('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
  supplierController.getAllSuppliers
);

router.get(
  '/:id',
  supplierController.getSupplierById
);

router.get(
  '/:id/orders',
  validateDateRange,
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).withMessage('Invalid status'),
  supplierController.getSupplierOrders
);

// Routes accessible only to managers and admins
router.post(
  '/',
  checkRole(['admin', 'manager']),
  validateSupplier,
  supplierController.createSupplier
);

router.put(
  '/:id',
  checkRole(['admin', 'manager']),
  validateSupplier,
  supplierController.updateSupplier
);

// Route accessible only to admins
router.delete(
  '/:id',
  checkRole(['admin']),
  supplierController.deleteSupplier
);

module.exports = router; 
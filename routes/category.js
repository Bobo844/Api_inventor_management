const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { verifyToken, checkRole } = require('../middleware/auth');
const router = express.Router();

// Validation middleware
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

// Apply authentication middleware to all routes
router.use(verifyToken);

// Routes accessible to all authenticated users
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Routes accessible only to managers and admins
router.post(
  '/',
  checkRole('admin', 'manager'),
  categoryValidation,
  categoryController.createCategory
);

router.put(
  '/:id',
  checkRole('admin', 'manager'),
  categoryValidation,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  checkRole('admin'),
  categoryController.deleteCategory
);

module.exports = router; 
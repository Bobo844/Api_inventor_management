const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// Validation des données de catégorie
const categoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Le nom de la catégorie est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne doit pas dépasser 100 caractères'),
  body('description')
    .optional()
    .isString()
    .withMessage('La description doit être une chaîne de caractères')
];

// Routes protégées par authentification
router.use(verifyToken);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Routes accessibles uniquement aux administrateurs et gestionnaires
router.post(
  '/',
  roleMiddleware(['admin', 'manager']),
  categoryValidation,
  categoryController.createCategory
);

router.put(
  '/:id',
  roleMiddleware(['admin', 'manager']),
  categoryValidation,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  roleMiddleware(['admin', 'manager']),
  categoryController.deleteCategory
);

module.exports = router; 
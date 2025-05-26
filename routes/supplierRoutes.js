const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const supplierController = require('../controllers/supplierController');
const { verifyToken } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

// Validation des données de fournisseur
const supplierValidation = [
  body('name')
    .notEmpty()
    .withMessage('Le nom du fournisseur est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne doit pas dépasser 100 caractères'),
  body('contact_person')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le nom du contact ne doit pas dépasser 100 caractères'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .isLength({ max: 100 })
    .withMessage('L\'email ne doit pas dépasser 100 caractères'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Le numéro de téléphone ne doit pas dépasser 20 caractères'),
  body('address')
    .optional()
    .isString()
    .withMessage('L\'adresse doit être une chaîne de caractères')
];

// Routes protégées par authentification
router.use(verifyToken);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);

// Routes accessibles uniquement aux administrateurs et gestionnaires
router.post(
  '/',
  roleMiddleware(['admin', 'manager']),
  supplierValidation,
  supplierController.createSupplier
);

router.put(
  '/:id',
  roleMiddleware(['admin', 'manager']),
  supplierValidation,
  supplierController.updateSupplier
);

router.delete(
  '/:id',
  roleMiddleware(['admin', 'manager']),
  supplierController.deleteSupplier
);

module.exports = router; 
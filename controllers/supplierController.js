const { Supplier, Order, OrderItem, Product } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Obtenir tous les fournisseurs
exports.getAllSuppliers = async (req, res) => {
  try {
    console.log('Tentative de récupération des fournisseurs...');
    
    const suppliers = await Supplier.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'address', 'status'],
      order: [['name', 'ASC']]
    });
    
    console.log('Nombre de fournisseurs trouvés:', suppliers.length);
    res.json(suppliers);
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des fournisseurs:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des fournisseurs',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Obtenir un fournisseur par son ID
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'sku', 'current_stock', 'status']
        }
      ]
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Erreur lors de la récupération du fournisseur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du fournisseur',
      error: error.message
    });
  }
};

// Créer un nouveau fournisseur
exports.createSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      address,
      status
    } = req.body;

    const supplier = await Supplier.create({
      name,
      email,
      phone,
      address,
      status: status || 'ACTIVE'
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Erreur lors de la création du fournisseur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création du fournisseur',
      error: error.message
    });
  }
};

// Mettre à jour un fournisseur
exports.updateSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      taxId,
      paymentTerms,
      isActive
    } = req.body;

    await supplier.update({
      name,
      contactPerson,
      email,
      phone,
      address,
      taxId,
      paymentTerms,
      isActive
    });

    res.json(supplier);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du fournisseur' });
  }
};

// Supprimer un fournisseur
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    await supplier.destroy();
    res.json({ message: 'Fournisseur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du fournisseur' });
  }
};

// Obtenir les produits d'un fournisseur
exports.getSupplierProducts = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'sku', 'currentStock']
        }
      ]
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    res.json(supplier.products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits du fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des produits du fournisseur' });
  }
};

// Get supplier orders
exports.getSupplierOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const where = { supplierId: req.params.id };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    const orders = await Order.findAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ message: 'Error fetching supplier orders' });
  }
}; 
const { Product, Category, StockMovement } = require('../models');
const { validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');

// Obtenir tous les produits
exports.getAllProducts = async (req, res) => {
  try {
    const { category_id, search, min_stock, max_stock, store_id, status } = req.query;
    const where = {};
    if (category_id) where.category_id = category_id;
    if (store_id) where.store_id = store_id;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }
    if (min_stock !== undefined) {
      where.current_stock = { [Op.gte]: min_stock };
    }
    if (max_stock !== undefined) {
      where.current_stock = { ...where.current_stock, [Op.lte]: max_stock };
    }
    const products = await Product.findAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['name', 'ASC']]
    });
    res.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des produits' });
  }
};

// Obtenir un produit par son ID
exports.getProductById = async (req, res) => {
  try {
    console.log('[ProductController] Tentative de récupération du produit ID:', req.params.id);
    
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: StockMovement,
          as: 'stockMovements',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    console.log('[ProductController] Résultat de la recherche:', product ? 'Produit trouvé' : 'Produit non trouvé');

    if (!product) {
      console.log('[ProductController] Produit non trouvé avec ID:', req.params.id);
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    console.log('[ProductController] Produit trouvé:', {
      id: product.id,
      name: product.name,
      category: product.category ? product.category.name : 'Pas de catégorie',
      stockMovements: product.stockMovements ? product.stockMovements.length : 0
    });

    res.json(product);
  } catch (error) {
    console.error('[ProductController] Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Erreur lors de la récupération du produit' });
  }
};

// Créer un nouveau produit
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      name,
      description,
      sku,
      price,
      current_stock,
      min_stock_level,
      category_id,
      store_id,
      status
    } = req.body;
    // Vérifier si le SKU est unique
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ message: 'Le SKU existe déjà' });
    }
    // Vérifier si la catégorie existe
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    // Vérifier si le magasin existe (optionnel)
    // const store = await Store.findByPk(store_id);
    // if (!store) {
    //   return res.status(404).json({ message: 'Magasin non trouvé' });
    // }
    const product = await Product.create({
      name,
      description,
      sku,
      price,
      current_stock,
      min_stock_level,
      category_id,
      store_id,
      status: status || 'ACTIVE'
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({ message: 'Erreur lors de la création du produit' });
  }
};

// Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    const {
      name,
      description,
      sku,
      price,
      current_stock,
      min_stock_level,
      category_id,
      store_id,
      status
    } = req.body;
    // Vérifier si le nouveau SKU est unique (si modifié)
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ where: { sku } });
      if (existingProduct) {
        return res.status(400).json({ message: 'Le SKU existe déjà' });
      }
    }
    // Vérifier si la catégorie existe (si modifiée)
    if (category_id && category_id !== product.category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
    }
    // Vérifier si le magasin existe (optionnel)
    // if (store_id && store_id !== product.store_id) {
    //   const store = await Store.findByPk(store_id);
    //   if (!store) {
    //     return res.status(404).json({ message: 'Magasin non trouvé' });
    //   }
    // }
    await product.update({
      name,
      description,
      sku,
      price,
      current_stock,
      min_stock_level,
      category_id,
      store_id,
      status
    });
    res.json(product);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du produit' });
  }
};

// Supprimer un produit (suppression logique)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    // Vérifier si le produit a du stock
    if (product.current_stock > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer un produit avec du stock existant'
      });
    }
    await product.update({ status: 'INACTIVE' });
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du produit' });
  }
};

// Mettre à jour le stock d'un produit
exports.updateStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, quantity, reason, notes } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    const previousStock = product.current_stock;
    let newStock;

    if (type === 'IN') {
      newStock = previousStock + quantity;
    } else if (type === 'OUT') {
      if (previousStock < quantity) {
        return res.status(400).json({
          message: 'Stock insuffisant'
        });
      }
      newStock = previousStock - quantity;
    } else {
      return res.status(400).json({
        message: 'Type de mouvement invalide'
      });
    }

    // Créer un enregistrement de mouvement de stock
    await StockMovement.create({
      productId: product.id,
      type,
      quantity,
      reason,
      notes,
      userId: req.user.id,
      previousStock,
      newStock
    });

    // Mettre à jour le stock du produit
    await product.update({ current_stock: newStock });

    res.json({
      message: 'Stock mis à jour avec succès',
      product: {
        id: product.id,
        name: product.name,
        stock: newStock
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du stock:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du stock' });
  }
};

// Obtenir les produits avec stock faible
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'ACTIVE',
        current_stock: { [Op.lte]: Sequelize.col('min_stock_level') }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['current_stock', 'ASC']]
    });
    res.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits en stock faible:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des produits en stock faible' });
  }
}; 
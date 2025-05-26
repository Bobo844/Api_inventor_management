const { Store, User, Product, StockMovement } = require('../models');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Obtenir tous les magasins
exports.getAllStores = async (req, res) => {
  try {
    console.log('[StoreController] Tentative de récupération de tous les magasins');
    
    const stores = await Store.findAll({
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'sku', 'current_stock']
        }
      ]
    });

    console.log('[StoreController] Nombre de magasins trouvés:', stores.length);
    console.log('[StoreController] Détails des magasins:', stores.map(store => ({
      id: store.id,
      name: store.name,
      productsCount: store.products ? store.products.length : 0
    })));

    res.json(stores);
  } catch (error) {
    console.error('[StoreController] Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Erreur lors de la récupération des magasins' });
  }
};

// Obtenir un magasin par son ID
exports.getStoreById = async (req, res) => {
  try {
    console.log('[StoreController] Tentative de récupération du magasin ID:', req.params.id);
    
    const store = await Store.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'sku', 'current_stock']
        }
      ]
    });

    console.log('[StoreController] Résultat de la recherche:', store ? 'Magasin trouvé' : 'Magasin non trouvé');

    if (!store) {
      console.log('[StoreController] Magasin non trouvé avec ID:', req.params.id);
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }

    console.log('[StoreController] Magasin trouvé:', {
      id: store.id,
      name: store.name,
      productsCount: store.products ? store.products.length : 0
    });

    res.json(store);
  } catch (error) {
    console.error('[StoreController] Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Erreur lors de la récupération du magasin' });
  }
};

// Créer un nouveau magasin
exports.createStore = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      address,
      phone,
      email,
      isActive
    } = req.body;

    const store = await Store.create({
      name,
      address,
      phone,
      email,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(store);
  } catch (error) {
    console.error('Erreur lors de la création du magasin:', error);
    res.status(500).json({ message: 'Erreur lors de la création du magasin' });
  }
};

// Mettre à jour un magasin
exports.updateStore = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const store = await Store.findByPk(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }

    const {
      name,
      address,
      phone,
      email,
      isActive
    } = req.body;

    await store.update({
      name,
      address,
      phone,
      email,
      isActive
    });

    res.json(store);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du magasin:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du magasin' });
  }
};

// Supprimer un magasin
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }

    await store.destroy();
    res.json({ message: 'Magasin supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du magasin:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du magasin' });
  }
};

// Obtenir les produits d'un magasin
exports.getStoreProducts = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'sku', 'currentStock']
        }
      ]
    });

    if (!store) {
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }

    res.json(store.products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits du magasin:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des produits du magasin' });
  }
};

// Obtenir les mouvements de stock d'un magasin
exports.getStoreStockMovements = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }

    const stockMovements = await StockMovement.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          where: { storeId: req.params.id },
          attributes: ['id', 'name', 'sku']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(stockMovements);
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements de stock du magasin:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des mouvements de stock du magasin' });
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
const { StockMovement, Product, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');

// Obtenir tous les mouvements de stock
exports.getAllStockMovements = async (req, res) => {
  try {
    const {
      productId,
      type,
      reason,
      startDate,
      endDate,
      userId
    } = req.query;

    const where = {};

    if (productId) {
      where.product_id = productId;
    }

    if (type) {
      where.type = type;
    }

    if (reason) {
      where.reason = reason;
    }

    if (userId) {
      where.user_id = userId;
    }

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    const movements = await StockMovement.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(movements);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des mouvements de stock',
      error: error.message
    });
  }
};

// Obtenir un mouvement de stock par son ID
exports.getStockMovementById = async (req, res) => {
  try {
    const movement = await StockMovement.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!movement) {
      return res.status(404).json({ message: 'Mouvement de stock non trouvé' });
    }

    res.json(movement);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du mouvement de stock',
      error: error.message
    });
  }
};

// Créer un mouvement de stock
exports.createStockMovement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      product_id,
      type,
      quantity,
      reason,
      notes
    } = req.body;

    // Vérifier si le produit existe
    const product = await Product.findByPk(product_id);
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
          message: 'Stock insuffisant',
          current_stock: previousStock,
          requested_quantity: quantity
        });
      }
      newStock = previousStock - quantity;
    } else {
      return res.status(400).json({
        message: 'Type de mouvement invalide'
      });
    }

    // Créer un enregistrement de mouvement de stock
    const movement = await StockMovement.create({
      product_id,
      type,
      quantity,
      reason,
      notes,
      user_id: req.user.id,
      previous_stock: previousStock,
      new_stock: newStock
    });

    // Mettre à jour le stock du produit
    await product.update({ current_stock: newStock });

    // Obtenir l'enregistrement complet du mouvement avec les relations
    const completeMovement = await StockMovement.findByPk(movement.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });

    res.status(201).json(completeMovement);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création du mouvement de stock',
      error: error.message
    });
  }
};

// Obtenir les statistiques des mouvements de stock
exports.getStockMovementStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    const stats = await StockMovement.findAll({
      where,
      attributes: [
        'type',
        'reason',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['type', 'reason']
    });

    res.json(stats);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des statistiques des mouvements de stock',
      error: error.message
    });
  }
};

// Obtenir l'historique des stocks d'un produit
exports.getProductStockHistory = async (req, res) => {
  try {
    const { product_id } = req.params;
    const movements = await StockMovement.findAll({
      where: { product_id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(movements);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'historique des stocks du produit',
      error: error.message
    });
  }
};

// Obtenir les mouvements de stock par période
exports.getStockMovementsByPeriod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }
    const movements = await StockMovement.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(movements);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des mouvements de stock par période',
      error: error.message
    });
  }
}; 
const { Order, OrderItem, Product, Supplier, StockMovement } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtenir toutes les commandes
exports.getAllOrders = async (req, res) => {
  try {
    const {
      status,
      supplierId,
      startDate,
      endDate,
      search
    } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { '$supplier.name$': { [Op.like]: `%${search}%` } }
      ];
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes' });
  }
};

// Obtenir une commande par son ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email', 'phone', 'address']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'currentStock']
          }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.json(order);
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la commande' });
  }
};

// Créer une nouvelle commande
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Accepte camelCase et snake_case
    const {
      supplierId,
      supplier_id,
      items,
      expectedDeliveryDate,
      expected_delivery_date,
      notes
    } = req.body;

    // Harmonisation des champs
    const realSupplierId = supplierId || supplier_id;
    const realExpectedDeliveryDate = expectedDeliveryDate || expected_delivery_date;

    // Harmonisation des items
    const normalizedItems = (items || []).map(item => ({
      productId: item.productId || item.product_id,
      quantity: Number(item.quantity),
      unitPrice: item.unitPrice || item.unit_price
    }));

    // Vérifie que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      await transaction.rollback();
      return res.status(401).json({ message: 'Authentification requise' });
    }

    // Vérifier si le fournisseur existe et est actif
    const supplier = await Supplier.findOne({
      where: {
        id: realSupplierId,
        status: 'ACTIVE'
      }
    });

    if (!supplier) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Fournisseur actif non trouvé' });
    }

    // Générer le numéro de commande
    const orderNumber = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculer le montant total et valider les produits
    let totalAmount = 0;
    for (const item of normalizedItems) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          message: `Produit avec l'ID ${item.productId} non trouvé`
        });
      }
      totalAmount += item.quantity * item.unitPrice;
    }

    // Créer la commande
    const order = await Order.create({
      orderNumber,
      supplierId: realSupplierId,
      totalAmount,
      status: 'EN_ATTENTE',
      expectedDeliveryDate: realExpectedDeliveryDate,
      notes,
      createdBy: req.user.id
    }, { transaction });

    // Créer les éléments de la commande
    await Promise.all(normalizedItems.map(item =>
      OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      }, { transaction })
    ));

    await transaction.commit();

    // Obtenir la commande complète avec les relations
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }]
        }
      ]
    });

    res.status(201).json(completeOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande' });
  }
};

// Mettre à jour le statut de la commande
exports.updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Valider la transition de statut
    const validTransitions = {
      'EN_ATTENTE': ['EN_TRAITEMENT', 'ANNULEE', 'LIVREE'],
      'EN_TRAITEMENT': ['EXPEDIEE', 'ANNULEE'],
      'EXPEDIEE': ['LIVREE', 'ANNULEE'],
      'LIVREE': [],
      'ANNULEE': []
    };

    if (!validTransitions[order.status].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Impossible de changer le statut de ${order.status} à ${status}`
      });
    }

    // Mettre à jour le statut de la commande
    await order.update({ 
      status,
      notes: notes || order.notes 
    }, { transaction });

    // Gérer les mouvements de stock selon le nouveau statut
    if (status === 'LIVREE') {
      // Ajouter le stock pour chaque produit de la commande
      for (const item of order.items) {
        const product = item.product;
        const previousStock = product.current_stock;
        const newStock = previousStock + item.quantity;

        // Créer un mouvement de stock
        await StockMovement.create({
          product_id: product.id,
          type: 'IN',
          quantity: item.quantity,
          reason: 'PURCHASE',
          notes: `Stock ajouté de la commande ${order.orderNumber}`,
          user_id: req.user.id,
          previous_stock: previousStock,
          new_stock: newStock
        }, { transaction });

        // Mettre à jour le stock du produit
        await product.update({ current_stock: newStock }, { transaction });
      }
    } else if (status === 'ANNULEE' && order.status === 'LIVREE') {
      // Retirer le stock si la commande était livrée
      for (const item of order.items) {
        const product = item.product;
        const previousStock = product.current_stock;
        const newStock = previousStock - item.quantity;

        if (newStock < 0) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Stock insuffisant pour annuler la commande. Produit: ${product.name}`
          });
        }

        // Créer un mouvement de stock
        await StockMovement.create({
          product_id: product.id,
          type: 'OUT',
          quantity: item.quantity,
          reason: 'ADJUSTMENT',
          notes: `Stock retiré suite à l'annulation de la commande ${order.orderNumber}`,
          user_id: req.user.id,
          previous_stock: previousStock,
          new_stock: newStock
        }, { transaction });

        // Mettre à jour le stock du produit
        await product.update({ current_stock: newStock }, { transaction });
      }
    }

    await transaction.commit();

    // Récupérer la commande mise à jour avec toutes les relations
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'current_stock']
          }]
        }
      ]
    });

    res.json({
      message: 'Statut de la commande mis à jour avec succès',
      order: updatedOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de la mise à jour du statut de la commande:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du statut de la commande',
      error: error.message
    });
  }
};

// Annuler une commande
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.status === 'LIVREE') {
      return res.status(400).json({
        message: 'Impossible d\'annuler une commande livrée'
      });
    }

    if (order.status === 'ANNULEE') {
      return res.status(400).json({
        message: 'La commande est déjà annulée'
      });
    }

    await order.update({
      status: 'ANNULEE',
      notes: req.body.notes || 'Commande annulée par l\'utilisateur'
    });

    res.json({ message: 'Commande annulée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la commande:', error);
    res.status(500).json({ message: 'Erreur lors de l\'annulation de la commande' });
  }
};

// Obtenir les commandes par période
exports.getOrdersByPeriod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }
    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes par période:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes par période' });
  }
}; 
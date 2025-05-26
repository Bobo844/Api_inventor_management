const { Category, Product } = require('../models');
const { validationResult } = require('express-validator');

// Obtenir toutes les catégories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name']
    });
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories' });
  }
};

// Obtenir une catégorie par son ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'sku', 'currentStock']
      }]
    });

    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    res.json(category);
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la catégorie' });
  }
};

// Créer une nouvelle catégorie
exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const category = await Category.create({
      name,
      description
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la catégorie' });
  }
};

// Mettre à jour une catégorie
exports.updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    const { name, description } = req.body;

    await category.update({
      name,
      description
    });

    res.json(category);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la catégorie' });
  }
};

// Supprimer une catégorie (suppression logique)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    // Vérifier si la catégorie a des produits
    const productsCount = await Product.count({
      where: { categoryId: category.id }
    });

    if (productsCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer une catégorie avec des produits associés'
      });
    }

    await category.update({ isActive: false });
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie' });
  }
}; 
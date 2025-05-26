const { User } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

// Obtenir un utilisateur par son ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

// Créer un nouvel utilisateur
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      username,
      email,
      password,
      role,
      status
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'USER',
      status: status || 'ACTIVE'
    });

    // Retourner l'utilisateur sans le mot de passe
    const userWithoutPassword = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const {
      username,
      email,
      password,
      role,
      status
    } = req.body;

    // Vérifier si l'email ou le nom d'utilisateur est déjà utilisé
    if (email || username) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email || user.email },
            { username: username || user.username }
          ],
          id: { [Op.ne]: user.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà'
        });
      }
    }

    const updateData = {
      username,
      email,
      role,
      status
    };

    // Mettre à jour le mot de passe seulement s'il est fourni
    if (password) {
      updateData.password = password;
    }

    await user.update(updateData);

    // Retourner l'utilisateur mis à jour sans le mot de passe
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await user.destroy();
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
};

// Obtenir le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

// Mettre à jour le profil de l'utilisateur connecté
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const {
      username,
      email,
      password
    } = req.body;

    // Vérifier si l'email ou le nom d'utilisateur est déjà utilisé
    if (email || username) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email || user.email },
            { username: username || user.username }
          ],
          id: { [Op.ne]: user.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà'
        });
      }
    }

    const updateData = {
      username,
      email
    };

    // Mettre à jour le mot de passe seulement s'il est fourni
    if (password) {
      updateData.password = password;
    }

    await user.update(updateData);

    // Retourner l'utilisateur mis à jour sans le mot de passe
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
}; 
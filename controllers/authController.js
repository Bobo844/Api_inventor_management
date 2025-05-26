const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

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

    // Créer un nouvel utilisateur
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'USER'
    });

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Utilisateur inscrit avec succès',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'inscription de l\'utilisateur',
      error: error.message
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Rechercher l'utilisateur par email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        message: 'Email ou mot de passe invalide'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Email ou mot de passe invalide'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// Obtenir les informations de l'utilisateur connecté
exports.getCurrentUser = async (req, res) => {
  try {
    // L'utilisateur est déjà disponible dans req.user grâce au middleware verifyToken
    const user = req.user;
    
    // Afficher le username et le role dans la console
    console.log('Utilisateur connecté:', {
      username: user.username,
      role: user.role
    });
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de l\'utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des informations de l\'utilisateur',
      error: error.message
    });
  }
}; 
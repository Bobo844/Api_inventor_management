const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');

async function runMigration() {
  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../migrations/20240320_add_stock_column.js');
    const migration = require(migrationPath);

    // Exécuter la migration
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migration exécutée avec succès');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    process.exit();
  }
}

runMigration(); 
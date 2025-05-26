const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fonction pour exécuter une commande et afficher la sortie
function runCommand(command) {
  try {
    console.log(`\n🚀 Exécution de la commande: ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Erreur lors de l'exécution de la commande: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Fonction pour vérifier si un fichier existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Fonction pour créer un dossier s'il n'existe pas
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Fonction principale de build
async function build() {
  console.log('\n🏗️  Démarrage du processus de build...');

  // Vérifier si .env existe
  if (!fileExists('.env')) {
    console.error('\n❌ Le fichier .env est manquant. Veuillez le créer avant de continuer.');
    process.exit(1);
  }

  // Nettoyer le dossier dist
  console.log('\n🧹 Nettoyage du dossier dist...');
  if (fileExists('dist')) {
    runCommand('rimraf dist');
  }

  // Créer le dossier dist
  ensureDirectoryExists('dist');

  // Installer les dépendances si nécessaire
  if (!fileExists('node_modules')) {
    console.log('\n📦 Installation des dépendances...');
    runCommand('npm install');
  }

  // Exécuter les tests
  console.log('\n🧪 Exécution des tests...');
  runCommand('npm test');

  // Build du projet
  console.log('\n🔨 Construction du projet...');
  runCommand('npm run build');

  // Vérifier la structure du build
  console.log('\n🔍 Vérification de la structure du build...');
  const requiredDirs = ['dist/config', 'dist/controllers', 'dist/middleware', 'dist/models', 'dist/routes', 'dist/public'];
  requiredDirs.forEach(dir => {
    if (!fileExists(dir)) {
      console.error(`\n❌ Le dossier ${dir} est manquant dans le build.`);
      process.exit(1);
    }
  });

  console.log('\n✅ Build terminé avec succès!');
  console.log('\n📝 Structure du build:');
  runCommand('tree dist');
}

// Exécuter le build
build().catch(error => {
  console.error('\n❌ Erreur lors du build:', error);
  process.exit(1);
}); 
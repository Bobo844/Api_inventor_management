-- Création de la base de données
CREATE DATABASE IF NOT EXISTS inventory_management;
USE inventory_management;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'USER') NOT NULL DEFAULT 'USER',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des magasins
CREATE TABLE IF NOT EXISTS stores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sku VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 0,
    category_id INT,
    store_id INT,
    supplier_id INT,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('EN_ATTENTE', 'EN_TRAITEMENT', 'EXPEDIEE', 'LIVREE', 'ANNULEE') NOT NULL DEFAULT 'EN_ATTENTE',
    expected_delivery_date DATE,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table des éléments de commande
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    type ENUM('IN', 'OUT') NOT NULL,
    quantity INT NOT NULL,
    reason ENUM('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'RESTOCK') NOT NULL,
    notes TEXT,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insertion des données de test

-- Insertion d'un utilisateur admin
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'ADMIN');

-- Insertion de catégories
INSERT INTO categories (name, description) VALUES
('Électronique', 'Produits électroniques et gadgets'),
('Vêtements', 'Vêtements et accessoires'),
('Alimentation', 'Produits alimentaires et boissons'),
('Mobilier', 'Meubles et décoration');

-- Insertion de magasins
INSERT INTO stores (name, address, phone, email) VALUES
('Magasin Principal', '123 Rue Principale, Ville', '0123456789', 'principal@store.com'),
('Magasin Secondaire', '456 Avenue Secondaire, Ville', '0987654321', 'secondaire@store.com');

-- Insertion de fournisseurs
INSERT INTO suppliers (name, email, phone, address) VALUES
('Fournisseur A', 'contact@fournisseur-a.com', '0123456789', '123 Rue Fournisseur, Ville'),
('Fournisseur B', 'contact@fournisseur-b.com', '0987654321', '456 Avenue Fournisseur, Ville');

-- Insertion de produits
INSERT INTO products (name, description, sku, price, current_stock, min_stock_level, category_id, store_id, supplier_id) VALUES
('Smartphone XYZ', 'Smartphone dernier cri', 'PHN-001', 699.99, 50, 10, 1, 1, 1),
('T-shirt Basic', 'T-shirt en coton', 'TSH-001', 19.99, 100, 20, 2, 1, 1),
('Café Premium', 'Café en grains premium', 'CAF-001', 9.99, 200, 50, 3, 2, 2),
('Table Basse', 'Table basse moderne', 'TBL-001', 149.99, 15, 5, 4, 1, 1);

-- Création des index pour optimiser les performances
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- Mise à jour de la table orders pour les nouveaux statuts
ALTER TABLE orders 
MODIFY COLUMN status ENUM('EN_ATTENTE', 'EN_TRAITEMENT', 'EXPEDIEE', 'LIVREE', 'ANNULEE') 
NOT NULL DEFAULT 'EN_ATTENTE';

-- Mise à jour des commandes existantes
UPDATE orders 
SET status = CASE 
    WHEN status = 'PENDING' THEN 'EN_ATTENTE'
    WHEN status = 'PROCESSING' THEN 'EN_TRAITEMENT'
    WHEN status = 'SHIPPED' THEN 'EXPEDIEE'
    WHEN status = 'DELIVERED' THEN 'LIVREE'
    WHEN status = 'CANCELLED' THEN 'ANNULEE'
    ELSE status
END; 
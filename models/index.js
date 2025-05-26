const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const StockMovement = require('./StockMovement');
const Supplier = require('./Supplier');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Store = require('./Store');

// Product - Category associations
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

// Product - Store associations
Product.belongsTo(Store, {
  foreignKey: 'store_id',
  as: 'store'
});
Store.hasMany(Product, {
  foreignKey: 'store_id',
  as: 'products'
});

// Product - Supplier associations
Product.belongsTo(Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier'
});
Supplier.hasMany(Product, {
  foreignKey: 'supplier_id',
  as: 'products'
});

// Product - StockMovement associations
Product.hasMany(StockMovement, {
  foreignKey: 'product_id',
  as: 'stockMovements'
});

StockMovement.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// StockMovement associations
StockMovement.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});
User.hasMany(StockMovement, {
  foreignKey: 'user_id',
  as: 'stockMovements'
});

// Order associations
Order.belongsTo(Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier'
});
Supplier.hasMany(Order, {
  foreignKey: 'supplier_id',
  as: 'orders'
});

Order.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});
User.hasMany(Order, {
  foreignKey: 'created_by',
  as: 'orders'
});

// OrderItem associations
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items'
});
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});
Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'orderItems'
});

module.exports = {
  User,
  Category,
  Product,
  StockMovement,
  Supplier,
  Order,
  OrderItem,
  Store
}; 
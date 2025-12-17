const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');
const logger = require('../core/logger');

const sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: (msg) => {
    if (config.node_env === 'development') logger.debug(msg);
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Customer = require('./customer')(sequelize, DataTypes);
db.Product = require('./product')(sequelize, DataTypes);
db.ProductVariant = require('./productVariant')(sequelize, DataTypes);
db.Order = require('./order')(sequelize, DataTypes);
db.OrderItem = require('./orderItem')(sequelize, DataTypes);

db.Customer.hasMany(db.Order, { foreignKey: 'customer_id', as: 'orders' });
db.Order.belongsTo(db.Customer, { foreignKey: 'customer_id', as: 'customer' });

db.Product.hasMany(db.ProductVariant, {
  foreignKey: 'product_id',
  as: 'variants',
  onDelete: 'CASCADE'
});
db.ProductVariant.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' });

db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id', as: 'order' });

db.Product.hasMany(db.OrderItem, { foreignKey: 'product_id' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' });

db.ProductVariant.hasMany(db.OrderItem, { foreignKey: 'variant_id' });
db.OrderItem.belongsTo(db.ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

module.exports = db;

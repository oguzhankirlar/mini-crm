module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 }
      },
      originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'original_price'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      hasStockTracking: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'has_stock_tracking'
      }
    },
    {
      tableName: 'products',
      underscored: true,
      timestamps: true
    }
  );

  return Product;
};

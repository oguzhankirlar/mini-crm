module.exports = (sequelize, DataTypes) => {
  const ProductVariant = sequelize.define(
    'ProductVariant',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id',
        references: { model: 'products', key: 'id' }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'stock_quantity',
        validate: { min: 0 }
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: 'product_variants',
      underscored: true,
      timestamps: true
    }
  );

  return ProductVariant;
};

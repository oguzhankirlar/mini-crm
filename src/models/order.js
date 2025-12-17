module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'customer_id',
        references: { model: 'customers', key: 'id' }
      },
      orderNumber: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        field: 'order_number'
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'contact_email',
        validate: { isEmail: true }
      },
      shippingName: { type: DataTypes.STRING, allowNull: false, field: 'shipping_name' },
      shippingPhone: { type: DataTypes.STRING, allowNull: false, field: 'shipping_phone' },
      shippingAddress: { type: DataTypes.TEXT, allowNull: false, field: 'shipping_address' },
      shippingCity: { type: DataTypes.STRING, allowNull: false, field: 'shipping_city' },

      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      shippingCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'shipping_cost'
      },
      finalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'final_amount'
      },

      paymentMethod: {
        type: DataTypes.ENUM('cod', 'transfer'),
        allowNull: false,
        field: 'payment_method'
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'preparing',
          'shipped',
          'delivered',
          'cancelled',
          'returned'
        ),
        defaultValue: 'pending',
        allowNull: false
      },
      cancelReason: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'cancel_reason'
      }
    },
    {
      tableName: 'orders',
      underscored: true,
      timestamps: true
    }
  );

  return Order;
};

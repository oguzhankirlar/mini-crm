'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      order_number: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      shipping_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      shipping_phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      shipping_address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      shipping_city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0
      },
      shipping_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0
      },
      final_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0
      },
      payment_method: {
        type: Sequelize.ENUM('cod', 'transfer'),
        allowNull: false
      },

      status: {
        type: Sequelize.ENUM(
          'pending',
          'preparing',
          'shipped',
          'delivered',
          'cancelled',
          'returned'
        ),
        allowNull: false,
        defaultValue: 'pending'
      },
      cancel_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_payment_method";');
  }
};

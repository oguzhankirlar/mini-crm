'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('customers', ['email'], {
      name: 'idx_customers_email',
      unique: true
    });

    await queryInterface.addIndex('product_variants', ['sku'], {
      name: 'idx_product_variants_sku',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('customers', 'idx_customers_email');
    await queryInterface.removeIndex('product_variants', 'idx_product_variants_sku');
  }
};
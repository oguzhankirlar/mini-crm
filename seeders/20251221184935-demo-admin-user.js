'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123123', salt);

    await queryInterface.bulkInsert(
      'customers',
      [
        {
          first_name: 'Sistem',
          last_name: 'Yöneticisi',
          email: 'admin@sirket.com',
          password_hash: passwordHash,
          role: 'admin',
          phone: '5372722089',
          address: 'Merkez Ofis',
          city: 'İstanbul',
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('customers', { email: 'admin@sirket.com' }, {});
  }
};

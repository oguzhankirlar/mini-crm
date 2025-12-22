'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const productsData = [
      {
        id: 1,
        name: 'Laptop Pro X1',
        price: 25000.0,
        description: 'Yüksek performanslı iş bilgisayarı.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'Kablosuz Kulaklık',
        price: 1500.0,
        description: 'Gürültü engelleyici özellikli.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: 'Akıllı Saat V2',
        price: 3200.0,
        description: 'Nabız ölçer ve GPS.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        name: 'Oyun Klavyesi RGB',
        price: 850.0,
        description: 'Mekanik hisli klavye.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        name: '4K Monitör 27"',
        price: 8000.0,
        description: 'IPS panel, renk doğruluğu yüksek.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        name: 'Ergonomik Mouse',
        price: 450.0,
        description: 'Bilek ağrısını önler.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 7,
        name: 'USB-C Hub',
        price: 600.0,
        description: '7 portlu çoklayıcı.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 8,
        name: 'Laptop Çantası',
        price: 350.0,
        description: 'Su geçirmez kumaş.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 9,
        name: 'Harici SSD 1TB',
        price: 2200.0,
        description: 'Ultra hızlı veri transferi.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 10,
        name: 'Webcam 1080p',
        price: 900.0,
        description: 'Yayıncılar için ideal.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', productsData, {});

    const variantsData = [
      {
        product_id: 1,
        name: '16GB RAM / 512GB SSD',
        stock_quantity: 10,
        sku: 'LPT-001',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 1,
        name: '32GB RAM / 1TB SSD',
        stock_quantity: 5,
        sku: 'LPT-002',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 2,
        name: 'Siyah',
        stock_quantity: 50,
        sku: 'HEAD-BLK',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 2,
        name: 'Beyaz',
        stock_quantity: 30,
        sku: 'HEAD-WHT',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 3,
        name: 'Standart',
        stock_quantity: 20,
        sku: 'WATCH-001',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 4,
        name: 'Türkçe Q',
        stock_quantity: 15,
        sku: 'KB-TR',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 5,
        name: 'Standart',
        stock_quantity: 8,
        sku: 'MON-27',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 6,
        name: 'Siyah',
        stock_quantity: 100,
        sku: 'MOUSE-01',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 7,
        name: 'Gri',
        stock_quantity: 40,
        sku: 'HUB-GRY',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 8,
        name: 'Mavi',
        stock_quantity: 25,
        sku: 'BAG-BLU',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 9,
        name: '1TB',
        stock_quantity: 12,
        sku: 'SSD-1TB',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 10,
        name: 'Standart',
        stock_quantity: 18,
        sku: 'CAM-1080',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('product_variants', variantsData, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('product_variants', null, {});
    await queryInterface.bulkDelete('products', null, {});
  }
};

const { Product, ProductVariant, sequelize } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../core/logger');

class ProductService {
  async getAllProducts(query) {
    const { page = 1, limit = 10, search, minPrice, maxPrice } = query;
    const offset = (page - 1) * limit;

    if (search || minPrice || maxPrice) {
      logger.debug('Ürün araması yapılıyor', { search, minPrice, maxPrice });
    }

    const where = { isActive: true };

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    const products = await Product.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: ProductVariant, as: 'variants' }],
      distinct: true
    });

    return {
      totalItems: products.count,
      totalPages: Math.ceil(products.count / limit),
      currentPage: parseInt(page),
      data: products.rows
    };
  }

  async getProductById(id) {
    const product = await Product.findByPk(id, {
      include: [{ model: ProductVariant, as: 'variants' }]
    });

    if (!product) {
      logger.warn('Ürün bulunamadı', { productId: id });
      throw new Error('Ürün bulunamadı.');
    }
    return product;
  }

  async createProduct(payload) {
    const t = await sequelize.transaction();

    try {
      const { name, description, price, originalPrice, hasStockTracking, variants } = payload;

      const newProduct = await Product.create(
        {
          name,
          description,
          price,
          originalPrice,
          hasStockTracking: hasStockTracking !== false,
          isActive: true
        },
        { transaction: t }
      );

      if (variants && variants.length > 0) {
        const variantsData = variants.map((v) => ({
          productId: newProduct.id,
          name: v.name,
          stockQuantity: hasStockTracking === false ? 0 : v.stockQuantity,
          sku: v.sku
        }));

        await ProductVariant.bulkCreate(variantsData, { transaction: t });
      }

      await t.commit();

      logger.info('Ürün veritabanına kaydedildi', {
        productId: newProduct.id,
        variantCount: variants ? variants.length : 0
      });

      return this.getProductById(newProduct.id);
    } catch (error) {
      await t.rollback();
      logger.error('Ürün oluşturma Transaction hatası', { error: error.message });
      throw error;
    }
  }

  async updateStock(variantId, quantity) {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error('Varyant bulunamadı.');

    const oldStock = variant.stockQuantity;
    variant.stockQuantity = quantity;
    await variant.save();

    logger.info('Stok güncellendi', { variantId, oldStock, newStock: quantity });
    return variant;
  }

  async deleteProduct(id) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Ürün bulunamadı');

    product.isActive = false;
    await product.save();
    return { message: 'Ürün arşivlendi/silindi.' };
  }

  async updateProduct(id, data) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Ürün bulunamadı.');

    if (data.name) product.name = data.name;
    if (data.description) product.description = data.description;
    if (data.price) product.price = data.price;
    if (data.hasStockTracking !== undefined) product.hasStockTracking = data.hasStockTracking;
    if (data.isActive !== undefined) product.isActive = data.isActive;

    await product.save();
    return product;
  }

  async addVariant(productId, data) {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error('Ürün bulunamadı.');

    const variant = await ProductVariant.create({
      productId: product.id,
      name: data.name,
      stockQuantity: data.stockQuantity || 0,
      sku: data.sku
    });

    return variant;
  }

  async updateVariant(variantId, data) {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error('Varyant bulunamadı.');

    if (data.stockQuantity !== undefined) variant.stockQuantity = data.stockQuantity;
    if (data.name) variant.name = data.name;
    if (data.sku) variant.sku = data.sku;

    await variant.save();
    return variant;
  }

  async deleteVariant(variantId) {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error('Varyant bulunamadı.');

    await variant.destroy();
    return { message: 'Varyant silindi.' };
  }

  async getLowStock() {
    const variants = await ProductVariant.findAll({
      where: {
        stockQuantity: { [Op.lt]: 5 }
      },
      include: [{ model: Product, as: 'product', attributes: ['name'] }]
    });

    if (variants.length > 0) {
      logger.info('Kritik stok uyarısı tetiklendi', { count: variants.length });
    }

    return variants;
  }
}

module.exports = new ProductService();

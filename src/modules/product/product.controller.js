const productService = require('./product.service');
const logger = require('../../core/logger');

class ProductController {
  async getAll(req, res) {
    try {
      const result = await productService.getAllProducts(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Ürün listesi çekilemedi', { query: req.query, error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json({ success: true, data: product });
    } catch (error) {
      logger.warn('Ürün detay hatası', { productId: req.params.id, error: error.message });
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const product = await productService.createProduct(req.body);

      logger.info('Yeni ürün oluşturuldu', {
        adminId: req.user.id,
        productId: product.id,
        productName: product.name
      });

      res.status(201).json({ success: true, message: 'Ürün oluşturuldu.', data: product });
    } catch (error) {
      logger.error('Ürün oluşturma hatası', { adminId: req.user.id, error: error.message });
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await productService.deleteProduct(req.params.id);

      logger.info('Ürün silindi/arşivlendi', { adminId: req.user.id, productId: req.params.id });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.warn('Ürün silme hatası', { productId: req.params.id, error: error.message });
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await productService.updateProduct(req.params.id, req.body);

      logger.info('Ürün güncellendi', {
        adminId: req.user.id,
        productId: req.params.id,
        changes: Object.keys(req.body)
      });

      res.json({ success: true, message: 'Ürün güncellendi.', data: result });
    } catch (error) {
      logger.error('Ürün güncelleme hatası', { productId: req.params.id, error: error.message });
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addVariant(req, res) {
    try {
      const result = await productService.addVariant(req.params.id, req.body);

      logger.info('Ürüne varyant eklendi', {
        adminId: req.user.id,
        productId: req.params.id,
        variantName: result.name
      });

      res.status(201).json({ success: true, message: 'Varyant eklendi.', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateVariant(req, res) {
    try {
      const result = await productService.updateVariant(req.params.variantId, req.body);

      logger.info('Varyant güncellendi', {
        adminId: req.user.id,
        variantId: req.params.variantId,
        updates: req.body
      });

      res.json({ success: true, message: 'Varyant/Stok güncellendi.', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteVariant(req, res) {
    try {
      const result = await productService.deleteVariant(req.params.variantId);

      logger.info('Varyant silindi', { adminId: req.user.id, variantId: req.params.variantId });

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getLowStock(req, res) {
    try {
      const result = await productService.getLowStock();
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Kritik stok raporu hatası', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ProductController();

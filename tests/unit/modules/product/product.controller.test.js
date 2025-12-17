const mockLogger = require('../../../mocks/logger.mock');

jest.mock('../../../../src/core/logger', () => require('../../../mocks/logger.mock'));

jest.mock('../../../../src/models', () => require('../../../mocks/db.mock'));

const mockProductService = {
  getAllProducts: jest.fn(),
  getProductById: jest.fn(),
  createProduct: jest.fn(),
  deleteProduct: jest.fn(),
  updateProduct: jest.fn(),
  addVariant: jest.fn(),
  updateVariant: jest.fn(),
  deleteVariant: jest.fn(),
  getLowStock: jest.fn()
};
jest.mock('../../../../src/modules/product/product.service', () => mockProductService);

const productController = require('../../../../src/modules/product/product.controller');

describe('ProductController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('Ürün listesini başarıyla dönmeli', async () => {
      const mockResult = { totalItems: 5, data: [] };
      mockProductService.getAllProducts.mockResolvedValue(mockResult);

      await productController.getAll(req, res);

      expect(mockProductService.getAllProducts).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, ...mockResult }));
    });

    it('Hata durumunda 500 dönmeli', async () => {
      mockProductService.getAllProducts.mockRejectedValue(new Error('DB Error'));

      await productController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('Tek ürün detayını dönmeli', async () => {
      req.params.id = 1;
      mockProductService.getProductById.mockResolvedValue({ id: 1, name: 'Test' });

      await productController.getOne(req, res);

      expect(mockProductService.getProductById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, name: 'Test' } });
    });

    it('Ürün yoksa veya hata varsa 404 dönmeli', async () => {
      req.params.id = 99;
      mockProductService.getProductById.mockRejectedValue(new Error('Ürün bulunamadı'));

      await productController.getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('Yeni ürün başarıyla oluşturulmalı (201)', async () => {
      req.body = { name: 'Yeni Ürün' };
      mockProductService.createProduct.mockResolvedValue({ id: 1, name: 'Yeni Ürün' });

      await productController.create(req, res);

      expect(mockProductService.createProduct).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Hata durumunda 400 dönmeli', async () => {
      mockProductService.createProduct.mockRejectedValue(new Error('Validasyon hatası'));

      await productController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('Ürün başarıyla güncellenmeli', async () => {
      req.params.id = 1;
      req.body = { name: 'Güncel İsim' };
      mockProductService.updateProduct.mockResolvedValue({ id: 1 });

      await productController.update(req, res);

      expect(mockProductService.updateProduct).toHaveBeenCalledWith(1, req.body);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Hata durumunda 400 dönmeli', async () => {
      req.params.id = 1;
      mockProductService.updateProduct.mockRejectedValue(new Error('Hata'));

      await productController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('Ürün başarıyla silinmeli/arşivlenmeli', async () => {
      req.params.id = 1;
      mockProductService.deleteProduct.mockResolvedValue({ message: 'Silindi' });

      await productController.delete(req, res);

      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Hata durumunda 400 dönmeli', async () => {
      req.params.id = 1;
      mockProductService.deleteProduct.mockRejectedValue(new Error('Silinemedi'));

      await productController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('addVariant', () => {
    it('Varyant başarıyla eklenmeli (201)', async () => {
      req.params.id = 1;
      mockProductService.addVariant.mockResolvedValue({ id: 10, name: 'V1' });

      await productController.addVariant(req, res);

      expect(mockProductService.addVariant).toHaveBeenCalledWith(1, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Hata durumunda 400 dönmeli', async () => {
      req.params.id = 1;
      mockProductService.addVariant.mockRejectedValue(new Error('Hata'));

      await productController.addVariant(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateVariant', () => {
    it('Varyant başarıyla güncellenmeli', async () => {
      req.params.variantId = 10;
      mockProductService.updateVariant.mockResolvedValue({ id: 10 });

      await productController.updateVariant(req, res);

      expect(mockProductService.updateVariant).toHaveBeenCalledWith(10, req.body);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Hata durumunda 400 dönmeli', async () => {
      mockProductService.updateVariant.mockRejectedValue(new Error('Hata'));

      await productController.updateVariant(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteVariant', () => {
    it('Varyant başarıyla silinmeli', async () => {
      req.params.variantId = 10;
      mockProductService.deleteVariant.mockResolvedValue({ message: 'Silindi' });

      await productController.deleteVariant(req, res);

      expect(mockProductService.deleteVariant).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Hata durumunda 400 dönmeli', async () => {
      mockProductService.deleteVariant.mockRejectedValue(new Error('Hata'));

      await productController.deleteVariant(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getLowStock', () => {
    it('Kritik stok listesini dönmeli', async () => {
      mockProductService.getLowStock.mockResolvedValue([]);

      await productController.getLowStock(req, res);

      expect(mockProductService.getLowStock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('Hata durumunda 500 dönmeli', async () => {
      mockProductService.getLowStock.mockRejectedValue(new Error('Hata'));

      await productController.getLowStock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
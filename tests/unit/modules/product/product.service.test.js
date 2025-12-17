const mockLogger = require('../../../mocks/logger.mock');

jest.mock('sequelize', () => {
  const dbMock = require('../../../mocks/db.mock');
  return { Op: dbMock.Op };
});

jest.mock('../../../../src/models', () => require('../../../mocks/db.mock'));

jest.mock('../../../../src/core/logger', () => require('../../../mocks/logger.mock'));

const dbMock = require('../../../mocks/db.mock');
const productService = require('../../../../src/modules/product/product.service');

describe('ProductService Unit Tests', () => {
  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
  };

  beforeEach(() => {
    dbMock.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('filtre olmadan tüm ürünleri getirmeli', async () => {
      dbMock.Product.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: [{ id: 1, name: 'Ürün 1' }]
      });

      const result = await productService.getAllProducts({ page: 1, limit: 10 });

      expect(dbMock.Product.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          limit: 10,
          offset: 0
        })
      );
      expect(result.totalItems).toBe(10);
    });

    it('arama ve fiyat filtresi ile sorgu oluşturmalı', async () => {
      dbMock.Product.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });

      const query = {
        search: 'Telefon',
        minPrice: 1000,
        maxPrice: 5000
      };

      await productService.getAllProducts(query);

      expect(mockLogger.debug).toHaveBeenCalled();

      expect(dbMock.Product.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { [dbMock.Op.iLike]: '%Telefon%' },
            price: {
              [dbMock.Op.gte]: 1000,
              [dbMock.Op.lte]: 5000
            }
          })
        })
      );
    });
  });

  describe('getProductById', () => {
    it('ürün varsa dönmeli', async () => {
      const mockProd = { id: 1, name: 'Test' };
      dbMock.Product.findByPk.mockResolvedValue(mockProd);

      const result = await productService.getProductById(1);
      expect(result).toEqual(mockProd);
    });

    it('ürün yoksa hata fırlatmalı', async () => {
      dbMock.Product.findByPk.mockResolvedValue(null);

      await expect(productService.getProductById(99)).rejects.toThrow('Ürün bulunamadı.');

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('createProduct', () => {
    const payload = {
      name: 'Yeni Ürün',
      price: 100,
      hasStockTracking: true,
      variants: [{ name: 'V1', sku: 'SKU1', stockQuantity: 10 }]
    };

    it('başarılı işlemde commit yapmalı', async () => {
      const createdProduct = { id: 1, ...payload };
      dbMock.Product.create.mockResolvedValue(createdProduct);

      dbMock.Product.findByPk.mockResolvedValue(createdProduct);

      const result = await productService.createProduct(payload);

      expect(dbMock.sequelize.transaction).toHaveBeenCalled();
      expect(dbMock.Product.create).toHaveBeenCalled();
      expect(dbMock.ProductVariant.bulkCreate).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(createdProduct);
    });

    it('hata durumunda rollback yapmalı', async () => {
      dbMock.Product.create.mockRejectedValue(new Error('DB Hatası'));

      await expect(productService.createProduct(payload)).rejects.toThrow('DB Hatası');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('ürünü soft delete yapmalı (isActive = false)', async () => {
      const mockInstance = {
        id: 1,
        isActive: true,
        save: jest.fn().mockResolvedValue(true)
      };
      dbMock.Product.findByPk.mockResolvedValue(mockInstance);

      await productService.deleteProduct(1);

      expect(mockInstance.isActive).toBe(false);
      expect(mockInstance.save).toHaveBeenCalled();
    });

    it('ürün bulunamazsa hata fırlatmalı', async () => {
      dbMock.Product.findByPk.mockResolvedValue(null);
      await expect(productService.deleteProduct(99)).rejects.toThrow('Ürün bulunamadı');
    });
  });

  describe('updateProduct', () => {
    it('alanları güncellemeli', async () => {
      const mockInstance = {
        id: 1,
        name: 'Eski',
        save: jest.fn().mockResolvedValue(true)
      };
      dbMock.Product.findByPk.mockResolvedValue(mockInstance);

      await productService.updateProduct(1, { name: 'Yeni' });

      expect(mockInstance.name).toBe('Yeni');
      expect(mockInstance.save).toHaveBeenCalled();
    });
  });

  describe('updateStock', () => {
    it('stok miktarını güncellemeli', async () => {
      const mockVariant = {
        id: 1,
        stockQuantity: 5,
        save: jest.fn().mockResolvedValue(true)
      };
      dbMock.ProductVariant.findByPk.mockResolvedValue(mockVariant);

      await productService.updateStock(1, 20);

      expect(mockVariant.stockQuantity).toBe(20);
      expect(mockVariant.save).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('varyant yoksa hata fırlatmalı', async () => {
      dbMock.ProductVariant.findByPk.mockResolvedValue(null);
      await expect(productService.updateStock(1, 10)).rejects.toThrow('Varyant bulunamadı.');
    });
  });

  describe('Variant Operations', () => {
    it('addVariant: yeni varyant eklemeli', async () => {
      dbMock.Product.findByPk.mockResolvedValue({ id: 1 });
      dbMock.ProductVariant.create.mockResolvedValue({ id: 10, name: 'V1' });

      const res = await productService.addVariant(1, { name: 'V1' });
      expect(res.id).toBe(10);
    });

    it('addVariant: ürün yoksa hata vermeli', async () => {
      dbMock.Product.findByPk.mockResolvedValue(null);
      await expect(productService.addVariant(1, {})).rejects.toThrow('Ürün bulunamadı.');
    });

    it('updateVariant: varyantı güncellemeli', async () => {
      const mockV = { id: 1, name: 'Eski', save: jest.fn() };
      dbMock.ProductVariant.findByPk.mockResolvedValue(mockV);

      await productService.updateVariant(1, { name: 'Yeni' });
      expect(mockV.name).toBe('Yeni');
      expect(mockV.save).toHaveBeenCalled();
    });

    it('deleteVariant: varyantı silmeli (Hard Delete)', async () => {
      const mockV = { id: 1, destroy: jest.fn() };
      dbMock.ProductVariant.findByPk.mockResolvedValue(mockV);

      await productService.deleteVariant(1);
      expect(mockV.destroy).toHaveBeenCalled();
    });
  });

  describe('getLowStock', () => {
    it('kritik stoktaki ürünleri getirmeli', async () => {
      dbMock.ProductVariant.findAll.mockResolvedValue([{ id: 1, stockQuantity: 2 }]);

      const res = await productService.getLowStock();

      expect(dbMock.ProductVariant.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stockQuantity: { [dbMock.Op.lt]: 5 } }
        })
      );
      expect(mockLogger.info).toHaveBeenCalled();
      expect(res).toHaveLength(1);
    });
  });
});

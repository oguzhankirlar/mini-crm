jest.mock('../../../../src/models', () => require('../../../mocks/db.mock'));
jest.mock('../../../../src/core/logger', () => require('../../../mocks/logger.mock'));

jest.mock('../../../../src/config', () => ({
  business: {
    shippingCost: 50,
    shippingFreeLimit: 1000
  }
}));

const mockMailService = {
  sendOrderConfirmation: jest.fn().mockResolvedValue(true),
  sendNewOrderNotifyAdmin: jest.fn().mockResolvedValue(true),
  sendStatusUpdate: jest.fn().mockResolvedValue(true)
};
jest.mock('../../../../src/modules/notification/mail.service', () => mockMailService);

const dbMock = require('../../../mocks/db.mock');
const mockLogger = require('../../../mocks/logger.mock');
const orderService = require('../../../../src/modules/order/order.service');

describe('OrderService Unit Tests', () => {
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

  describe('previewCart', () => {
    it('Stok varsa sepet tutarını ve kargo ücretini hesaplamalı', async () => {
      dbMock.ProductVariant.findByPk.mockResolvedValue({
        id: 1,
        name: 'Varyant A',
        stockQuantity: 10,
        product: { name: 'Ürün A', price: 100, hasStockTracking: true }
      });

      const items = [{ variantId: 1, quantity: 2 }];
      const result = await orderService.previewCart(items);

      expect(result.subtotal).toBe(200);
      expect(result.shippingCost).toBe(50);
      expect(result.finalAmount).toBe(250);
      expect(result.items[0].stockMessage).toBe('Stokta Var');
    });

    it('Toplam tutar limiti geçerse kargo bedava olmalı', async () => {
      dbMock.ProductVariant.findByPk.mockResolvedValue({
        id: 1,
        name: 'Pahalı Ürün',
        stockQuantity: 5,
        product: { name: 'Ürün B', price: 600, hasStockTracking: true }
      });

      const items = [{ variantId: 1, quantity: 2 }];
      const result = await orderService.previewCart(items);

      expect(result.subtotal).toBe(1200);
      expect(result.shippingCost).toBe(0);
      expect(result.finalAmount).toBe(1200);
      expect(result.shippingMessage).toBe('Kargo Bedava!');
    });

    it('Varyant bulunamazsa hata fırlatmalı', async () => {
      dbMock.ProductVariant.findByPk.mockResolvedValue(null);
      const items = [{ variantId: 999, quantity: 1 }];
      await expect(orderService.previewCart(items)).rejects.toThrow('Varyant bulunamadı: ID 999');
    });
  });

  describe('createOrder', () => {
    const orderData = {
      items: [{ variantId: 1, quantity: 1 }],
      shippingInfo: { fullName: 'Test', address: 'Adres' },
      paymentMethod: 'credit_card',
      contactEmail: 'test@mail.com'
    };

    const mockUser = { id: 1, email: 'user@mail.com' };

    it('Başarılı sipariş oluşturmalı (Kayıtlı Kullanıcı)', async () => {
      const mockVariantInstance = {
        id: 1,
        stockQuantity: 10,
        product: { id: 100, price: 500, hasStockTracking: true, isActive: true },
        decrement: jest.fn().mockResolvedValue(true)
      };
      dbMock.ProductVariant.findByPk.mockResolvedValue(mockVariantInstance);

      const createdOrderMock = {
        id: 55,
        orderNumber: 'UUID-123',
        finalAmount: 550,
        contactEmail: 'user@mail.com'
      };
      dbMock.Order.create.mockResolvedValue(createdOrderMock);

      const result = await orderService.createOrder(orderData, mockUser);

      expect(dbMock.sequelize.transaction).toHaveBeenCalled();
      expect(mockVariantInstance.decrement).toHaveBeenCalled();
      expect(dbMock.Order.create).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 1 }),
        expect.anything()
      );
      expect(mockMailService.sendOrderConfirmation).toHaveBeenCalled();
      expect(result).toEqual(createdOrderMock);
    });

    it('Başarılı sipariş oluşturmalı (Misafir Kullanıcı)', async () => {
      const mockVariantInstance = {
        id: 1,
        stockQuantity: 10,
        product: { id: 100, price: 500, hasStockTracking: true, isActive: true },
        decrement: jest.fn().mockResolvedValue(true)
      };
      dbMock.ProductVariant.findByPk.mockResolvedValue(mockVariantInstance);
      dbMock.Order.create.mockResolvedValue({ id: 56 });

      await orderService.createOrder(orderData, null);

      expect(dbMock.Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: null,
          contactEmail: 'test@mail.com'
        }),
        expect.anything()
      );
    });

    it('Varyant bulunamazsa hata fırlatmalı', async () => {
      dbMock.ProductVariant.findByPk.mockResolvedValue(null);
      await expect(orderService.createOrder(orderData, mockUser)).rejects.toThrow(
        'Varyant bulunamadı'
      );
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('Yetersiz stok varsa hata fırlatmalı', async () => {
      dbMock.ProductVariant.findByPk.mockResolvedValue({
        id: 1,
        stockQuantity: 0,
        product: { price: 100, hasStockTracking: true, isActive: true }
      });

      await expect(orderService.createOrder(orderData, mockUser)).rejects.toThrow('Yetersiz Stok');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('Ürün pasif ise hata fırlatmalı', async () => {
      dbMock.ProductVariant.findByPk.mockResolvedValue({
        id: 1,
        product: { isActive: false, name: 'Pasif Ürün' }
      });

      await expect(orderService.createOrder(orderData, mockUser)).rejects.toThrow(
        'Ürün satışa kapalı'
      );
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('trackOrder', () => {
    it('UUID ile siparişi bulmalı', async () => {
      const mockOrder = { id: 1, orderNumber: 'UUID-123' };
      dbMock.Order.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.trackOrder('UUID-123');
      expect(result).toEqual(mockOrder);
      expect(dbMock.Order.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orderNumber: 'UUID-123' } })
      );
    });

    it('Sipariş bulunamazsa hata fırlatmalı', async () => {
      dbMock.Order.findOne.mockResolvedValue(null);
      await expect(orderService.trackOrder('UUID-999')).rejects.toThrow('Sipariş bulunamadı.');
    });
  });

  describe('getUserOrders', () => {
    it('Kullanıcının siparişlerini listelemeli', async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      dbMock.Order.findAll.mockResolvedValue(mockList);

      const result = await orderService.getUserOrders(1);
      expect(result).toEqual(mockList);
      expect(dbMock.Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { customerId: 1 } })
      );
    });
  });

  describe('getAllOrders', () => {
    it('Admin için tüm siparişleri sayfalı getirmeli', async () => {
      dbMock.Order.findAndCountAll.mockResolvedValue({ count: 2, rows: [] });

      const query = { page: 1, limit: 10 };
      const result = await orderService.getAllOrders(query);

      expect(result.totalItems).toBe(2);
      expect(dbMock.Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 })
      );
    });

    it('Statü filtresi varsa ona göre getirmeli', async () => {
      dbMock.Order.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
      await orderService.getAllOrders({ status: 'pending' });

      expect(dbMock.Order.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'pending' } })
      );
    });
  });

  describe('cancelOrder', () => {
    it('Sipariş kargolanmadıysa iptal etmeli ve stokları geri yüklemeli', async () => {
      const mockVariantInstance = {
        id: 1,
        product: { hasStockTracking: true },
        increment: jest.fn().mockResolvedValue(true)
      };

      const mockOrderInstance = {
        id: 10,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
        items: [{ quantity: 2, ProductVariant: mockVariantInstance }]
      };

      dbMock.Order.findOne.mockResolvedValue(mockOrderInstance);

      await orderService.cancelOrder(10, 1);

      expect(mockVariantInstance.increment).toHaveBeenCalled();
      expect(mockOrderInstance.status).toBe('cancelled');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('Sipariş kargolandıysa (shipped) hata fırlatmalı', async () => {
      const mockOrderInstance = { id: 10, status: 'shipped' };
      dbMock.Order.findOne.mockResolvedValue(mockOrderInstance);

      await expect(orderService.cancelOrder(10, 1)).rejects.toThrow(
        'Bu sipariş artık iptal edilemez'
      );
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('Sipariş bulunamazsa hata fırlatmalı', async () => {
      dbMock.Order.findOne.mockResolvedValue(null);
      await expect(orderService.cancelOrder(999, 1)).rejects.toThrow('Sipariş bulunamadı.');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('Hata oluşursa rollback yapmalı', async () => {
      dbMock.Order.findOne.mockRejectedValue(new Error('DB Error'));
      await expect(orderService.cancelOrder(10, 1)).rejects.toThrow('DB Error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('Geçerli bir statü ile güncelleme yapmalı', async () => {
      const mockOrderInstance = {
        id: 1,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };
      dbMock.Order.findByPk.mockResolvedValue(mockOrderInstance);

      await orderService.updateStatus(1, 'shipped');

      expect(mockOrderInstance.status).toBe('shipped');
      expect(mockMailService.sendStatusUpdate).toHaveBeenCalled();
    });

    it('Sipariş bulunamazsa hata fırlatmalı', async () => {
      dbMock.Order.findByPk.mockResolvedValue(null);
      await expect(orderService.updateStatus(99, 'shipped')).rejects.toThrow('Sipariş bulunamadı.');
    });

    it('Geçersiz statü gelirse hata fırlatmalı', async () => {
      const mockOrderInstance = { id: 1 };
      dbMock.Order.findByPk.mockResolvedValue(mockOrderInstance);
      await expect(orderService.updateStatus(1, 'invalid_status')).rejects.toThrow(
        'Geçersiz sipariş durumu.'
      );
    });
  });

  describe('getOrderById', () => {
    it('Sipariş bulunursa dönmeli', async () => {
      dbMock.Order.findOne.mockResolvedValue({ id: 1, customerId: 5 });
      const result = await orderService.getOrderById(1, 5);
      expect(result.id).toBe(1);
    });

    it('Yetkisiz erişimde hata fırlatmalı', async () => {
      dbMock.Order.findOne.mockResolvedValue(null);
      await expect(orderService.getOrderById(1, 99)).rejects.toThrow(
        'Sipariş bulunamadı veya erişim yetkiniz yok.'
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});

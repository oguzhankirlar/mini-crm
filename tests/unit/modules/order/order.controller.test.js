const mockLogger = require('../../../mocks/logger.mock');

jest.mock('../../../../src/core/logger', () => mockLogger);

const mockOrderService = {
  previewCart: jest.fn(),
  createOrder: jest.fn(),
  trackOrder: jest.fn(),
  getUserOrders: jest.fn(),
  getOrderById: jest.fn(),
  getAllOrders: jest.fn(),
  updateStatus: jest.fn(),
  cancelOrder: jest.fn()
};
jest.mock('../../../../src/modules/order/order.service', () => mockOrderService);

const orderController = require('../../../../src/modules/order/order.controller');

describe('OrderController Unit Tests', () => {
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

  describe('preview', () => {
    it('Sepet hesaplamasını dönmeli (200)', async () => {
      req.body.items = [{ variantId: 1, quantity: 1 }];
      mockOrderService.previewCart.mockResolvedValue({ total: 100 });

      await orderController.preview(req, res);

      expect(mockOrderService.previewCart).toHaveBeenCalledWith(req.body.items);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 100 } });
    });

    it('Hata durumunda 400 dönmeli', async () => {
      mockOrderService.previewCart.mockRejectedValue(new Error('Stok yok'));

      await orderController.preview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('Sipariş detayını dönmeli (200)', async () => {
      req.params.id = 1;
      const mockOrder = { id: 1, total: 500 };
      mockOrderService.getOrderById.mockResolvedValue(mockOrder);

      await orderController.getOne(req, res);

      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(1, 1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockOrder });
    });

    it('Bulunamazsa veya hata olursa 404 dönmeli', async () => {
      req.params.id = 99;
      mockOrderService.getOrderById.mockRejectedValue(new Error('Bulunamadı'));

      await orderController.getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getAllAdmin', () => {
    it('Admin için tüm siparişleri getirmeli (200)', async () => {
      mockOrderService.getAllOrders.mockResolvedValue({ total: 10, data: [] });

      await orderController.getAllAdmin(req, res);

      expect(mockOrderService.getAllOrders).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('Hata durumunda 500 dönmeli', async () => {
      mockOrderService.getAllOrders.mockRejectedValue(new Error('DB Error'));

      await orderController.getAllAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('Statü güncellenmeli (200)', async () => {
      req.params.id = 1;
      req.body.status = 'shipped';
      mockOrderService.updateStatus.mockResolvedValue({ id: 1, status: 'shipped' });

      await orderController.updateStatus(req, res);

      expect(mockOrderService.updateStatus).toHaveBeenCalledWith(1, 'shipped');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Hata durumunda 400 dönmeli', async () => {
      req.params.id = 1;
      mockOrderService.updateStatus.mockRejectedValue(new Error('Geçersiz durum'));

      await orderController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('Sipariş başarıyla oluşturulmalı (Tokenlı) (201)', async () => {
      const mockOrder = { orderNumber: '123', finalAmount: 500 };
      mockOrderService.createOrder.mockResolvedValue(mockOrder);

      await orderController.create(req, res);

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(req.body, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogger.info).toHaveBeenCalledWith('Yeni sipariş alındı', expect.any(Object));
    });

    it('Sipariş başarıyla oluşturulmalı (Misafir) (201)', async () => {
      req.user = undefined;
      const mockOrder = { orderNumber: '999', finalAmount: 100 };
      mockOrderService.createOrder.mockResolvedValue(mockOrder);

      await orderController.create(req, res);

      expect(mockOrderService.createOrder).toHaveBeenCalledWith(req.body, undefined);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Hata durumunda 400 dönmeli', async () => {
      mockOrderService.createOrder.mockRejectedValue(new Error('Ödeme hatası'));

      await orderController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('track', () => {
    it('UUID ile sipariş bulunursa dönmeli (200)', async () => {
      req.params.uuid = 'uuid-123';
      mockOrderService.trackOrder.mockResolvedValue({ id: 1 });

      await orderController.track(req, res);

      expect(mockOrderService.trackOrder).toHaveBeenCalledWith('uuid-123');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });

    it('Bulunamazsa 404 dönmeli', async () => {
      mockOrderService.trackOrder.mockRejectedValue(new Error('Sipariş yok'));

      await orderController.track(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('myOrders', () => {
    it('Kullanıcının siparişlerini getirmeli (200)', async () => {
      mockOrderService.getUserOrders.mockResolvedValue([]);

      await orderController.myOrders(req, res);

      expect(mockOrderService.getUserOrders).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('Hata durumunda 400 dönmeli', async () => {
      mockOrderService.getUserOrders.mockRejectedValue(new Error('DB Hatası'));

      await orderController.myOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('cancel', () => {
    it('Sipariş iptal edilmeli (200)', async () => {
      req.params.id = 1;
      mockOrderService.cancelOrder.mockResolvedValue({ id: 1, status: 'cancelled' });

      await orderController.cancel(req, res);

      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(1, 1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('Hata durumunda 400 dönmeli', async () => {
      req.params.id = 1;
      mockOrderService.cancelOrder.mockRejectedValue(new Error('İptal edilemez'));

      await orderController.cancel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
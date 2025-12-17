const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../../src/app');
const config = require('../../../../src/config');
const orderService = require('../../../../src/modules/order/order.service');

jest.mock('../../../../src/modules/order/order.service');

describe('Order Routes Integration Tests', () => {
  let customerToken;
  let adminToken;
  const apiPrefix = config.app.apiPrefix;

  beforeAll(() => {
    customerToken = jwt.sign(
      { id: 1, role: 'customer', email: 'c@test.com' },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );
    adminToken = jwt.sign({ id: 99, role: 'admin', email: 'a@test.com' }, config.auth.jwtSecret, {
      expiresIn: '1h'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe(`POST ${apiPrefix}/cart/preview`, () => {
    it('Herkes sepet hesaplatabilmeli', async () => {
      orderService.previewCart.mockResolvedValue({ total: 100 });

      const res = await request(app).post(`${apiPrefix}/cart/preview`).send({ items: [] });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe(`POST ${apiPrefix}/orders`, () => {
    it('Token OLMADAN (Misafir) sipariş verilebilmeli', async () => {
      orderService.createOrder.mockResolvedValue({ orderNumber: 'GUEST-1' });

      const res = await request(app).post(`${apiPrefix}/orders`).send({ items: [] });

      expect(res.statusCode).toBe(201);
      expect(orderService.createOrder).toHaveBeenCalledWith(expect.anything(), undefined);
    });

    it('Token İLE (Üye) sipariş verilebilmeli', async () => {
      orderService.createOrder.mockResolvedValue({ orderNumber: 'USER-1' });

      const res = await request(app)
        .post(`${apiPrefix}/orders`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [] });

      expect(res.statusCode).toBe(201);
      expect(orderService.createOrder).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 1 })
      );
    });
  });

  describe(`GET ${apiPrefix}/orders/my-orders`, () => {
    it('Giriş yapmış kullanıcı siparişlerini görebilmeli', async () => {
      orderService.getUserOrders.mockResolvedValue([]);

      const res = await request(app)
        .get(`${apiPrefix}/orders/my-orders`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('Token yoksa 401 dönmeli', async () => {
      const res = await request(app).get(`${apiPrefix}/orders/my-orders`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe(`GET ${apiPrefix}/orders/track/:uuid`, () => {
    it('UUID ile herkes sorgulama yapabilmeli', async () => {
      orderService.trackOrder.mockResolvedValue({ id: 1 });

      const res = await request(app).get(`${apiPrefix}/orders/track/uuid-123`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Admin Endpoints', () => {
    it('GET /admin/orders - Admin erişebilmeli', async () => {
      orderService.getAllOrders.mockResolvedValue({ data: [] });

      const res = await request(app)
        .get(`${apiPrefix}/admin/orders`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('GET /admin/orders - Müşteri erişememeli (403)', async () => {
      const res = await request(app)
        .get(`${apiPrefix}/admin/orders`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('PATCH /admin/orders/:id/status - Admin durum güncelleyebilmeli', async () => {
      orderService.updateStatus.mockResolvedValue({ status: 'shipped' });

      const res = await request(app)
        .patch(`${apiPrefix}/admin/orders/1/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped' });

      expect(res.statusCode).toBe(200);
    });
  });
});

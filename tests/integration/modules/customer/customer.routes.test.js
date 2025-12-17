const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../../src/app');
const config = require('../../../../src/config');
const customerService = require('../../../../src/modules/customer/customer.service');

jest.mock('../../../../src/modules/customer/customer.service');

describe('Customer Routes Integration Tests', () => {
  let customerToken;
  let adminToken;
  const apiPrefix = config.app.apiPrefix;

  beforeAll(() => {
    customerToken = jwt.sign(
      { id: 1, role: 'customer', email: 'customer@test.com' },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: 99, role: 'admin', email: 'admin@test.com' },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe(`GET ${apiPrefix}/customers/profile`, () => {
    it('Token varsa profil dönmeli (200)', async () => {
      customerService.getProfile.mockResolvedValue({ id: 1, firstName: 'Test' });

      const res = await request(app)
        .get(`${apiPrefix}/customers/profile`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Token yoksa 401 dönmeli', async () => {
      const res = await request(app).get(`${apiPrefix}/customers/profile`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe(`PUT ${apiPrefix}/customers/profile`, () => {
    it('Geçerli veriyle güncelleme başarılı olmalı (200)', async () => {
      customerService.updateProfile.mockResolvedValue({ id: 1, firstName: 'Updated' });

      const res = await request(app)
        .put(`${apiPrefix}/customers/profile`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ firstName: 'Updated' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe(`GET ${apiPrefix}/admin/customers`, () => {
    it('Admin tokenı ile erişim başarılı olmalı (200)', async () => {
      customerService.getAllCustomers.mockResolvedValue({ totalItems: 0, data: [] });

      const res = await request(app)
        .get(`${apiPrefix}/admin/customers`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('Normal müşteri tokenı ile erişim reddedilmeli (403)', async () => {
      const res = await request(app)
        .get(`${apiPrefix}/admin/customers`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe(`POST ${apiPrefix}/admin/customers/import`, () => {
    it('Admin Excel dosyası yükleyebilmeli (200)', async () => {
      customerService.importCustomers.mockResolvedValue({ successCount: 1, errorCount: 0 });

      const buffer = Buffer.from('fake excel content');

      const res = await request(app)
        .post(`${apiPrefix}/admin/customers/import`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', buffer, 'test.xlsx');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(customerService.importCustomers).toHaveBeenCalled();
    });

    it('Müşteri dosya yüklemeye çalışırsa 403 almalı', async () => {
      const buffer = Buffer.from('fake content');

      const res = await request(app)
        .post(`${apiPrefix}/admin/customers/import`)
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('file', buffer, 'test.xlsx');

      expect(res.statusCode).toBe(403);
    });

    it('Dosya gönderilmezse 400 dönmeli (Controller kontrolü)', async () => {
      const res = await request(app)
        .post(`${apiPrefix}/admin/customers/import`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Excel dosyası/);
    });
  });
});

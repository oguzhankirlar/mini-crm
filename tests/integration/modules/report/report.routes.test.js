const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../../src/app');
const config = require('../../../../src/config');
const reportService = require('../../../../src/modules/report/report.service');

jest.mock('../../../../src/modules/report/report.service');

describe('Report Routes Integration Tests', () => {
  let adminToken;
  let customerToken;
  const apiPrefix = config.app.apiPrefix;

  beforeAll(() => {
    adminToken = jwt.sign(
      { id: 1, role: 'admin', email: 'admin@test.com' },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );

    customerToken = jwt.sign(
      { id: 2, role: 'customer', email: 'cust@test.com' },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe(`GET ${apiPrefix}/admin/reports/dashboard`, () => {
    it('Admin erişebilmeli (200)', async () => {
      reportService.getDashboardStats.mockResolvedValue({ revenue: 100 });

      const res = await request(app)
        .get(`${apiPrefix}/admin/reports/dashboard`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Müşteri erişememeli (403)', async () => {
      const res = await request(app)
        .get(`${apiPrefix}/admin/reports/dashboard`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('Token yoksa erişememeli (401)', async () => {
      const res = await request(app).get(`${apiPrefix}/admin/reports/dashboard`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe(`GET ${apiPrefix}/admin/reports/daily-sales`, () => {
    it('Admin erişebilmeli (200)', async () => {
      reportService.getDailySales.mockResolvedValue([]);

      const res = await request(app)
        .get(`${apiPrefix}/admin/reports/daily-sales`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe(`GET ${apiPrefix}/admin/reports/best-sellers`, () => {
    it('Admin erişebilmeli (200)', async () => {
      reportService.getBestSellers.mockResolvedValue([]);

      const res = await request(app)
        .get(`${apiPrefix}/admin/reports/best-sellers`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });
  });
});

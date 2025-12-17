const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../../src/app');
const authService = require('../../../../src/modules/auth/auth.service');
const config = require('../../../../src/config');

jest.mock('../../../../src/modules/auth/auth.service');

const prefix = config.app.apiPrefix;

describe('Auth Routes Integration Tests', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = jwt.sign(
      { id: 99, role: 'admin', email: 'admin@test.com' },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe(`POST ${prefix}/auth/register`, () => {
    it('Geçerli veri ile kayıt başarılı olmalı (201)', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const res = await request(app).post(`${prefix}/auth/register`).send({
        email: 'test@test.com',
        password: '123',
        firstName: 'Test'
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@test.com');
    });

    it('Servis hata verirse 400 dönmeli', async () => {
      authService.register.mockRejectedValue(new Error('Email mevcut'));

      const res = await request(app)
        .post(`${prefix}/auth/register`)
        .send({ email: 'varolan@test.com', password: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email mevcut');
    });
  });

  describe(`POST ${prefix}/auth/login`, () => {
    it('Doğru bilgilerle giriş yapılmalı (200)', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'fake_access',
        refreshToken: 'fake_refresh',
        user: { id: 1 }
      });

      const res = await request(app)
        .post(`${prefix}/auth/login`)
        .send({ email: 'a@b.com', password: '123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBe('fake_access');
    });
  });

  describe(`GET ${prefix}/auth/health`, () => {
    it('Admin token ile sistem sağlık durumu görülebilmeli (200)', async () => {
      const res = await request(app)
        .get(`${prefix}/auth/health`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 503]).toContain(res.statusCode);
    });

    it('Token olmadan erişim reddedilmeli (401)', async () => {
      const res = await request(app).get(`${prefix}/auth/health`);
      expect(res.statusCode).toBe(401);
    });
  });
});

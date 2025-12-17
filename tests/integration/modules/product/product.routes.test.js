const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../../src/app');
const config = require('../../../../src/config');
const productService = require('../../../../src/modules/product/product.service');

jest.mock('../../../../src/modules/product/product.service');

describe('Product Routes Integration Tests', () => {
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

  describe('Public Endpoints', () => {
    it('GET /products - Herkes erişebilmeli (200)', async () => {
      productService.getAllProducts.mockResolvedValue({ totalItems: 0, data: [] });

      const res = await request(app).get(`${apiPrefix}/products`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /products/:id - Herkes detay görebilmeli (200)', async () => {
      productService.getProductById.mockResolvedValue({ id: 1, name: 'Test' });

      const res = await request(app).get(`${apiPrefix}/products/1`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(1);
    });
  });

  describe('Admin Endpoints', () => {
    it('POST /admin/products - Admin ürün ekleyebilmeli (201)', async () => {
      productService.createProduct.mockResolvedValue({ id: 1, name: 'Yeni' });

      const res = await request(app)
        .post(`${apiPrefix}/admin/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Yeni', price: 100 });

      expect(res.statusCode).toBe(201);
    });

    it('POST /admin/products - Müşteri ekleyememeli (403)', async () => {
      const res = await request(app)
        .post(`${apiPrefix}/admin/products`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Yeni' });

      expect(res.statusCode).toBe(403);
    });

    it('GET /admin/products/low-stock - Sadece admin görebilmeli', async () => {
      productService.getLowStock.mockResolvedValue([]);

      const res = await request(app)
        .get(`${apiPrefix}/admin/products/low-stock`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('POST /admin/products/:id/variants - Varyant ekleme (201)', async () => {
      productService.addVariant.mockResolvedValue({ id: 10 });

      const res = await request(app)
        .post(`${apiPrefix}/admin/products/1/variants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'V1', stockQuantity: 5 });

      expect(res.statusCode).toBe(201);
    });

    it('DELETE /admin/products/:id - Ürün silme (200)', async () => {
      productService.deleteProduct.mockResolvedValue({ message: 'Silindi' });

      const res = await request(app)
        .delete(`${apiPrefix}/admin/products/1`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });
  });
});

const mockLogger = require('../../../mocks/logger.mock');
const dbMock = require('../../../mocks/db.mock');

jest.mock('../../../../src/core/logger', () => require('../../../mocks/logger.mock'));
jest.mock('../../../../src/models', () => require('../../../mocks/db.mock'));

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn()
};
jest.mock('../../../../src/modules/auth/auth.service', () => mockAuthService);

const authController = require('../../../../src/modules/auth/auth.controller');

describe('AuthController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('Başarılı kayıtta 201 ve kullanıcı verisi dönmeli', async () => {
      req.body = { email: 'test@test.com' };
      const mockUser = { id: 1, email: 'test@test.com' };

      mockAuthService.register.mockResolvedValue(mockUser);

      await authController.register(req, res);

      expect(mockAuthService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Kayıt başarılı.',
        data: mockUser
      });
    });

    it('Servis hata verirse 400 dönmeli', async () => {
      const errorMessage = 'Email kullanımda';
      mockAuthService.register.mockRejectedValue(new Error(errorMessage));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('Başarılı girişte 200 ve tokenları dönmeli', async () => {
      req.body = { email: 'a@b.com', password: '123' };
      const mockResult = { accessToken: 'token', refreshToken: 'ref', user: {} };

      mockAuthService.login.mockResolvedValue(mockResult);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          accessToken: 'token'
        })
      );
    });

    it('Hatalı girişte 401 dönmeli', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Şifre yanlış'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Şifre yanlış' });
    });
  });

  describe('refreshToken', () => {
    it('Token yoksa 403 dönmeli (Servise gitmeden)', async () => {
      req.body = {};

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('Başarılı yenilemede 200 dönmeli', async () => {
      req.body = { refreshToken: 'valid_token' };
      mockAuthService.refreshToken.mockResolvedValue({ accessToken: 'new_token' });

      await authController.refreshToken(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, accessToken: 'new_token' });
    });
  });

  describe('healthCheck', () => {
    it('DB bağlantısı varsa 200 dönmeli', async () => {
      dbMock.sequelize.authenticate.mockResolvedValue();

      await authController.healthCheck(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'OK' }));
    });

    it('DB bağlantısı yoksa 503 dönmeli', async () => {
      dbMock.sequelize.authenticate.mockRejectedValue(new Error('Connection failed'));

      await authController.healthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ERROR' }));
    });
  });
});

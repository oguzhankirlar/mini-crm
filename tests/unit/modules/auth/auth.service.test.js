jest.mock('../../../../src/models', () => require('../../../mocks/db.mock'));
jest.mock('../../../../src/core/logger', () => require('../../../mocks/logger.mock'));

jest.mock('../../../../src/config', () => ({
  auth: {
    jwtSecret: 'test_secret',
    jwtExpire: '1h'
  }
}));

const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn()
};
jest.mock('bcryptjs', () => mockBcrypt);

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn()
};
jest.mock('jsonwebtoken', () => mockJwt);

const dbMock = require('../../../mocks/db.mock');
const mockLogger = require('../../../mocks/logger.mock');

const authService = require('../../../../src/modules/auth/auth.service');

describe('AuthService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const payload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@mail.com',
      password: 'password123',
      phone: '123456'
    };

    it('başarılı bir şekilde yeni kullanıcı oluşturmalı', async () => {
      dbMock.Customer.findOne.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed_password');

      const createdUser = { ...payload, id: 1, toJSON: () => ({ ...payload, id: 1 }) };
      dbMock.Customer.create.mockResolvedValue(createdUser);

      const result = await authService.register(payload);

      expect(dbMock.Customer.findOne).toHaveBeenCalledWith({ where: { email: payload.email } });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(payload.password, 10);
      expect(dbMock.Customer.create).toHaveBeenCalled();
      expect(result).toHaveProperty('email', payload.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('e-posta zaten varsa hata fırlatmalı', async () => {
      dbMock.Customer.findOne.mockResolvedValue({ id: 99, email: 'test@mail.com' });

      await expect(authService.register(payload)).rejects.toThrow(
        'Bu e-posta adresi zaten kullanımda.'
      );

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(dbMock.Customer.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const email = 'test@mail.com';
    const password = 'password123';

    const mockUser = {
      id: 1,
      email,
      passwordHash: 'hashed_password',
      role: 'customer',
      firstName: 'Test'
    };

    it('başarılı giriş yapmalı ve token dönmeli', async () => {
      dbMock.Customer.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock_token');

      const result = await authService.login(email, password);

      expect(result).toHaveProperty('accessToken', 'mock_token');
      expect(result).toHaveProperty('refreshToken', 'mock_token');
      expect(result.user.email).toBe(email);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('kullanıcı bulunamazsa hata fırlatmalı', async () => {
      dbMock.Customer.findOne.mockResolvedValue(null);

      await expect(authService.login(email, password)).rejects.toThrow(
        'E-posta veya şifre hatalı.'
      );

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('şifre yanlışsa hata fırlatmalı', async () => {
      dbMock.Customer.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(authService.login(email, password)).rejects.toThrow(
        'E-posta veya şifre hatalı.'
      );
    });

    it('kullanıcının şifresi (passwordHash) yoksa hata fırlatmalı (Legacy User)', async () => {
      dbMock.Customer.findOne.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(authService.login(email, password)).rejects.toThrow(
        'Lütfen şifrenizi sıfırlayın.'
      );
    });
  });

  describe('refreshToken', () => {
    const token = 'valid_refresh_token';

    it('token geçerliyse yeni access token dönmeli', async () => {
      mockJwt.verify.mockReturnValue({ id: 1 });
      dbMock.Customer.findByPk.mockResolvedValue({
        id: 1,
        email: 'test@mail.com',
        role: 'customer'
      });
      mockJwt.sign.mockReturnValue('new_access_token');

      const result = await authService.refreshToken(token);

      expect(result).toHaveProperty('accessToken', 'new_access_token');
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('token geçersizse hata fırlatmalı', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid_token')).rejects.toThrow(
        'Geçersiz veya süresi dolmuş Refresh Token.'
      );

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('token geçerli ama kullanıcı silinmişse hata fırlatmalı', async () => {
      mockJwt.verify.mockReturnValue({ id: 99 });
      dbMock.Customer.findByPk.mockResolvedValue(null);

      await expect(authService.refreshToken(token)).rejects.toThrow(
        'Geçersiz veya süresi dolmuş Refresh Token.'
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

const mockLogger = require('../../../mocks/logger.mock');

jest.mock('../../../../src/core/logger', () => mockLogger);

const mockCustomerService = {
  getAllCustomers: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  importCustomers: jest.fn()
};
jest.mock('../../../../src/modules/customer/customer.service', () => mockCustomerService);

const customerController = require('../../../../src/modules/customer/customer.controller');

describe('CustomerController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      user: { id: 1 },
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('Müşteri listesini başarılı şekilde dönmeli', async () => {
      mockCustomerService.getAllCustomers.mockResolvedValue({
        totalItems: 10,
        data: []
      });

      await customerController.getAll(req, res);

      expect(mockCustomerService.getAllCustomers).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, totalItems: 10 })
      );
    });

    it('Servis hata verirse 500 dönmeli', async () => {
      mockCustomerService.getAllCustomers.mockRejectedValue(new Error('DB Hatası'));

      await customerController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('Profil bilgilerini dönmeli', async () => {
      mockCustomerService.getProfile.mockResolvedValue({ id: 1, email: 'test@test.com' });

      await customerController.getProfile(req, res);

      expect(mockCustomerService.getProfile).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, email: 'test@test.com' }
      });
    });

    it('Kullanıcı bulunamazsa 404 dönmeli', async () => {
      mockCustomerService.getProfile.mockRejectedValue(new Error('Kullanıcı yok'));

      await customerController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('Profili güncellemeli', async () => {
      req.body = { firstName: 'Yeni' };
      mockCustomerService.updateProfile.mockResolvedValue({ id: 1, firstName: 'Yeni' });

      await customerController.updateProfile(req, res);

      expect(mockCustomerService.updateProfile).toHaveBeenCalledWith(1, req.body);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profil güncellendi.'
        })
      );
    });

    it('Hata durumunda 400 dönmeli', async () => {
      mockCustomerService.updateProfile.mockRejectedValue(new Error('Validasyon hatası'));

      await customerController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('importExcel', () => {
    it('Dosya varsa import işlemini başlatmalı', async () => {
      req.file = {
        originalname: 'users.xlsx',
        path: 'uploads/users.xlsx',
        size: 1024
      };

      const mockReport = { successCount: 5, errorCount: 0 };
      mockCustomerService.importCustomers.mockResolvedValue(mockReport);

      await customerController.importExcel(req, res);

      expect(mockCustomerService.importCustomers).toHaveBeenCalledWith('uploads/users.xlsx');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          report: mockReport
        })
      );
    });

    it('Dosya yüklenmemişse (req.file yoksa) 400 dönmeli', async () => {
      req.file = null;

      await customerController.importExcel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Lütfen bir Excel dosyası yükleyin')
        })
      );
      expect(mockCustomerService.importCustomers).not.toHaveBeenCalled();
    });

    it('Servis hata verirse 400 dönmeli', async () => {
      req.file = { path: 'path' };
      mockCustomerService.importCustomers.mockRejectedValue(new Error('Dosya bozuk'));

      await customerController.importExcel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

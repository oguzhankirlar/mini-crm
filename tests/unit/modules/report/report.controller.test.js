const mockLogger = require('../../../mocks/logger.mock');

jest.mock('../../../../src/core/logger', () => mockLogger);

const mockReportService = {
  getDashboardStats: jest.fn(),
  getBestSellers: jest.fn(),
  getDailySales: jest.fn()
};
jest.mock('../../../../src/modules/report/report.service', () => mockReportService);

const reportController = require('../../../../src/modules/report/report.controller');

describe('ReportController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('Dashboard verilerini başarıyla dönmeli', async () => {
      const mockStats = { revenue: 1000, orders: 5 };
      mockReportService.getDashboardStats.mockResolvedValue(mockStats);

      await reportController.getDashboard(req, res);

      expect(mockReportService.getDashboardStats).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockStats });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Servis hata verirse 500 dönmeli', async () => {
      mockReportService.getDashboardStats.mockRejectedValue(new Error('DB Error'));

      await reportController.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getBestSellers', () => {
    it('En çok satanları dönmeli', async () => {
      const mockList = [{ id: 1, name: 'Ürün A' }];
      mockReportService.getBestSellers.mockResolvedValue(mockList);

      await reportController.getBestSellers(req, res);

      expect(mockReportService.getBestSellers).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockList });
    });

    it('Hata durumunda 500 dönmeli', async () => {
      mockReportService.getBestSellers.mockRejectedValue(new Error('DB Error'));

      await reportController.getBestSellers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDailySales', () => {
    it('Günlük satış verilerini dönmeli', async () => {
      const mockSales = [{ date: '2025-01-01', total: 500 }];
      mockReportService.getDailySales.mockResolvedValue(mockSales);

      await reportController.getDailySales(req, res);

      expect(mockReportService.getDailySales).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockSales });
    });

    it('Hata durumunda 500 dönmeli', async () => {
      mockReportService.getDailySales.mockRejectedValue(new Error('DB Error'));

      await reportController.getDailySales(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

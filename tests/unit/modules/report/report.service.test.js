const mockLogger = require('../../../mocks/logger.mock');
const dbMock = require('../../../mocks/db.mock');

jest.mock('sequelize', () => {
  const dbMock = require('../../../mocks/db.mock');
  return { Op: dbMock.Op };
});

jest.mock('../../../../src/models', () => require('../../../mocks/db.mock'));

jest.mock('../../../../src/core/logger', () => require('../../../mocks/logger.mock'));

const reportService = require('../../../../src/modules/report/report.service');

describe('ReportService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('İstatistikleri doğru şekilde hesaplayıp dönmeli', async () => {
      dbMock.Order.sum.mockResolvedValue(50000);
      dbMock.Order.count.mockResolvedValue(5);
      dbMock.Customer.count.mockResolvedValue(100);

      const result = await reportService.getDashboardStats();

      expect(dbMock.Order.sum).toHaveBeenCalledWith(
        'finalAmount',
        expect.objectContaining({
          where: { status: { [dbMock.Op.not]: 'cancelled' } }
        })
      );

      expect(dbMock.Order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' }
        })
      );

      expect(result).toEqual({
        totalRevenue: 50000,
        pendingOrders: 5,
        totalMembers: 100
      });
    });

    it('Eğer ciro null dönerse (hiç sipariş yoksa) 0 dönmeli', async () => {
      dbMock.Order.sum.mockResolvedValue(null);
      dbMock.Order.count.mockResolvedValue(0);
      dbMock.Customer.count.mockResolvedValue(0);

      const result = await reportService.getDashboardStats();

      expect(result.totalRevenue).toBe(0);
    });

    it('Veritabanı hatasında log atıp hata fırlatmalı', async () => {
      dbMock.Order.sum.mockRejectedValue(new Error('DB Bağlantı Hatası'));

      await expect(reportService.getDashboardStats()).rejects.toThrow('DB Bağlantı Hatası');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getBestSellers', () => {
    it('En çok satan ürünleri getirmeli', async () => {
      const mockData = [
        { productId: 1, dataValues: { totalSold: 50 }, Product: { name: 'Ürün A' } }
      ];
      dbMock.OrderItem.findAll.mockResolvedValue(mockData);

      const result = await reportService.getBestSellers();

      expect(dbMock.OrderItem.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          group: expect.any(Array),
          order: expect.any(Array)
        })
      );

      expect(dbMock.sequelize.fn).toHaveBeenCalledWith('SUM', expect.anything());
      expect(dbMock.sequelize.literal).toHaveBeenCalledWith('"totalSold"');

      expect(result).toEqual(mockData);
    });

    it('Hata durumunda loglamalı', async () => {
      dbMock.OrderItem.findAll.mockRejectedValue(new Error('Query Failed'));

      await expect(reportService.getBestSellers()).rejects.toThrow('Query Failed');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getDailySales', () => {
    it('Günlük satış verilerini getirmeli', async () => {
      const mockSalesData = [
        { date: '2025-12-10', totalRevenue: 1000 },
        { date: '2025-12-11', totalRevenue: 2500 }
      ];
      dbMock.Order.findAll.mockResolvedValue(mockSalesData);

      const result = await reportService.getDailySales();

      expect(dbMock.Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: { [dbMock.Op.gte]: expect.anything() }
          })
        })
      );

      expect(mockLogger.debug).toHaveBeenCalled();
      expect(result).toEqual(mockSalesData);
    });

    it('Veritabanı hatasında işlemi durdurmalı', async () => {
      dbMock.Order.findAll.mockRejectedValue(new Error('DB Error'));

      await expect(reportService.getDailySales()).rejects.toThrow('DB Error');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

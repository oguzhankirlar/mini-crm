const reportService = require('./report.service');
const logger = require('../../core/logger');

class ReportController {
  async getDashboard(req, res) {
    try {
      logger.info('Dashboard raporu görüntülendi', { adminId: req.user.id });

      const stats = await reportService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Dashboard raporu hatası', { adminId: req.user.id, error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBestSellers(req, res) {
    try {
      logger.info('En çok satanlar raporu görüntülendi', { adminId: req.user.id });

      const bestSellers = await reportService.getBestSellers();
      res.json({ success: true, data: bestSellers });
    } catch (error) {
      logger.error('Best Sellers raporu hatası', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDailySales(req, res) {
    try {
      logger.info('Günlük satış raporu görüntülendi', { adminId: req.user.id });

      const sales = await reportService.getDailySales();
      res.json({ success: true, data: sales });
    } catch (error) {
      logger.error('Günlük satış raporu hatası', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ReportController();

const customerService = require('./customer.service');
const logger = require('../../core/logger');

class CustomerController {
  async getAll(req, res) {
    try {
      const result = await customerService.getAllCustomers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Müşteri listesi çekilemedi', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      logger.info('Müşteri profil görüntüledi', { userId: req.user.id });

      const profile = await customerService.getProfile(req.user.id);
      res.json({ success: true, data: profile });
    } catch (error) {
      logger.warn('Profil görüntüleme başarısız', { userId: req.user.id, error: error.message });
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const updatedUser = await customerService.updateProfile(req.user.id, req.body);

      logger.info('Müşteri profilini güncelledi', {
        userId: req.user.id,
        changes: Object.keys(req.body)
      });

      res.json({ success: true, message: 'Profil güncellendi.', data: updatedUser });
    } catch (error) {
      logger.warn('Profil güncelleme hatası', { userId: req.user.id, error: error.message });
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async importExcel(req, res) {
    try {
      if (!req.file) {
        logger.warn('Excel import denemesi: Dosya yok', { userId: req.user.id });
        throw new Error('Lütfen bir Excel dosyası yükleyin.');
      }

      logger.info('Excel import işlemi başlatıldı', {
        adminId: req.user.id,
        fileName: req.file.originalname,
        size: req.file.size
      });

      const report = await customerService.importCustomers(req.file.path);

      logger.info('Excel import tamamlandı', {
        successCount: report.successCount,
        errorCount: report.errorCount
      });

      res.json({
        success: true,
        message: 'İçe aktarım tamamlandı.',
        report: report
      });
    } catch (error) {
      logger.error('Excel import işlemi kritik hata', { error: error.message });
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CustomerController();

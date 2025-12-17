const authService = require('./auth.service');
const { sequelize } = require('../../models');
const logger = require('../../core/logger');

class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);

      logger.info('Kayıt işlemi tamamlandı', { userId: user.id, email: user.email });

      res.status(201).json({ success: true, message: 'Kayıt başarılı.', data: user });
    } catch (error) {
      logger.warn('Kayıt başarısız', { email: req.body.email, error: error.message });

      res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Giriş başarılı.',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      });
    } catch (error) {
      logger.warn('Giriş başarısız', { email: req.body.email, reason: error.message });

      res.status(401).json({ success: false, message: error.message });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new Error('Refresh Token gereklidir.');

      const result = await authService.refreshToken(refreshToken);

      res.json({ success: true, accessToken: result.accessToken });
    } catch (error) {
      logger.warn('Token yenileme başarısız', { error: error.message });

      res.status(403).json({ success: false, message: error.message });
    }
  }

  async healthCheck(req, res) {
    try {
      await sequelize.authenticate();

      logger.info('Health Check: Sistem Sağlıklı');

      res.json({
        status: 'OK',
        message: 'Sistem ve Veritabanı sağlıklı çalışıyor.',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Health Check: Veritabanı Bağlantı Hatası!', { error: error.message });

      res.status(503).json({ status: 'ERROR', message: 'Veritabanı bağlantı hatası.' });
    }
  }
}

module.exports = new AuthController();

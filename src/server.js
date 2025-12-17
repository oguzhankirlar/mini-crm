const app = require('./app');
const db = require('./models');
const config = require('./config');
const logger = require('./core/logger');

async function startServer() {
  try {
    await db.sequelize.authenticate();
    logger.info('Veritabanı bağlantısı başarılı.');

    await db.sequelize.sync({ alter: true });
    logger.info('Tablolar otomatik senkronize edildi (Sync).');

    app.listen(config.app.port, () => {
      logger.info(`Server listening on port: ${config.app.port}`);
    });
  } catch (err) {
    logger.error('Sunucu başlatılamadı:', err);
  }
}

startServer();

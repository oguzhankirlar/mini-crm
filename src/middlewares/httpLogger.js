const { v4: uuidv4 } = require('uuid');
const context = require('../core/context');
const logger = require('../core/logger');

const httpLogger = (req, res, next) => {
  const traceId = uuidv4();

  res.setHeader('X-Trace-ID', traceId);

  const store = new Map();
  store.set('traceId', traceId);

  context.run(store, () => {
    logger.debug(`İstek Başladı: ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.on('finish', () => {
      if (res.statusCode >= 500) {
        logger.error(`İstek Hata İle Bitti`, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode
        });
      } else if (res.statusCode >= 400) {
        logger.warn(`İstek Uyarı İle Bitti`, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode
        });
      } else {
        logger.info(`İstek Başarılı`, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode
        });
      }
    });

    next();
  });
};

module.exports = httpLogger;

const winston = require('winston');
const config = require('../config');
const context = require('./context');

const addTraceId = winston.format((info) => {
  const store = context.getStore();
  const traceId = store ? store.get('traceId') : 'system-boot';

  info.traceId = traceId;
  return info;
});

const logger = winston.createLogger({
  level: config.app.logLevel || 'info',
  format: winston.format.combine(
    addTraceId(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mini-crm-api' },
  transports: [
    new winston.transports.Console({
      format:
        config.app.env === 'development'
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, traceId, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `[${timestamp}] [${level}] [${traceId}] ${message} ${metaStr}`;
              })
            )
          : winston.format.json()
    })
  ]
});

module.exports = logger;

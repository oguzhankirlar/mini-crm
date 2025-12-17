const dotenv = require('dotenv');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
let envFile = '.env.development';

if (env === 'production') {
  envFile = '.env.production';
} else if (env === 'test' || env === 'staging') {
  envFile = '.env.test';
}

const envFound = dotenv.config({ path: path.resolve(process.cwd(), envFile) });

if (envFound.error && env === 'development') {
  console.warn(
    `UYARI: ${envFile} dosyası bulunamadı! Varsayılanlar veya OS değişkenleri kullanılacak.`
  );
}

if (!process.env.JWT_SECRET) {
  throw new Error('KRİTİK HATA: JWT_SECRET ortam değişkeni ayarlanmamış. Uygulama başlatılamıyor.');
}

module.exports = {
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: env,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    logLevel: process.env.LOG_LEVEL || 'info',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    dialect: 'postgres',
    logging: env === 'development' ? console.log : false
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '24h'
  },

  mail: {
    host: process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT, 10) || 587,
    user: process.env.MAIL_USER || process.env.SMTP_USER,
    pass: process.env.MAIL_PASS || process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || '"Mini CRM" <no-reply@minicrm.com>',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@minicrm.com'
  },

  business: {
    shippingFreeLimit: parseFloat(process.env.SHIPPING_FREE_LIMIT) || 1000.0,
    shippingCost: parseFloat(process.env.SHIPPING_COST) || 50.0
  }
};

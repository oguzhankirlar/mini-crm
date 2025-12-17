const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const logger = require('./core/logger');
const context = require('./core/context');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/product/product.routes');
const orderRoutes = require('./modules/order/order.routes');
const customerRoutes = require('./modules/customer/customer.routes');
const reportRoutes = require('./modules/report/report.routes');
const httpLogger = require('./middlewares/httpLogger');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();

  res.setHeader('X-Trace-ID', traceId);

  context.run(new Map([['traceId', traceId]]), () => {
    next();
  });
});

app.use(httpLogger);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

const apiPrefix = config.app.apiPrefix || '/api/v1';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}`, productRoutes);
app.use(`${apiPrefix}`, orderRoutes);
app.use(`${apiPrefix}`, customerRoutes);
app.use(`${apiPrefix}`, reportRoutes);
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  const error = new Error(`Endpoint Bulunamadı: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Sistem Hatası:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası oluştu',
    traceId: res.getHeader('X-Trace-ID'),
    stack: config.app.env === 'development' ? err.stack : undefined
  });
});

module.exports = app;

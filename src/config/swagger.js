const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini CRM API',
      version: '1.0.0',
      description: 'Node.js Mini CRM & E-Ticaret API Dokümantasyonu',
      contact: {
        name: 'Backend Ekibi'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}${config.app.apiPrefix}`,
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/modules/**/*.routes.js', './src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.development') });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST === 'localhost' ? 'postgres_db' : process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  },
  test: {
    username: 'ci_user',
    password: 'ci_password',
    database: 'minicrm_test_db',
    host: 'postgres',
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres'
  }
};

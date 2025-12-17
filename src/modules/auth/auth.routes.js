const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate, isAdmin } = require('../../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Kimlik Doğrulama İşlemleri
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Yeni Üye Kaydı
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kayıt başarılı
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Giriş Yapma (Access & Refresh Token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 default: admin@market.com
 *               password:
 *                 type: string
 *                 default: '123456'
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Süresi Biten Tokenı Yenileme
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Yeni Access Token
 *       403:
 *         description: Geçersiz Token
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /auth/health:
 *   get:
 *     summary: Health Check (Admin Only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sistem Sağlıklı
 *       503:
 *         description: DB Hatası
 */
router.get('/health', authenticate, isAdmin, authController.healthCheck);

module.exports = router;

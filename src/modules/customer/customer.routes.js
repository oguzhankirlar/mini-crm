const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const { authenticate, isAdmin } = require('../../middlewares/authMiddleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Müşteri İşlemleri
 */

/**
 * @swagger
 * /customers/profile:
 *   get:
 *     summary: Profil Bilgilerimi Getir
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil detayları
 */
router.get('/customers/profile', authenticate, customerController.getProfile);

/**
 * @swagger
 * /customers/profile:
 *   put:
 *     summary: Profilimi Güncelle
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       200:
 *         description: Güncellendi
 */
router.put('/customers/profile', authenticate, customerController.updateProfile);

// ==========================================
// 🛡️ ADMIN ENDPOINTS
// ==========================================

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Tüm Müşterileri Listele (Admin)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Müşteri listesi
 */
router.get('/admin/customers', authenticate, isAdmin, customerController.getAll);

/**
 * @swagger
 * /admin/customers/import:
 *   post:
 *     summary: Excel ile Müşteri Yükle (Admin)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import Raporu
 */
router.post(
  '/admin/customers/import',
  authenticate,
  isAdmin,
  upload.single('file'),
  customerController.importExcel
);

module.exports = router;

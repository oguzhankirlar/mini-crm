const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { authenticate, isAdmin } = require('../../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Yönetici Rapor Ekranları
 */

/**
 * @swagger
 * /admin/reports/dashboard:
 *   get:
 *     summary: Genel Özet (Dashboard)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ciro, Sipariş ve Üye sayıları
 */
router.get('/admin/reports/dashboard', authenticate, isAdmin, reportController.getDashboard);

/**
 * @swagger
 * /admin/reports/daily-sales:
 *   get:
 *     summary: Günlük Satış Raporu (Son 7 Gün)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gün bazlı ciro ve sipariş adedi
 */
router.get('/admin/reports/daily-sales', authenticate, isAdmin, reportController.getDailySales);

/**
 * @swagger
 * /admin/reports/best-sellers:
 *   get:
 *     summary: En Çok Satan Ürünler
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ürün listesi
 */
router.get('/admin/reports/best-sellers', authenticate, isAdmin, reportController.getBestSellers);

module.exports = router;

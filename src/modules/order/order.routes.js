const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { authenticate, isAdmin } = require('../../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, config.auth.jwtSecret);
    } catch {
      // Token geçersizse veya süresi dolmuşsa misafir kullanıcı olarak devam et
    }
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Sipariş ve Sepet İşlemleri
 */

/**
 * @swagger
 * /cart/preview:
 *   post:
 *     summary: Sepet Önizleme (Hesaplama)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     variantId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Toplam tutar ve kargo bilgisi
 */
router.post('/cart/preview', orderController.preview);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Sipariş Oluştur
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *               shippingInfo:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sipariş oluşturuldu
 */
router.post('/orders', optionalAuth, orderController.create);

/**
 * @swagger
 * /orders/track/{uuid}:
 *   get:
 *     summary: Misafir Sipariş Takibi
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sipariş durumu
 */
router.get('/orders/track/:uuid', orderController.track);

// ==========================================
// 👤 CUSTOMER ENDPOINTS
// ==========================================

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Geçmiş Siparişlerim
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste
 */
router.get('/orders/my-orders', authenticate, orderController.myOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Sipariş Detayı (Sadece Sahibi)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detay
 */
router.get('/orders/:id', authenticate, orderController.getOne);

// ==========================================
// 🛡️ ADMIN ENDPOINTS
// ==========================================

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Tüm Siparişleri Listele (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: pending, shipped, delivered...
 *     responses:
 *       200:
 *         description: Liste
 */
router.get('/admin/orders', authenticate, isAdmin, orderController.getAllAdmin);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   patch:
 *     summary: Sipariş Durumu Güncelle
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - preparing
 *                   - shipped
 *                   - delivered
 *                   - cancelled
 *     responses:
 *       200:
 *         description: Güncellendi
 */
router.patch('/admin/orders/:id/status', authenticate, isAdmin, orderController.updateStatus);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Sipariş İptal Et (Müşteri)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: İptal başarılı
 *       400:
 *         description: Kargolandığı için iptal edilemez
 */
router.patch('/orders/:id/cancel', authenticate, orderController.cancel);

module.exports = router;

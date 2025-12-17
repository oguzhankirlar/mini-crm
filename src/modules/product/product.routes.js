const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { authenticate, isAdmin } = require('../../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Ürün ve Katalog İşlemleri
 */

// ==========================================
// 🟢 PUBLIC ENDPOINTS
// ==========================================

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Tüm ürünleri listele
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/products', productController.getAll);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Tek ürün detayı
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/products/:id', productController.getOne);

// ==========================================
// 🛡️ ADMIN ENDPOINTS
// ==========================================

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Yeni Ürün Ekle
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Oluşturuldu
 */
router.post('/admin/products', authenticate, isAdmin, productController.create);

/**
 * @swagger
 * /admin/products/low-stock:
 *   get:
 *     summary: Kritik Stok Listesi
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste döner
 */
router.get('/admin/products/low-stock', authenticate, isAdmin, productController.getLowStock);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Ürün Güncelle
 *     tags: [Products]
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
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Güncellendi
 */
router.put('/admin/products/:id', authenticate, isAdmin, productController.update);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Ürün Sil (Soft Delete)
 *     tags: [Products]
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
 *         description: Silindi
 */
router.delete('/admin/products/:id', authenticate, isAdmin, productController.delete);

/**
 * @swagger
 * /admin/products/{id}/variants:
 *   post:
 *     summary: Ürüne Yeni Varyant Ekle
 *     tags: [Products]
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
 *             properties:
 *               name:
 *                 type: string
 *               stockQuantity:
 *                 type: integer
 *               sku:
 *                 type: string
 *     responses:
 *       201:
 *         description: Varyant eklendi
 */
router.post('/admin/products/:id/variants', authenticate, isAdmin, productController.addVariant);

/**
 * @swagger
 * /admin/variants/{variantId}:
 *   put:
 *     summary: Varyant/Stok Güncelle
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stockQuantity:
 *                 type: integer
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Güncellendi
 */
router.put('/admin/variants/:variantId', authenticate, isAdmin, productController.updateVariant);

/**
 * @swagger
 * /admin/variants/{variantId}:
 *   delete:
 *     summary: Hatalı Varyantı Sil
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Silindi
 */
router.delete('/admin/variants/:variantId', authenticate, isAdmin, productController.deleteVariant);

module.exports = router;

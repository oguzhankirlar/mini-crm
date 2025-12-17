const orderService = require('./order.service');
const logger = require('../../core/logger');

class OrderController {
  async preview(req, res) {
    try {
      const result = await orderService.previewCart(req.body.items);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.warn('Sepet önizleme hatası', { error: error.message });
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user.id);
      res.json({ success: true, data: order });
    } catch (error) {
      logger.warn('Sipariş detayı görüntüleme hatası', {
        userId: req.user.id,
        orderId: req.params.id,
        error: error.message
      });
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async getAllAdmin(req, res) {
    try {
      const result = await orderService.getAllOrders(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Admin sipariş listesi hatası', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await orderService.updateStatus(req.params.id, status);

      logger.info('Sipariş durumu güncellendi', {
        adminId: req.user.id,
        orderId: req.params.id,
        newStatus: status
      });

      res.json({ success: true, message: 'Durum güncellendi.', data: order });
    } catch (error) {
      logger.error('Sipariş durumu güncelleme hatası', {
        orderId: req.params.id,
        error: error.message
      });
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const order = await orderService.createOrder(req.body, req.user);

      logger.info('Yeni sipariş alındı', {
        orderNumber: order.orderNumber,
        amount: order.finalAmount,
        userId: req.user ? req.user.id : 'Guest'
      });

      res.status(201).json({
        success: true,
        message: 'Sipariş alındı.',
        orderNumber: order.orderNumber,
        data: order
      });
    } catch (error) {
      logger.error('Sipariş oluşturma başarısız', {
        userId: req.user ? req.user.id : 'Guest',
        error: error.message
      });
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async track(req, res) {
    try {
      const order = await orderService.trackOrder(req.params.uuid);
      res.json({ success: true, data: order });
    } catch (error) {
      logger.warn('Misafir sipariş takibi başarısız', {
        uuid: req.params.uuid,
        error: error.message
      });
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async myOrders(req, res) {
    try {
      const orders = await orderService.getUserOrders(req.user.id);
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async cancel(req, res) {
    try {
      const order = await orderService.cancelOrder(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Siparişiniz iptal edildi ve tutar iade süreci başlatıldı.',
        data: order
      });
    } catch (error) {
      logger.warn('Sipariş iptal başarısız', { userId: req.user.id, error: error.message });
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OrderController();

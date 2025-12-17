const { sequelize, Order, OrderItem, ProductVariant, Product, Customer } = require('../../models');
const config = require('../../config');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../core/logger');
const mailService = require('../notification/mail.service');

class OrderService {
  async createOrder(data, user) {
    const { items, shippingInfo, paymentMethod } = data;
    const t = await sequelize.transaction();

    try {
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of items) {
        const variant = await ProductVariant.findByPk(item.variantId, {
          include: [{ model: Product, as: 'product' }],
          transaction: t
        });

        if (!variant) {
          logger.warn('Sipariş hatası: Varyant bulunamadı', { variantId: item.variantId });
          throw new Error(`Varyant bulunamadı: ID ${item.variantId}`);
        }
        if (!variant.product.isActive) {
          logger.warn('Sipariş hatası: Ürün pasif', { productId: variant.product.id });
          throw new Error(`Ürün satışa kapalı: ${variant.product.name}`);
        }

        if (variant.product.hasStockTracking && variant.stockQuantity < item.quantity) {
          logger.warn('Sipariş hatası: Yetersiz Stok', {
            variantId: variant.id,
            requested: item.quantity,
            available: variant.stockQuantity
          });
          throw new Error(`Yetersiz Stok: ${variant.name} (Kalan: ${variant.stockQuantity})`);
        }

        const unitPrice = parseFloat(variant.product.price);
        subtotal += unitPrice * item.quantity;

        orderItemsData.push({
          productId: variant.product.id,
          variantId: variant.id,
          quantity: item.quantity,
          unitPrice: unitPrice
        });

        if (variant.product.hasStockTracking) {
          await variant.decrement('stockQuantity', { by: item.quantity, transaction: t });
        }
      }

      let shippingCost = config.business.shippingCost;
      if (subtotal >= config.business.shippingFreeLimit) {
        shippingCost = 0;
      }

      const finalAmount = subtotal + shippingCost;

      const newOrder = await Order.create(
        {
          customerId: user ? user.id : null,
          orderNumber: uuidv4(),
          contactEmail: user ? user.email : data.contactEmail,
          shippingName: shippingInfo.fullName,
          shippingPhone: shippingInfo.phone,
          shippingAddress: shippingInfo.address,
          shippingCity: shippingInfo.city,
          subtotal: subtotal,
          shippingCost: shippingCost,
          finalAmount: finalAmount,
          paymentMethod: paymentMethod,
          status: 'pending'
        },
        { transaction: t }
      );

      const itemsWithOrderId = orderItemsData.map((item) => ({
        ...item,
        orderId: newOrder.id
      }));

      await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t });

      await t.commit();

      logger.debug('Sipariş detayları', {
        orderId: newOrder.id,
        itemsCount: items.length,
        total: finalAmount
      });

      mailService
        .sendOrderConfirmation(newOrder, newOrder.contactEmail)
        .catch((err) => logger.error('Mail gönderim hatası (Müşteri)', err));

      mailService
        .sendNewOrderNotifyAdmin(newOrder)
        .catch((err) => logger.error('Mail gönderim hatası (Admin)', err));

      return newOrder;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async trackOrder(uuid) {
    const order = await Order.findOne({
      where: { orderNumber: uuid },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['name'] }] }
      ]
    });
    if (!order) throw new Error('Sipariş bulunamadı.');
    return order;
  }

  async getUserOrders(userId) {
    return await Order.findAll({
      where: { customerId: userId },
      order: [['createdAt', 'DESC']]
    });
  }

  async previewCart(items) {
    let subtotal = 0;
    const summaryItems = [];

    for (const item of items) {
      const variant = await ProductVariant.findByPk(item.variantId, {
        include: [{ model: Product, as: 'product' }]
      });

      if (!variant) {
        logger.debug('Sepet önizleme: Varyant bulunamadı', { variantId: item.variantId });
        throw new Error(`Varyant bulunamadı: ID ${item.variantId}`);
      }

      const hasStock = !variant.product.hasStockTracking || variant.stockQuantity >= item.quantity;

      const unitPrice = parseFloat(variant.product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      summaryItems.push({
        productName: variant.product.name,
        variantName: variant.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        hasStock,
        stockMessage: hasStock ? 'Stokta Var' : 'Yetersiz Stok'
      });
    }

    let shippingCost = config.business.shippingCost;
    if (subtotal >= config.business.shippingFreeLimit) {
      shippingCost = 0;
    }

    return {
      subtotal,
      shippingCost,
      finalAmount: subtotal + shippingCost,
      shippingMessage:
        shippingCost === 0
          ? 'Kargo Bedava!'
          : `${config.business.shippingFreeLimit} TL üzeri kargo bedava.`,
      items: summaryItems
    };
  }

  async getOrderById(orderId, userId = null) {
    const where = { id: orderId };
    if (userId) where.customerId = userId;

    const order = await Order.findOne({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: ProductVariant, include: [{ model: Product, as: 'product' }] }]
        }
      ]
    });

    if (!order) {
      logger.warn('Yetkisiz sipariş görüntüleme denemesi', { orderId, userId });
      throw new Error('Sipariş bulunamadı veya erişim yetkiniz yok.');
    }
    return order;
  }

  async getAllOrders(query) {
    const { page = 1, limit = 10, status } = query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: Customer, attributes: ['firstName', 'lastName', 'email'] }]
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    };
  }

  async updateStatus(orderId, newStatus) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Sipariş bulunamadı.');

    const validStatuses = ['pending', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Geçersiz sipariş durumu.');
    }

    const oldStatus = order.status;
    order.status = newStatus;
    await order.save();

    logger.info('Sipariş statüsü değişti', { orderId, oldStatus, newStatus });

    mailService
      .sendStatusUpdate(order, newStatus)
      .catch((err) => logger.error('Durum güncelleme mail hatası', err));

    return order;
  }

  async cancelOrder(orderId, userId) {
    const t = await sequelize.transaction();

    try {
      const order = await Order.findOne({
        where: { id: orderId, customerId: userId },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: ProductVariant,
                include: [{ model: Product, as: 'product' }]
              }
            ]
          }
        ],
        transaction: t
      });

      if (!order) throw new Error('Sipariş bulunamadı.');

      if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
        throw new Error('Bu sipariş artık iptal edilemez (Kargolandı veya Teslim Edildi).');
      }

      for (const item of order.items) {
        if (item.ProductVariant && item.ProductVariant.product.hasStockTracking) {
          await item.ProductVariant.increment('stockQuantity', {
            by: item.quantity,
            transaction: t
          });

          logger.debug('Stok iade edildi', {
            variantId: item.ProductVariant.id,
            quantity: item.quantity
          });
        }
      }

      order.status = 'cancelled';
      order.cancelReason = 'Müşteri talebiyle iptal edildi';
      await order.save({ transaction: t });

      await t.commit();

      logger.info('Sipariş müşteri tarafından iptal edildi', {
        orderId,
        userId
      });

      mailService
        .sendStatusUpdate(order, 'cancelled')
        .catch((err) => logger.error('İptal mail hatası', err));

      return order;
    } catch (error) {
      await t.rollback();
      logger.error('Sipariş iptal hatası', { orderId, error: error.message });
      throw error;
    }
  }
}

module.exports = new OrderService();

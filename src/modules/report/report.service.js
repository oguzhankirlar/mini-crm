const { Order, Customer, OrderItem, Product, sequelize } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../core/logger');

class ReportService {
  async getDashboardStats() {
    try {
      logger.debug('Dashboard istatistikleri hesaplanıyor...');

      const totalRevenue = await Order.sum('finalAmount', {
        where: {
          status: { [Op.not]: 'cancelled' }
        }
      });

      const pendingOrders = await Order.count({
        where: { status: 'pending' }
      });

      const totalMembers = await Customer.count({
        where: { role: 'customer' }
      });

      return {
        totalRevenue: totalRevenue || 0,
        pendingOrders,
        totalMembers
      };
    } catch (error) {
      logger.error('Dashboard hesaplama hatası (DB)', { error: error.message });
      throw error;
    }
  }

  async getBestSellers() {
    try {
      const bestSellers = await OrderItem.findAll({
        attributes: ['productId', [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']],
        include: [
          {
            model: Product,
            attributes: ['name', 'price']
          }
        ],
        group: ['productId', 'Product.id'],
        order: [[sequelize.literal('"totalSold"'), 'DESC']],
        limit: 10
      });

      return bestSellers;
    } catch (error) {
      logger.error('Best Sellers sorgu hatası', { error: error.message });
      throw error;
    }
  }

  async getDailySales() {
    try {
      logger.debug('Günlük satış verileri çekiliyor (Son 7 Gün)...');

      const dailySales = await Order.findAll({
        attributes: [
          [sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM-DD'), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalRevenue']
        ],
        where: {
          status: { [Op.not]: 'cancelled' },
          created_at: {
            [Op.gte]: sequelize.literal("NOW() - INTERVAL '7 DAYS'")
          }
        },
        group: [sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM-DD')],
        order: [[sequelize.literal('"date"'), 'ASC']]
      });

      return dailySales;
    } catch (error) {
      logger.error('Günlük satış raporu DB hatası', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ReportService();

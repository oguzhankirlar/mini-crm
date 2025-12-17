const nodemailer = require('nodemailer');
const config = require('../../config');
const logger = require('../../core/logger');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port == 465,
      auth: {
        user: config.mail.user,
        pass: config.mail.pass
      }
    });
  }

  async sendMail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: config.mail.from,
        to,
        subject,
        html
      });

      logger.info('E-posta gönderildi', { messageId: info.messageId, to });
      return true;
    } catch (error) {
      logger.error('E-posta gönderme hatası', { error: error.message, to });
      return false;
    }
  }

  async sendOrderConfirmation(order, customerEmail) {
    const trackingLink = `${config.app.frontendUrl}/track-order?code=${order.orderNumber}`;

    const html = `
      <h2>Siparişiniz Alındı!</h2>
      <p>Merhaba,</p>
      <p>Siparişiniz başarıyla alındı. Ödemeniz onaylandıktan sonra hazırlanmaya başlanacaktır.</p>
      
      <p><strong>Sipariş No:</strong> ${order.orderNumber}</p>
      <p><strong>Tutar:</strong> ${order.finalAmount} TL</p>
      
      <h3>Misafir Sipariş Takibi:</h3>
      <p>Siparişinizin durumunu aşağıdaki linkten takip edebilirsiniz (Üye girişi gerektirmez):</p>
      <a href="${trackingLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Siparişimi Takip Et</a>
      
      <p><small>Link çalışmıyorsa: ${trackingLink}</small></p>
      <br>
      <p>Teşekkürler,<br>Mini CRM Ekibi</p>
    `;

    this.sendMail(customerEmail, `Siparişiniz Alındı #${order.orderNumber}`, html);
  }

  async sendNewOrderNotifyAdmin(order) {
    const html = `
      <h3>Yeni Sipariş Var!</h3>
      <p>Sisteme yeni bir sipariş düştü.</p>
      <ul>
        <li><strong>Sipariş No:</strong> ${order.orderNumber}</li>
        <li><strong>Tutar:</strong> ${order.finalAmount} TL</li>
        <li><strong>Müşteri Email:</strong> ${order.contactEmail}</li>
      </ul>
      <p>Yönetim paneline girip onaylayabilirsiniz.</p>
    `;

    this.sendMail(config.mail.adminEmail, 'Yeni Sipariş Var', html);
  }

  async sendStatusUpdate(order, newStatus) {
    const statusMessages = {
      preparing: 'Siparişiniz hazırlanıyor.',
      shipped: 'Siparişiniz kargoya verildi!',
      delivered: 'Siparişiniz teslim edildi.',
      cancelled: 'Siparişiniz iptal edildi.'
    };

    const message = statusMessages[newStatus] || `Sipariş durumunuz güncellendi: ${newStatus}`;

    const html = `
      <h3>Sipariş Durumu Güncellendi</h3>
      <p>Sayın müşterimiz,</p>
      <p>${message}</p>
      <p><strong>Sipariş No:</strong> ${order.orderNumber}</p>
      <br>
      <p>Teşekkürler,<br>Mini CRM Ekibi</p>
    `;

    this.sendMail(order.contactEmail, `Sipariş Güncellemesi: ${newStatus.toUpperCase()}`, html);
  }
}

module.exports = new MailService();

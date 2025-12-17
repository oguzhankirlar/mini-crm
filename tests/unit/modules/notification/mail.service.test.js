const mockLogger = require('../../../mocks/logger.mock');

jest.mock('../../../../src/core/logger', () => mockLogger);

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: mockSendMail
  })
}));

jest.mock('../../../../src/config', () => ({
  mail: {
    host: 'smtp.test.com',
    port: 587,
    user: 'test_user',
    pass: 'test_pass',
    from: 'test@minicrm.com',
    adminEmail: 'admin@test.com'
  },
  app: {
    frontendUrl: 'http://localhost:3000'
  }
}));

const mailService = require('../../../../src/modules/notification/mail.service');

describe('MailService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMail', () => {
    it('Mail başarıyla gönderilirse true dönmeli ve loglamalı', async () => {
      mockSendMail.mockResolvedValue({ messageId: '12345' });

      const result = await mailService.sendMail('alici@test.com', 'Konu', '<p>Merhaba</p>');

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@minicrm.com',
        to: 'alici@test.com',
        subject: 'Konu',
        html: '<p>Merhaba</p>'
      });

      expect(mockLogger.info).toHaveBeenCalledWith('E-posta gönderildi', expect.any(Object));
      expect(result).toBe(true);
    });

    it('Mail gönderimi başarısız olursa false dönmeli ve hata loglamalı', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP Hatası'));

      const result = await mailService.sendMail('alici@test.com', 'Konu', 'İçerik');

      expect(mockLogger.error).toHaveBeenCalledWith('E-posta gönderme hatası', expect.any(Object));
      expect(result).toBe(false);
    });
  });

  describe('sendOrderConfirmation', () => {
    it('Sipariş onayı için doğru HTML oluşturup sendMail çağırmalı', async () => {
      const sendMailSpy = jest.spyOn(mailService, 'sendMail').mockResolvedValue(true);

      const mockOrder = {
        orderNumber: 'ORD-123',
        finalAmount: 150
      };
      const customerEmail = 'musteri@test.com';

      await mailService.sendOrderConfirmation(mockOrder, customerEmail);

      expect(sendMailSpy).toHaveBeenCalledWith(
        customerEmail,
        'Siparişiniz Alındı #ORD-123',
        expect.stringContaining('http://localhost:3000/track-order?code=ORD-123')
      );

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.stringContaining('150 TL')
      );
    });
  });

  describe('sendNewOrderNotifyAdmin', () => {
    it('Admin e-postasına bildirim göndermeli', async () => {
      const sendMailSpy = jest.spyOn(mailService, 'sendMail').mockResolvedValue(true);

      const mockOrder = {
        orderNumber: 'ORD-999',
        finalAmount: 500,
        contactEmail: 'musteri@mail.com'
      };

      await mailService.sendNewOrderNotifyAdmin(mockOrder);

      expect(sendMailSpy).toHaveBeenCalledWith(
        'admin@test.com',
        'Yeni Sipariş Var',
        expect.stringContaining('ORD-999')
      );
    });
  });

  describe('sendStatusUpdate', () => {
    const mockOrder = {
      orderNumber: 'ORD-555',
      contactEmail: 'musteri@test.com'
    };

    it('Kargolandı (shipped) durumu için doğru mesajı göndermeli', async () => {
      const sendMailSpy = jest.spyOn(mailService, 'sendMail').mockResolvedValue(true);

      await mailService.sendStatusUpdate(mockOrder, 'shipped');

      expect(sendMailSpy).toHaveBeenCalledWith(
        mockOrder.contactEmail,
        'Sipariş Güncellemesi: SHIPPED',
        expect.stringContaining('Siparişiniz kargoya verildi!')
      );
    });

    it('Bilinmeyen bir durum geldiğinde varsayılan mesajı göndermeli', async () => {
      const sendMailSpy = jest.spyOn(mailService, 'sendMail').mockResolvedValue(true);

      await mailService.sendStatusUpdate(mockOrder, 'custom_status');

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.stringContaining('Sipariş durumunuz güncellendi: custom_status')
      );
    });
  });
});

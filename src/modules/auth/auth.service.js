const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Customer } = require('../../models');
const config = require('../../config');
const logger = require('../../core/logger');

class AuthService {
  async register(payload) {
    const { firstName, lastName, email, password, phone } = payload;

    logger.debug('Yeni üye kaydı isteği işleniyor', { email });

    const existingUser = await Customer.findOne({ where: { email } });
    if (existingUser) {
      logger.warn('Mükerrer üyelik denemesi', { email });
      throw new Error('Bu e-posta adresi zaten kullanımda.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await Customer.create({
      firstName,
      lastName,
      email,
      passwordHash,
      phone,
      role: 'customer'
    });

    const userWithoutPass = newUser.toJSON();
    delete userWithoutPass.passwordHash;

    logger.info('Yeni müşteri oluşturuldu', { userId: newUser.id, email });

    return userWithoutPass;
  }

  async login(email, password) {
    const user = await Customer.findOne({ where: { email } });

    if (!user) {
      logger.warn('Hatalı giriş: Kullanıcı bulunamadı', { email });
      throw new Error('E-posta veya şifre hatalı.');
    }

    if (!user.passwordHash) {
      logger.warn('Şifresiz kullanıcı girişi denemesi (Eski veri)', { userId: user.id });
      throw new Error('Lütfen şifrenizi sıfırlayın.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.warn('Hatalı giriş: Yanlış şifre', { userId: user.id, email });
      throw new Error('E-posta veya şifre hatalı.');
    }

    logger.info('Kullanıcı giriş yaptı', { userId: user.id, email: user.email });

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName
      },
      ...tokens
    };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret);

      const user = await Customer.findByPk(decoded.id);
      if (!user) {
        logger.error('Token yenileme: Kullanıcı veritabanında yok', { userId: decoded.id });
        throw new Error('Kullanıcı bulunamadı.');
      }

      logger.info('Access Token yenilendi', { userId: user.id });

      const accessToken = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpire }
      );

      return { accessToken };
    } catch (error) {
      logger.warn('Geçersiz Refresh Token denemesi', { error: error.message });
      throw new Error('Geçersiz veya süresi dolmuş Refresh Token.');
    }
  }

  generateTokens(user) {
    const payload = { id: user.id, role: user.role, email: user.email };

    const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpire
    });
    const refreshToken = jwt.sign(payload, config.auth.jwtSecret, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();

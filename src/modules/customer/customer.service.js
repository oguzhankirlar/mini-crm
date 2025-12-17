const { Customer } = require('../../models');
const xlsx = require('xlsx');
const fs = require('fs');
const logger = require('../../core/logger');

class CustomerService {
  async getAllCustomers(query) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Customer.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['passwordHash'] }
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    };
  }

  async updateProfile(userId, data) {
    const customer = await Customer.findByPk(userId);
    if (!customer) {
      logger.warn('Profil güncelleme: Kullanıcı bulunamadı', { userId });
      throw new Error('Kullanıcı bulunamadı.');
    }

    if (data.firstName) customer.firstName = data.firstName;
    if (data.lastName) customer.lastName = data.lastName;
    if (data.phone) customer.phone = data.phone;
    if (data.address) customer.address = data.address;
    if (data.city) customer.city = data.city;

    await customer.save();
    return customer;
  }

  normalizePhone(phone) {
    if (!phone) return null;
    let cleaned = phone.toString().replace(/[^0-9]/g, '');
    if (cleaned.startsWith('90') && cleaned.length > 10) cleaned = cleaned.substring(2);
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return cleaned;
  }

  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  cleanName(name) {
    if (!name) return '';
    return name.toString().trim().replace(/['"]/g, '');
  }

  async importCustomers(filePath) {
    const report = {
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    const processedEmailsInFile = new Set();

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      logger.info(`Excel okundu. Toplam satır: ${rawData.length}`);

      for (const [index, row] of rawData.entries()) {
        const rowNumber = index + 2;

        try {
          const rawEmail = row['Email'] || row['email'] || row['E-posta'];
          const rawPhone = row['Telefon'] || row['phone'] || row['Phone'];
          const rawName = row['Ad'] || row['first_name'] || row['Name'];
          const rawSurname = row['Soyad'] || row['last_name'] || row['Surname'];
          const rawAddress = row['Adres'] || row['address'];
          const rawNote = row['Not'] || row['note'];

          if (!rawEmail) throw new Error('E-posta alanı boş.');

          const email = rawEmail.toString().trim().toLowerCase();

          if (!this.isValidEmail(email)) {
            throw new Error(`Geçersiz E-posta formatı: ${email}`);
          }

          if (processedEmailsInFile.has(email)) {
            throw new Error(`Mükerrer Kayıt (Dosya İçinde): ${email}`);
          }
          processedEmailsInFile.add(email);

          const existingUser = await Customer.findOne({ where: { email } });
          if (existingUser) {
            throw new Error(`Mükerrer Kayıt (Veritabanında Var): ${email}`);
          }

          const cleanPhone = this.normalizePhone(rawPhone);
          const firstName = this.cleanName(rawName) || 'Misafir';
          let lastName = this.cleanName(rawSurname);
          if (!lastName || lastName === '') lastName = '.';

          await Customer.create({
            firstName,
            lastName,
            email,
            phone: cleanPhone,
            role: 'customer',
            address: rawAddress ? rawAddress.toString().trim() : null,
            note: rawNote ? rawNote.toString().trim() : 'Excel Import'
          });

          report.successCount++;
        } catch (rowError) {
          report.errorCount++;

          logger.warn('Excel import satır hatası', {
            row: rowNumber,
            email: row['Email'] || 'Bilinmiyor',
            error: rowError.message
          });

          report.errors.push({
            row: rowNumber,
            email: row['Email'] || row['email'] || 'Bilinmiyor',
            error: rowError.message
          });
        }
      }
    } catch (err) {
      logger.error('Excel okuma hatası', { error: err.message });
      throw err;
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug('Geçici Excel dosyası temizlendi', { path: filePath });
      }
    }

    return report;
  }

  async getProfile(userId) {
    const customer = await Customer.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!customer) {
      logger.warn('Profil getirme hatası: Kullanıcı yok', { userId });
      throw new Error('Kullanıcı bulunamadı.');
    }
    return customer;
  }
}

module.exports = new CustomerService();

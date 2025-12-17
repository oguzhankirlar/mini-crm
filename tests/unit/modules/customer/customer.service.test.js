const mockLogger = require('../../../mocks/logger.mock');

jest.mock('../../../../src/models', () => require('../../../mocks/db.mock'));
jest.mock('../../../../src/core/logger', () => require('../../../mocks/logger.mock'));

const mockXlsx = {
  readFile: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  },
  SheetNames: ['Sheet1'],
  Sheets: { Sheet1: {} }
};
jest.mock('xlsx', () => mockXlsx);

const mockFs = {
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
};
jest.mock('fs', () => mockFs);

const dbMock = require('../../../mocks/db.mock');
const customerService = require('../../../../src/modules/customer/customer.service');

describe('CustomerService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Helper Methods', () => {
    describe('normalizePhone', () => {
      it('null veya undefined gelirse null dönmeli', () => {
        expect(customerService.normalizePhone(null)).toBeNull();
        expect(customerService.normalizePhone(undefined)).toBeNull();
      });

      it('90 ile başlayan numarayı temizlemeli', () => {
        const res = customerService.normalizePhone('905321234567');
        expect(res).toBe('5321234567');
      });

      it('0 ile başlayan numarayı temizlemeli', () => {
        const res = customerService.normalizePhone('05321234567');
        expect(res).toBe('5321234567');
      });

      it('Sadece rakamları bırakmalı', () => {
        const res = customerService.normalizePhone('(532) 123-45 67');
        expect(res).toBe('5321234567');
      });
    });

    describe('cleanName', () => {
      it('Boş gelirse boş string dönmeli', () => {
        expect(customerService.cleanName(null)).toBe('');
      });

      it('Tırnak işaretlerini temizlemeli', () => {
        const res = customerService.cleanName('"Ahmet\'');
        expect(res).toBe('Ahmet');
      });

      it('Boşlukları trimlemeli', () => {
        const res = customerService.cleanName('  Mehmet  ');
        expect(res).toBe('Mehmet');
      });
    });

    describe('isValidEmail', () => {
      it('Geçerli mail için true dönmeli', () => {
        expect(customerService.isValidEmail('test@test.com')).toBe(true);
      });

      it('Geçersiz mail için false dönmeli', () => {
        expect(customerService.isValidEmail('bozukmail')).toBe(false);
        expect(customerService.isValidEmail('test@.com')).toBe(false);
      });
    });
  });

  describe('getAllCustomers', () => {
    it('sayfalama parametreleri ile verileri getirmeli', async () => {
      dbMock.Customer.findAndCountAll.mockResolvedValue({
        count: 20,
        rows: [{ id: 1, firstName: 'Test' }]
      });

      const result = await customerService.getAllCustomers({});

      expect(dbMock.Customer.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0,
          attributes: { exclude: ['passwordHash'] }
        })
      );

      expect(result.currentPage).toBe(1);
    });

    it('custom parametreler ile verileri getirmeli', async () => {
      dbMock.Customer.findAndCountAll.mockResolvedValue({
        count: 20,
        rows: []
      });
      const query = { page: 2, limit: 5 };
      await customerService.getAllCustomers(query);

      expect(dbMock.Customer.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('kullanıcı varsa bilgileri güncellemeli ve kaydetmeli', async () => {
      const mockUserInstance = {
        id: 1,
        firstName: 'Eski',
        lastName: 'Soyad',
        phone: '123',
        address: 'Adres',
        city: 'City',
        save: jest.fn().mockResolvedValue(true)
      };

      dbMock.Customer.findByPk.mockResolvedValue(mockUserInstance);

      const updateData = {
        firstName: 'Yeni',
        lastName: 'YeniSoyad',
        phone: '999',
        address: 'YeniAdres',
        city: 'Istanbul'
      };

      await customerService.updateProfile(1, updateData);

      expect(mockUserInstance.firstName).toBe('Yeni');
      expect(mockUserInstance.lastName).toBe('YeniSoyad');
      expect(mockUserInstance.address).toBe('YeniAdres');
      expect(mockUserInstance.save).toHaveBeenCalled();
    });

    it('kullanıcı yoksa hata fırlatmalı', async () => {
      dbMock.Customer.findByPk.mockResolvedValue(null);

      await expect(customerService.updateProfile(99, { firstName: 'A' })).rejects.toThrow(
        'Kullanıcı bulunamadı.'
      );

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('kullanıcıyı getirmeli', async () => {
      dbMock.Customer.findByPk.mockResolvedValue({ id: 1 });
      const res = await customerService.getProfile(1);
      expect(res).toBeDefined();
    });

    it('kullanıcı yoksa hata fırlatmalı', async () => {
      dbMock.Customer.findByPk.mockResolvedValue(null);
      await expect(customerService.getProfile(1)).rejects.toThrow();
    });
  });

  describe('importCustomers', () => {
    const filePath = 'dummy.xlsx';

    const setupXlsxMock = (rows) => {
      mockXlsx.readFile.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      });
      mockXlsx.utils.sheet_to_json.mockReturnValue(rows);
      mockFs.existsSync.mockReturnValue(true);
    };

    it('Geçerli verileri başarıyla içe aktarmalı', async () => {
      const rows = [{ Email: 'ali@test.com', Ad: 'Ali', Telefon: '(532) 123 45 67' }];
      setupXlsxMock(rows);

      dbMock.Customer.findOne.mockResolvedValue(null);
      dbMock.Customer.create.mockResolvedValue({ id: 1 });

      const report = await customerService.importCustomers(filePath);

      expect(report.successCount).toBe(1);
      expect(report.errorCount).toBe(0);

      expect(dbMock.Customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ali@test.com',
          phone: '5321234567',
          firstName: 'Ali'
        })
      );

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(filePath);
    });

    it('Veriler eksikse varsayılan değerleri (Misafir, ., Excel Import) kullanmalı', async () => {
      const rows = [{ Email: 'eksik@test.com', Telefon: '5551112233' }];
      setupXlsxMock(rows);

      dbMock.Customer.findOne.mockResolvedValue(null);
      dbMock.Customer.create.mockResolvedValue({ id: 1 });

      await customerService.importCustomers(filePath);

      expect(dbMock.Customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Misafir',
          lastName: '.',
          note: 'Excel Import',
          address: null
        })
      );
    });

    it('E-posta alanı boşsa hata vermeli', async () => {
      const rows = [{ Ad: 'Mehmet', Telefon: '555' }];
      setupXlsxMock(rows);

      const report = await customerService.importCustomers(filePath);

      expect(report.successCount).toBe(0);
      expect(report.errorCount).toBe(1);
      expect(report.errors[0].error).toContain('E-posta alanı boş');
    });

    it('Geçersiz e-posta formatında hata sayısını artırmalı', async () => {
      const rows = [{ Email: 'bozuk-mail', Ad: 'Test' }];
      setupXlsxMock(rows);

      const report = await customerService.importCustomers(filePath);

      expect(report.successCount).toBe(0);
      expect(report.errorCount).toBe(1);
      expect(report.errors[0].error).toContain('Geçersiz E-posta');
      expect(dbMock.Customer.create).not.toHaveBeenCalled();
    });

    it('Dosya içinde aynı mail iki kez varsa ikinciyi hata olarak saymalı', async () => {
      const rows = [
        { Email: 'ayni@test.com', Ad: 'Bir' },
        { Email: 'ayni@test.com', Ad: 'İki' }
      ];
      setupXlsxMock(rows);

      dbMock.Customer.findOne.mockResolvedValue(null);

      const report = await customerService.importCustomers(filePath);

      expect(report.successCount).toBe(1);
      expect(report.errorCount).toBe(1);
      expect(report.errors[0].error).toContain('Mükerrer Kayıt (Dosya İçinde)');
    });

    it('Veritabanında zaten olan maili eklememeli', async () => {
      const rows = [{ Email: 'varolan@test.com', Ad: 'Test' }];
      setupXlsxMock(rows);

      dbMock.Customer.findOne.mockResolvedValue({ id: 55, email: 'varolan@test.com' });

      const report = await customerService.importCustomers(filePath);

      expect(report.successCount).toBe(0);
      expect(report.errorCount).toBe(1);
      expect(report.errors[0].error).toContain('Mükerrer Kayıt (Veritabanında Var)');
    });

    it('Excel okuma hatasında işlemi durdurup hata fırlatmalı', async () => {
      mockXlsx.readFile.mockImplementation(() => {
        throw new Error('Dosya bozuk');
      });
      mockFs.existsSync.mockReturnValue(true);

      await expect(customerService.importCustomers(filePath)).rejects.toThrow('Dosya bozuk');

      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });
  });
});

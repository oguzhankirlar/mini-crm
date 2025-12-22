# Mini CRM - E-Ticaret Yönetim Sistemi

Bu proje, başlangıçta %40 seviyesinde bırakılmış, eksik ve hatalı bir müşteri/sipariş yönetim sisteminin (Legacy Code); modern yazılım mimarisi standartlarına uygun olarak onarılması, tamamlanması ve Dockerize edilmesi projesidir.

## Proje Durumu ve Yapılanlar

> **Durum:** Tamamlandı
> **Eski Durum:** API uçları, testler, loglama ve migration yapısı eksikti.
> **Yeni Durum:** Tüm sistem stabilize edildi ve aşağıdaki özellikler eklendi:

* **Docker Altyapısı:** Tüm proje konteynerize edildi.
* **Veritabanı Yönetimi:** Sequelize ile Migration ve Seeding yapıları kuruldu.
* **ETL Servisi:** Eski Excel verilerini temizleyip içeri alan servis yazıldı.
* **Güvenlik:** JWT tabanlı kimlik doğrulama eklendi.
* **Loglama:** Trace ID destekli yapılandırılmış (Winston) loglama eklendi.
* **Dokümantasyon:** Swagger (OpenAPI) entegrasyonu yapıldı.
* **Test:** Unit testler yazıldı ve CI pipeline hazırlandı.

---

## 9.2. Kurulum Rehberi

Projeyi yerel ortamınızda sorunsuz çalıştırmak için aşağıdaki adımları izleyin.

### Ön Gereksinimler
Projeyi çalıştırmadan önce bilgisayarınızda aşağıdaki araçların kurulu olduğundan emin olun:

* **Git:** Projeyi klonlamak için.
* **Docker Desktop:** Konteynerleri çalıştırmak için.
    * *Not: Docker Engine ve Docker Compose güncel sürümde olmalıdır.*

### Adım 1: Projeyi Bilgisayarınıza İndirin
Terminal veya Komut Satırını (CMD/PowerShell) açın ve aşağıdaki komutları uygulayın:

```bash
git clone [https://github.com/oguzhankirlar/mini-crm.git](https://github.com/oguzhankirlar/mini-crm.git)
cd mini-crm
```

### Adım 2: Ortam Değişkenleri (.env)

Projenin çalışabilmesi için veritabanı bağlantı bilgileri ve API ayarlarını içeren ortam değişkenlerine ihtiyaç vardır.

Bu proje, Docker ortamı için önceden yapılandırılmış **`.env.development`** dosyası ile birlikte gelmektedir.

1. Proje ana dizininde **`.env.development`** dosyasının bulunduğunu kontrol edin.
2. Varsayılan ayarlar Docker konteynerleri ile uyumlu olacak şekilde hazırlandığı için **herhangi bir değişiklik yapmanıza gerek yoktur**.
3. Docker Compose çalıştırıldığında bu dosya otomatik olarak kullanılacaktır.

> ℹ️ **Bilgi:**
> Farklı bir ortam (production vb.) için kurulum yapılacaksa, bu dosya temel alınarak yeni bir `.env` dosyası oluşturulabilir.

### Adım 3: Uygulamayı Başlatma (Docker)

Ortam değişkenleri ayarlandıktan sonra, uygulamayı ve gerekli tüm altyapıyı Docker kullanarak ayağa kaldırabilirsiniz.

Bu adımda **Node.js API** ve **PostgreSQL veritabanı** aynı anda başlatılacaktır.

Proje dizinindeyken aşağıdaki komutu çalıştırın:

```bash
docker-compose up --build
```

### Adım 4: Veritabanı Kurulumu (Migration & Seed)

Uygulama ilk kez başlatıldığında veritabanı boştur. Gerekli tabloların oluşturulması ve örnek (test) verilerinin yüklenmesi için migration ve seed işlemlerinin çalıştırılması gerekir.

Bu adım için **yeni bir terminal sekmesi** açın (Docker konteynerleri çalışır durumda olmalıdır) ve aşağıdaki komutları sırasıyla çalıştırın.

1. Tabloları oluşturmak için (Migration):

```bash
docker-compose exec api npx sequelize-cli db:migrate
```
2. Örnek verileri ve yönetici hesabını yüklemek için (Seed):

```bash
docker-compose exec api npx sequelize-cli db:seed:all
```

### Adım 5: Kullanım ve API Testi

Sistem başarıyla ayağa kalktıktan sonra, API uçlarını görüntülemek ve test etmek için Swagger arayüzünü kullanabilirsiniz.

**Swagger Dokümantasyonu:**
Tarayıcınızda şu adrese gidin:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

**Yönetici Girişi:**
4. adımda yapılan `seed` işlemi sayesinde aşağıdaki yönetici hesabı otomatik olarak oluşturulmuştur:

* **Email:** `admin@sirket.com`
* **Şifre:** `123123`

**Token Alma ve Yetkilendirme:**
1. Swagger arayüzünde **`/auth/login`** endpoint’ini açın.
2. Yukarıdaki email ve şifre bilgileri ile giriş isteği gönderin ("Try it out" > "Execute").
3. Dönen "Response" içerisindeki **JWT Token** değerini kopyalayın.
4. Sayfanın en üstündeki **Authorize** butonuna tıklayın, token'ı yapıştırın ve **Authorize** diyerek pencereyi kapatın.

Artık kilit simgesi kilitli hale gelmiştir ve yetki gerektiren tüm işlemleri test edebilirsiniz.

### Adım 6: Testleri Çalıştırma

Uygulamanın doğru çalıştığını doğrulamak ve kodun bütünlüğünü test etmek için birim testleri (Unit Tests) çalıştırabilirsiniz.

Bu işlem Docker konteyneri içerisinde gerçekleştirilir, bu yüzden konteynerlerin çalışır durumda olması gerekir.

Testleri başlatmak için şu komutu terminalde çalıştırın:

```bash
docker-compose exec api npm test
```

Bu komut tamamlandığında, terminal ekranında tüm testlerin başarı durumu ve kapsama (coverage) raporu görüntülenecektir.

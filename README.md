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


Projenin çalışabilmesi için veritabanı bağlantı bilgileri ve API ayarlarını içeren ortam değişkenlerine ihtiyaç vardır.

Bu proje, Docker ortamı için önceden yapılandırılmış **`.env.development`** dosyası ile birlikte gelmektedir.


1. Proje ana dizininde **`.env.development`** dosyasının bulunduğunu kontrol edin.
2. Varsayılan ayarlar Docker konteynerleri ile uyumlu olacak şekilde hazırlandığı için **herhangi bir değişiklik yapmanıza gerek yoktur**.
3. Docker Compose çalıştırıldığında bu dosya otomatik olarak kullanılacaktır.

> ℹ️ **Bilgi:**  
> Farklı bir ortam (production vb.) için kurulum yapılacaksa, bu dosya temel alınarak yeni bir `.env` dosyası oluşturulabilir.

Bu adım tamamlandıktan sonra bir sonraki adımda uygulamayı Docker ile başlatabilirsiniz.

Ortam değişkenleri ayarlandıktan sonra, uygulamayı ve gerekli tüm altyapıyı Docker kullanarak ayağa kaldırabilirsiniz.

Bu adımda **Node.js API** ve **PostgreSQL veritabanı** aynı anda başlatılacaktır.

Proje dizinindeyken aşağıdaki komutu çalıştırın:

```bash
docker-compose up --build

Uygulama ilk kez başlatıldığında veritabanı boştur.  
Gerekli tabloların oluşturulması ve örnek (test) verilerinin yüklenmesi için migration ve seed işlemlerinin çalıştırılması gerekir.

Bu adım için **yeni bir terminal sekmesi** açın (Docker konteynerleri çalışır durumda olmalıdır) ve aşağıdaki komutları sırasıyla çalıştırın.

---

Aşağıdaki komut, Sequelize migration dosyalarını çalıştırarak tüm veritabanı tablolarını oluşturur:

```bash
docker-compose exec api npx sequelize-cli db:migrate

Kurulum ve veritabanı işlemleri tamamlandıktan sonra sistem kullanıma hazır hale gelir.  
Bu adımda API’nin çalıştığını doğrulayabilir ve test işlemlerine başlayabilirsiniz.

---

Tüm API uçlarını görüntülemek ve test etmek için tarayıcınızdan aşağıdaki adrese gidin:

http://localhost:3000/api-docs


Swagger arayüzü üzerinden:
- Mevcut endpoint’leri görüntüleyebilir
- İstekleri manuel olarak test edebilir
- Request ve response yapılarını inceleyebilirsiniz

---

Seed işlemi ile birlikte otomatik olarak oluşturulan yönetici hesabı bilgileri aşağıdadır:

- **Email:** `admin@sirket.com`
- **Şifre:** `123123`

---

1. Swagger üzerinden **`/auth/login`** endpoint’ini açın.
2. Yukarıdaki email ve şifre bilgileri ile giriş yapın.
3. Dönen response içerisinden **JWT Token**’ı kopyalayın.
4. Swagger arayüzündeki **Authorize** butonunu kullanarak token’ı ekleyin.

Bu işlemlerden sonra yetkilendirme gerektiren tüm endpoint’leri test edebilirsiniz.

Bu adım tamamlandıktan sonra testleri çalıştırabilir veya uygulamayı aktif olarak kullanmaya başlayabilirsiniz.

Uygulamanın doğru şekilde çalıştığını doğrulamak ve birim testlerin (Unit Tests) başarılı olduğunu görmek için testleri Docker ortamı içinde çalıştırabilirsiniz.

Bu işlem için API konteynerinin çalışıyor olması gerekmektedir.

---

Aşağıdaki komutu terminalde çalıştırın:

```bash
docker-compose exec api npm test

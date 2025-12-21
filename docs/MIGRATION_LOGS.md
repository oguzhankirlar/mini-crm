# Veritabanı Değişiklik Günlüğü (Migration Log)

Bu doküman, Mini CRM projesindeki veritabanı şema değişikliklerini ve uygulanan migration stratejisini içerir.

## Uygulanan Strateji
Projede **Code-First** yaklaşımı yerine, şema değişikliklerinin kontrollü yönetimi için **Sequelize CLI Migrations** kullanılmıştır. Her değişiklik, `YYYYMMDDHHMMSS-name.js` formatında zaman damgalı dosyalarla saklanır.

## Değişiklik Geçmişi

### v1.0.0 - Initial Schema
**Tarih:** 2024-01-01
**Durum:** Applied
**Açıklama:** Temel tabloların oluşturulması.
- `customers`: Müşteri verileri ve rol yönetimi.
- `products`: Ürün kataloğu ve fiyat bilgisi.
- `product_variants`: Renk/Beden ve SKU bazlı stok takibi.
- `orders` & `order_items`: Sipariş yönetimi.

### v1.1.0 - Performance Optimization
**Dosya:** `20251221181757-add-performance-indexes.js`
**Durum:** Applied
**Açıklama:** Sık kullanılan sorguların hızlandırılması için veritabanı indeksleri eklendi.
1. **Customers Tablosu:** `email` alanına Unique Index eklendi. (Login ve arama hızı artırıldı).
2. **Product Variants Tablosu:** `sku` alanına Unique Index eklendi. (Stok sorgulama hızı artırıldı).

## Kullanılan Komutlar
- Migration Uygulama: `npx sequelize-cli db:migrate`
- Geri Alma (Undo): `npx sequelize-cli db:migrate:undo`
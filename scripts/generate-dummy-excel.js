const XLSX = require('xlsx');
const path = require('path');

const data = [
  ['Ad', 'Soyad', 'Telefon', 'Email', 'Adres', 'Not'],
  [
    'Ahmet',
    'Yılmaz',
    '+90 532 111 22 33',
    'ahmet.yilmaz@mail.com',
    'İstanbul, Kadıköy',
    'Normal kayıt'
  ],
  [
    'Mehmet Ali',
    '',
    '05321112233',
    'mehmetali@mail.com',
    'Ankara',
    'Soyadı yok (Biz düzelteceğiz)'
  ],
  ['Ayşe', 'KARA', '5321112233', 'ayse.kara@mail', '', 'Email hatalı (TLD yok)'],
  ['Hasan', 'Demir', '+90532 1112233', 'hasan.demir@mail.com', 'İzmir', ''],
  ['Hakan A.', 'Çelik', '905321112233', 'hakan.celik@gmail.com', 'İstanbul', ''],
  ['Fatma Nur', 'Yilmaz', '0 532 111 22 33', 'fatma@mail.com', 'Adana', 'Duplicate olabilir (1)'],
  [
    'fatma nur',
    'yilmaz',
    '+90 (532) 111 2233',
    'fatma@mail.com',
    'Adana',
    'Aynı kişi mi? (Duplicate 2 - Küçük harf)'
  ],
  ['', 'Doğan', '532-111-2233', 'dogan@mail.com', 'Bursa', 'Adı boş'],
  ['Elif', '', '1112233', 'elif@mail.com', 'İstanbul', 'Telefon eksik/hatalı'],
  ['Ali', 'Öztürk', '+90 555 444 3322', '', '', 'Email yok'],
  ['Ali', 'Ozturk', '+90 555 444 3322', 'ali.ozturk@mail.com', '', 'Duplicate şüpheli'],
  ['"Merve"', 'Kaya', '0532-111-22-33', 'mervekaya@mail.com', 'Manisa', 'Ad alanında tırnak var'],
  ['Murat', 'Şahin', '+90 532 1112233', '', 'Konya', 'Email eksik'],
  [
    'Ahmet',
    'Yılmaz',
    '+905321112233',
    'ahmet.yilmaz@mail.com',
    'İstanbul',
    'Tamamen Duplicate (Aynısı üstte var)'
  ],
  ['Caner', 'Taş', '0532 111', 'caner.tas@mail.com', '-', 'Telefon çok kısa'],
  ['Ceren', '', '+90 5321112233', 'ceren@@mail.com', 'İstanbul', 'Email hatalı (iki @ var)'],
  ['Yusuf', 'Demİr', '0(532)1112233', 'yusuf.demir@mail.com', 'Hatay', 'Soyad harf hatası'],
  ['Esra', 'Arslan', '+90-532-111-22-33', 'esra_arslanmail.com', 'Antalya', '@ işareti eksik'],
  ['Muhammed', 'Ak', '5321112233', '', 'İstanbul', 'Email yok'],
  ['M.', 'Demir', '5321112233', 'mdemir@mail.com', '', 'Ad çok belirsiz']
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Musteriler');

const filePath = path.join(__dirname, '..', 'customers_old.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Excel dosyası oluşturuldu: ${filePath}`);

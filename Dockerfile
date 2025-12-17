# --------------------------------------------------------
# 1. Base Stage (Ortak Zemin)
# Hem Dev hem Prod için geçerli olan temel ayarlar
# --------------------------------------------------------
FROM node:20-alpine as base

# Çalışma dizinini ayarla
WORKDIR /app

# Paket dosyalarını kopyala
COPY package*.json ./

# Node ortamını argüman olarak al (Varsayılan: development)
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

# --------------------------------------------------------
# 2. Development Stage (Geliştirme Ortamı)
# Tüm bağımlılıkları yükler, Nodemon ile çalışır
# --------------------------------------------------------
FROM base as development

# NODE_ENV'i development yap ki devDependencies yüklensin
ENV NODE_ENV=development

# Tüm bağımlılıkları yükle (eslint, nodemon, jest dahil)
RUN npm ci

# Kaynak kodlarını kopyala
COPY . .

# Portu aç
EXPOSE 3000

# Geliştirme komutunu çalıştır (package.json -> scripts -> dev)
CMD ["npm", "run", "dev"]

# --------------------------------------------------------
# 3. Production Stage (Canlı Ortam)
# Sadece gerekli paketleri yükler, hafiftir
# --------------------------------------------------------
FROM base as production

# NODE_ENV'i production yap
ENV NODE_ENV=production

# Sadece production bağımlılıklarını yükle (devDeps hariç)
RUN npm ci --only=production && npm cache clean --force

# Kaynak kodlarını kopyala
COPY . .

# Güvenlik için root olmayan kullanıcıya geç (Node imajında hazır gelir)
USER node

# Portu aç
EXPOSE 3000

# Başlatma komutu (package.json -> scripts -> start)
CMD ["npm", "start"]
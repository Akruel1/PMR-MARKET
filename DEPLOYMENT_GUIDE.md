# 🚀 Руководство по развертыванию PMR Market на Ubuntu Server

## 📋 Предварительные требования

- Ubuntu Server 20.04+ (рекомендуется 22.04 LTS)
- Минимум 2GB RAM, 20GB диска
- Доступ к серверу по SSH с правами sudo
- Домен pmrmarket.com настроен на IP сервера

## 🔧 Шаг 1: Подготовка сервера

### 1.1 Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Установка необходимых пакетов
```bash
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
```

### 1.3 Настройка файрвола
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📦 Шаг 2: Установка Node.js и npm

### 2.1 Установка Node.js 20.x (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.2 Проверка установки
```bash
node --version  # должно показать v20.x.x
npm --version   # должно показать 10.x.x или выше
```

## 🗄️ Шаг 3: Установка PostgreSQL

### 3.1 Установка PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 3.2 Настройка PostgreSQL
```bash
sudo -u postgres psql
```

В PostgreSQL консоли выполните:
```sql
CREATE DATABASE pmrmarket;
CREATE USER pmrmarket WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE pmrmarket TO pmrmarket;
ALTER USER pmrmarket CREATEDB;
\q
```

### 3.3 Настройка подключения
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```
Найдите и раскомментируйте:
```
listen_addresses = 'localhost'
```

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```
Добавьте строку:
```
local   pmrmarket    pmrmarket                     md5
```

Перезапустите PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## 🔄 Шаг 4: Установка Redis

### 4.1 Установка Redis
```bash
sudo apt install -y redis-server
```

### 4.2 Настройка Redis
```bash
sudo nano /etc/redis/redis.conf
```
Найдите и измените:
```
supervised systemd
```

Перезапустите Redis:
```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

## 📁 Шаг 5: Клонирование и настройка проекта

### 5.1 Создание пользователя для приложения
```bash
sudo adduser pmrmarket
sudo usermod -aG sudo pmrmarket
```

### 5.2 Переключение на пользователя приложения
```bash
sudo su - pmrmarket
```

### 5.3 Клонирование репозитория
```bash
git clone https://github.com/Akruel1/PMR-MARKET.git
cd PMR-MARKET
```

### 5.4 Установка зависимостей
```bash
npm install
```

## ⚙️ Шаг 6: Настройка переменных окружения

### 6.1 Создание .env файла
```bash
cp .env.example .env
nano .env
```

### 6.2 Заполните .env файл:
```env
# Database
DATABASE_URL="postgresql://pmrmarket:your_secure_password_here@localhost:5432/pmrmarket"

# NextAuth
NEXTAUTH_URL="https://pmrmarket.com"
NEXTAUTH_SECRET="your_very_long_random_secret_here_min_32_chars"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Email (Nodemailer)
EMAIL_FROM="pmrmarket@proton.me"
EMAIL_HOST="mail.proton.me"
EMAIL_PORT="587"
EMAIL_USER="pmrmarket@proton.me"
EMAIL_PASS="your_email_password"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

# Redis
REDIS_URL="redis://localhost:6379"

# Environment
NODE_ENV="production"
```

### 6.3 Генерация NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

## 🗃️ Шаг 7: Настройка базы данных

### 7.1 Генерация Prisma клиента
```bash
npx prisma generate
```

### 7.2 Применение миграций
```bash
npx prisma migrate deploy
```

### 7.3 Заполнение начальными данными
```bash
npx prisma db seed
```

## 🏗️ Шаг 8: Сборка приложения

### 8.1 Сборка Next.js приложения
```bash
npm run build
```

## 🔧 Шаг 9: Настройка PM2 для управления процессом

### 9.1 Установка PM2 глобально
```bash
sudo npm install -g pm2
```

### 9.2 Создание ecosystem файла
```bash
nano ecosystem.config.js
```

Содержимое файла:
```javascript
module.exports = {
  apps: [{
    name: 'pmrmarket',
    script: 'npm',
    args: 'start',
    cwd: '/home/pmrmarket/PMR-MARKET',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/pmrmarket/logs/err.log',
    out_file: '/home/pmrmarket/logs/out.log',
    log_file: '/home/pmrmarket/logs/combined.log',
    time: true
  }]
}
```

### 9.3 Создание директории для логов
```bash
mkdir -p /home/pmrmarket/logs
```

### 9.4 Запуск приложения через PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Выполните команду, которую покажет PM2 startup (начинается с sudo).

## 🌐 Шаг 10: Настройка Nginx

### 10.1 Создание конфигурации Nginx
```bash
sudo nano /etc/nginx/sites-available/pmrmarket.com
```

Содержимое файла:
```nginx
server {
    listen 80;
    server_name pmrmarket.com www.pmrmarket.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pmrmarket.com www.pmrmarket.com;

    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/pmrmarket.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pmrmarket.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Client max body size (for file uploads)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /favicon.ico {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

### 10.2 Активация конфигурации
```bash
sudo ln -s /etc/nginx/sites-available/pmrmarket.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Шаг 11: Настройка SSL сертификата

### 11.1 Получение SSL сертификата от Let's Encrypt
```bash
sudo certbot --nginx -d pmrmarket.com -d www.pmrmarket.com
```

### 11.2 Настройка автообновления сертификата
```bash
sudo crontab -e
```

Добавьте строку:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🤖 Шаг 12: Настройка Telegram бота

### 12.1 Настройка webhook для Telegram бота
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://pmrmarket.com/api/telegram/webhook"}'
```

## 🔄 Шаг 13: Настройка автоматических обновлений

### 13.1 Создание скрипта для деплоя
```bash
nano /home/pmrmarket/deploy.sh
```

Содержимое:
```bash
#!/bin/bash
cd /home/pmrmarket/PMR-MARKET

echo "🔄 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🗃️ Running database migrations..."
npx prisma migrate deploy

echo "🏗️ Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart pmrmarket

echo "✅ Deployment completed!"
```

### 13.2 Сделать скрипт исполняемым
```bash
chmod +x /home/pmrmarket/deploy.sh
```

## 📊 Шаг 14: Мониторинг и логи

### 14.1 Просмотр логов PM2
```bash
pm2 logs pmrmarket
```

### 14.2 Мониторинг PM2
```bash
pm2 monit
```

### 14.3 Статус сервисов
```bash
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
pm2 status
```

## 🔧 Шаг 15: Настройка резервного копирования

### 15.1 Создание скрипта резервного копирования БД
```bash
nano /home/pmrmarket/backup.sh
```

Содержимое:
```bash
#!/bin/bash
BACKUP_DIR="/home/pmrmarket/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U pmrmarket -d pmrmarket > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "✅ Backup completed: db_backup_$DATE.sql"
```

### 15.2 Настройка cron для автоматического бэкапа
```bash
chmod +x /home/pmrmarket/backup.sh
crontab -e
```

Добавьте:
```
0 2 * * * /home/pmrmarket/backup.sh
```

## 🎯 Финальная проверка

### 16.1 Проверьте, что все сервисы запущены:
```bash
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
pm2 status
```

### 16.2 Проверьте доступность сайта:
- Откройте https://pmrmarket.com
- Проверьте SSL сертификат
- Протестируйте основные функции

### 16.3 Проверьте логи на ошибки:
```bash
pm2 logs pmrmarket --lines 50
sudo tail -f /var/log/nginx/error.log
```

## 🚨 Устранение неполадок

### Если приложение не запускается:
1. Проверьте логи: `pm2 logs pmrmarket`
2. Проверьте переменные окружения в `.env`
3. Убедитесь, что база данных доступна: `psql -h localhost -U pmrmarket -d pmrmarket`

### Если сайт недоступен:
1. Проверьте статус Nginx: `sudo systemctl status nginx`
2. Проверьте конфигурацию: `sudo nginx -t`
3. Проверьте логи Nginx: `sudo tail -f /var/log/nginx/error.log`

### Если SSL не работает:
1. Проверьте сертификат: `sudo certbot certificates`
2. Обновите сертификат: `sudo certbot renew`

## 📞 Поддержка

При возникновении проблем:
- Email: pmrmarket@proton.me
- Telegram: @pmrmarketsupport

---

**🎉 Поздравляем! Ваш сайт PMR Market успешно развернут на Ubuntu Server!**

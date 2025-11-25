#!/bin/bash

# 🚀 Автоматический скрипт настройки сервера для PMR Market
# Запускать с правами sudo на Ubuntu 20.04+

set -e

echo "🚀 Начинаем настройку сервера для PMR Market..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка, что скрипт запущен с правами sudo
if [[ $EUID -eq 0 ]]; then
   print_error "Этот скрипт не должен запускаться от root. Используйте sudo для отдельных команд."
   exit 1
fi

# Шаг 1: Обновление системы
print_status "Обновляем систему..."
sudo apt update && sudo apt upgrade -y

# Шаг 2: Установка основных пакетов
print_status "Устанавливаем основные пакеты..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw build-essential

# Шаг 3: Настройка файрвола
print_status "Настраиваем файрвол..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable

# Шаг 4: Установка Node.js 20.x
print_status "Устанавливаем Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии Node.js
NODE_VERSION=$(node --version)
print_status "Установлена версия Node.js: $NODE_VERSION"

# Шаг 5: Установка PostgreSQL
print_status "Устанавливаем PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Шаг 6: Установка Redis
print_status "Устанавливаем Redis..."
sudo apt install -y redis-server

# Настройка Redis
sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Шаг 7: Установка PM2 глобально
print_status "Устанавливаем PM2..."
sudo npm install -g pm2

# Шаг 8: Создание пользователя для приложения
print_status "Создаем пользователя pmrmarket..."
if id "pmrmarket" &>/dev/null; then
    print_warning "Пользователь pmrmarket уже существует"
else
    sudo adduser --disabled-password --gecos "" pmrmarket
    sudo usermod -aG sudo pmrmarket
fi

# Шаг 9: Создание директорий
print_status "Создаем необходимые директории..."
sudo -u pmrmarket mkdir -p /home/pmrmarket/logs
sudo -u pmrmarket mkdir -p /home/pmrmarket/backups

# Шаг 10: Настройка PostgreSQL
print_status "Настраиваем PostgreSQL..."
read -p "Введите пароль для пользователя базы данных pmrmarket: " DB_PASSWORD

sudo -u postgres psql << EOF
CREATE DATABASE pmrmarket;
CREATE USER pmrmarket WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE pmrmarket TO pmrmarket;
ALTER USER pmrmarket CREATEDB;
\q
EOF

# Добавление настройки в pg_hba.conf
sudo bash -c 'echo "local   pmrmarket    pmrmarket                     md5" >> /etc/postgresql/*/main/pg_hba.conf'
sudo systemctl restart postgresql

# Шаг 11: Создание базового .env файла
print_status "Создаем базовый .env файл..."
sudo -u pmrmarket tee /home/pmrmarket/.env.template << EOF
# Database
DATABASE_URL="postgresql://pmrmarket:$DB_PASSWORD@localhost:5432/pmrmarket"

# NextAuth
NEXTAUTH_URL="https://pmrmarket.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Google OAuth (нужно заполнить)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Cloudinary (нужно заполнить)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Email (нужно заполнить)
EMAIL_FROM="pmrmarket@proton.me"
EMAIL_HOST="mail.proton.me"
EMAIL_PORT="587"
EMAIL_USER="pmrmarket@proton.me"
EMAIL_PASS="your_email_password"

# Telegram Bot (нужно заполнить)
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

# Redis
REDIS_URL="redis://localhost:6379"

# Environment
NODE_ENV="production"
EOF

# Шаг 12: Создание скрипта деплоя
print_status "Создаем скрипт деплоя..."
sudo -u pmrmarket tee /home/pmrmarket/deploy.sh << 'EOF'
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
EOF

sudo chmod +x /home/pmrmarket/deploy.sh

# Шаг 13: Создание скрипта резервного копирования
print_status "Создаем скрипт резервного копирования..."
sudo -u pmrmarket tee /home/pmrmarket/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/pmrmarket/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
PGPASSWORD="$DB_PASSWORD" pg_dump -h localhost -U pmrmarket -d pmrmarket > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "✅ Backup completed: db_backup_$DATE.sql"
EOF

sudo chmod +x /home/pmrmarket/backup.sh

# Шаг 14: Создание ecosystem.config.js для PM2
print_status "Создаем конфигурацию PM2..."
sudo -u pmrmarket tee /home/pmrmarket/ecosystem.config.js << 'EOF'
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
EOF

# Шаг 15: Создание конфигурации Nginx
print_status "Создаем конфигурацию Nginx..."
sudo tee /etc/nginx/sites-available/pmrmarket.com << 'EOF'
server {
    listen 80;
    server_name pmrmarket.com www.pmrmarket.com;

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

    # Client max body size (for file uploads)
    client_max_body_size 10M;

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
EOF

# Активация конфигурации Nginx
sudo ln -sf /etc/nginx/sites-available/pmrmarket.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

print_status "✅ Базовая настройка сервера завершена!"
print_warning "Следующие шаги нужно выполнить вручную:"
echo "1. Переключитесь на пользователя pmrmarket: sudo su - pmrmarket"
echo "2. Клонируйте репозиторий: git clone https://github.com/Akruel1/PMR-MARKET.git"
echo "3. Скопируйте и настройте .env файл: cp .env.template PMR-MARKET/.env"
echo "4. Заполните все необходимые переменные в .env файле"
echo "5. Перейдите в директорию проекта и установите зависимости"
echo "6. Запустите приложение через PM2"
echo "7. Настройте SSL сертификат с помощью certbot"
echo ""
print_status "Подробные инструкции смотрите в DEPLOYMENT_GUIDE.md"
EOF

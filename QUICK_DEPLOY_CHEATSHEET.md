# 🚀 Быстрая шпаргалка по развертыванию PMR Market

## 📋 Краткий чек-лист

### 1. Подготовка сервера (5 минут)
```bash
# Если есть проблемы с репозиториями, сначала исправить их
chmod +x scripts/fix-repositories.sh
./scripts/fix-repositories.sh

# Запустить автоматический скрипт настройки
chmod +x scripts/server-setup.sh
./scripts/server-setup.sh
```

### 2. Настройка приложения (10 минут)
```bash
# Переключиться на пользователя приложения
sudo su - pmrmarket

# Клонировать репозиторий
git clone https://github.com/Akruel1/PMR-MARKET.git
cd PMR-MARKET

# Настроить переменные окружения
cp ../.env.template .env
nano .env  # Заполнить все переменные

# Установить зависимости
npm install

# Настроить базу данных
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Собрать приложение
npm run build
```

### 3. Запуск приложения (2 минуты)
```bash
# Запустить через PM2
pm2 start ../ecosystem.config.js
pm2 save
pm2 startup  # Выполнить команду, которую покажет PM2
```

### 4. Настройка SSL (3 минуты)
```bash
# Получить SSL сертификат
sudo certbot --nginx -d pmrmarket.com -d www.pmrmarket.com
```

### 5. Настройка Telegram бота (1 минута)
```bash
# Установить webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://pmrmarket.com/api/telegram/webhook"}'
```

## 🔧 Основные команды управления

### PM2 команды
```bash
pm2 status                 # Статус приложений
pm2 logs pmrmarket        # Просмотр логов
pm2 restart pmrmarket     # Перезапуск
pm2 stop pmrmarket        # Остановка
pm2 monit                 # Мониторинг
```

### Nginx команды
```bash
sudo nginx -t                    # Проверка конфигурации
sudo systemctl reload nginx     # Перезагрузка конфигурации
sudo systemctl restart nginx    # Перезапуск
sudo systemctl status nginx     # Статус
```

### База данных
```bash
# Подключение к БД
psql -h localhost -U pmrmarket -d pmrmarket

# Применение миграций
npx prisma migrate deploy

# Сброс БД (ОСТОРОЖНО!)
npx prisma migrate reset
```

### Логи и мониторинг
```bash
# Логи приложения
pm2 logs pmrmarket --lines 100

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Системные логи
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

## 🔄 Деплой обновлений

### Автоматический деплой
```bash
# Запустить скрипт деплоя
/home/pmrmarket/deploy.sh
```

### Ручной деплой
```bash
cd /home/pmrmarket/PMR-MARKET
git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 restart pmrmarket
```

## 🗄️ Резервное копирование

### Создание бэкапа
```bash
/home/pmrmarket/backup.sh
```

### Восстановление из бэкапа
```bash
psql -h localhost -U pmrmarket -d pmrmarket < /home/pmrmarket/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

## 🚨 Устранение неполадок

### Приложение не запускается
```bash
pm2 logs pmrmarket           # Проверить логи
pm2 restart pmrmarket        # Перезапустить
sudo systemctl status nginx # Проверить Nginx
```

### Проблемы с базой данных
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### Проблемы с SSL
```bash
sudo certbot certificates    # Проверить сертификаты
sudo certbot renew          # Обновить сертификаты
```

## 📊 Мониторинг производительности

### Системные ресурсы
```bash
htop                        # Мониторинг CPU/RAM
df -h                       # Использование диска
free -h                     # Использование памяти
```

### Производительность приложения
```bash
pm2 monit                   # PM2 мониторинг
curl -I https://pmrmarket.com  # Проверка ответа сервера
```

## 🔐 Безопасность

### Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### Проверка безопасности
```bash
npm audit                   # Аудит npm пакетов
npm run security-check      # Проверка безопасности проекта
```

### Файрвол
```bash
sudo ufw status             # Статус файрвола
sudo ufw reload             # Перезагрузка правил
```

## 📞 Контакты поддержки

- **Email:** pmrmarket@proton.me
- **Telegram:** @pmrmarketsupport
- **Документация:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**💡 Совет:** Сохраните эту шпаргалку в закладки для быстрого доступа к командам!

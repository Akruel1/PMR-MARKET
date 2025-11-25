#!/bin/bash

# Скрипт для создания systemd сервиса для PMR Market

SERVICE_NAME="pmrmarket"
APP_DIR="/var/www/pmrmarket"
USER="gaben"  # Замените на вашего пользователя
NODE_PATH=$(which node)

echo "🔧 Создаем systemd сервис для PMR Market..."

# Создаем файл сервиса
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=PMR Market - Next.js Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PATH=${PATH}
ExecStart=${NODE_PATH} server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Файл сервиса создан: /etc/systemd/system/${SERVICE_NAME}.service"

# Перезагружаем systemd
echo "🔄 Перезагружаем systemd daemon..."
sudo systemctl daemon-reload

# Включаем автозапуск
echo "🚀 Включаем автозапуск сервиса..."
sudo systemctl enable ${SERVICE_NAME}

echo "✅ Systemd сервис создан и настроен!"
echo ""
echo "📋 Команды для управления:"
echo "   sudo systemctl start ${SERVICE_NAME}    # Запустить"
echo "   sudo systemctl stop ${SERVICE_NAME}     # Остановить"
echo "   sudo systemctl restart ${SERVICE_NAME}  # Перезапустить"
echo "   sudo systemctl status ${SERVICE_NAME}   # Проверить статус"
echo "   sudo journalctl -u ${SERVICE_NAME} -f   # Смотреть логи"

#!/bin/bash

# Setup Telegram Webhook Script
# This script sets up the Telegram bot webhook

BOT_TOKEN="8505284403:AAEsoRTlhcJGjSoeXuZCWfp3J4Ra1hOjTaQ"
WEBHOOK_URL="${1:-}"

echo "🤖 Настройка Telegram Webhook"
echo ""

# Check if webhook URL is provided
if [ -z "$WEBHOOK_URL" ]; then
    echo "⚠️  Публичный URL не указан!"
    echo ""
    echo "Для работы webhook нужен публичный URL, так как Telegram не может отправлять запросы на localhost."
    echo ""
    echo "Варианты:"
    echo "1. Использовать ngrok (для разработки):"
    echo "   a) Запустите: npm run dev:ngrok"
    echo "   b) Скопируйте публичный URL (например: https://xxxx.ngrok-free.app)"
    echo "   c) Запустите: ./scripts/setup-telegram-webhook.sh https://xxxx.ngrok-free.app"
    echo ""
    echo "2. Использовать продакшн URL:"
    echo "   ./scripts/setup-telegram-webhook.sh https://yourdomain.com"
    echo ""
    
    # Try to get ngrok URL automatically
    echo "Попытка автоматически получить ngrok URL..."
    if command -v curl &> /dev/null; then
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1)
        if [ ! -z "$NGROK_URL" ]; then
            echo "✅ Найден ngrok URL: $NGROK_URL"
            WEBHOOK_URL="$NGROK_URL/api/telegram/webhook"
            echo "Используется: $WEBHOOK_URL"
        else
            echo "❌ Не удалось получить ngrok URL автоматически"
            echo "Убедитесь, что ngrok запущен и доступен на http://localhost:4040"
            exit 1
        fi
    else
        echo "❌ curl не установлен. Укажите URL вручную."
        exit 1
    fi
fi

# Ensure URL ends with /api/telegram/webhook
if [[ ! "$WEBHOOK_URL" == */api/telegram/webhook ]]; then
    if [[ "$WEBHOOK_URL" == */ ]]; then
        WEBHOOK_URL="${WEBHOOK_URL}api/telegram/webhook"
    else
        WEBHOOK_URL="${WEBHOOK_URL}/api/telegram/webhook"
    fi
fi

echo "📡 Настройка webhook..."
echo "   Bot Token: ${BOT_TOKEN:0:10}..."
echo "   Webhook URL: $WEBHOOK_URL"
echo ""

# Set webhook
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$WEBHOOK_URL\"}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook успешно настроен!"
    echo ""
    echo "Проверка webhook..."
    
    # Get webhook info
    INFO_RESPONSE=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
    echo "$INFO_RESPONSE" | grep -o '"url":"[^"]*' | sed 's/"url":"//'
    echo ""
else
    echo "❌ Ошибка настройки webhook:"
    echo "$RESPONSE"
    exit 1
fi

echo "🎉 Готово! Теперь бот готов к работе."
echo ""
echo "Следующие шаги:"
echo "1. Убедитесь, что сервер запущен и доступен по URL: $WEBHOOK_URL"
echo "2. Откройте бота @PMR_MARKET_BOT в Telegram"
echo "3. Отправьте команду /start"
echo ""
















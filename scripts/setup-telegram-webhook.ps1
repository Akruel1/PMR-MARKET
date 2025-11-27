# Setup Telegram Webhook Script
# This script sets up the Telegram bot webhook

param(
    [string]$BotToken = "8505284403:AAEsoRTlhcJGjSoeXuZCWfp3J4Ra1hOjTaQ",
    [string]$WebhookUrl = ""
)

Write-Host "🤖 Настройка Telegram Webhook" -ForegroundColor Green
Write-Host ""

# Check if webhook URL is provided
if ([string]::IsNullOrEmpty($WebhookUrl)) {
    Write-Host "⚠️  Публичный URL не указан!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Для работы webhook нужен публичный URL, так как Telegram не может отправлять запросы на localhost." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Варианты:" -ForegroundColor Yellow
    Write-Host "1. Использовать ngrok (для разработки):" -ForegroundColor Cyan
    Write-Host "   a) Запустите: npm run dev:ngrok" -ForegroundColor White
    Write-Host "   b) Скопируйте публичный URL (например: https://xxxx.ngrok-free.app)" -ForegroundColor White
    Write-Host "   c) Запустите этот скрипт с параметром -WebhookUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Использовать продакшн URL:" -ForegroundColor Cyan
    Write-Host "   Запустите: .\scripts\setup-telegram-webhook.ps1 -WebhookUrl 'https://yourdomain.com'" -ForegroundColor White
    Write-Host ""
    
    # Try to get ngrok URL automatically
    Write-Host "Попытка автоматически получить ngrok URL..." -ForegroundColor Yellow
    try {
        $ngrokResponse = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        if ($ngrokResponse.tunnels.Count -gt 0) {
            $ngrokUrl = $ngrokResponse.tunnels[0].public_url
            Write-Host "✅ Найден ngrok URL: $ngrokUrl" -ForegroundColor Green
            $WebhookUrl = "$ngrokUrl/api/telegram/webhook"
            Write-Host "Используется: $WebhookUrl" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Не удалось получить ngrok URL автоматически" -ForegroundColor Red
        Write-Host "Убедитесь, что ngrok запущен и доступен на http://localhost:4040" -ForegroundColor Yellow
        exit 1
    }
}

# Validate webhook URL
if ([string]::IsNullOrEmpty($WebhookUrl)) {
    Write-Host "❌ Webhook URL не может быть пустым!" -ForegroundColor Red
    exit 1
}

# Ensure URL ends with /api/telegram/webhook
if (-not $WebhookUrl.EndsWith("/api/telegram/webhook")) {
    if ($WebhookUrl.EndsWith("/")) {
        $WebhookUrl = $WebhookUrl + "api/telegram/webhook"
    } else {
        $WebhookUrl = $WebhookUrl + "/api/telegram/webhook"
    }
}

Write-Host "📡 Настройка webhook..." -ForegroundColor Green
Write-Host "   Bot Token: $($BotToken.Substring(0, 10))..." -ForegroundColor Gray
Write-Host "   Webhook URL: $WebhookUrl" -ForegroundColor Gray
Write-Host ""

# Set webhook
try {
    $body = @{
        url = $WebhookUrl
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/setWebhook" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    if ($response.ok) {
        Write-Host "✅ Webhook успешно настроен!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Проверка webhook..." -ForegroundColor Yellow
        
        # Get webhook info
        $infoResponse = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/getWebhookInfo" -ErrorAction Stop
        if ($infoResponse.ok) {
            Write-Host "   URL: $($infoResponse.result.url)" -ForegroundColor Cyan
            Write-Host "   Pending updates: $($infoResponse.result.pending_update_count)" -ForegroundColor Cyan
            if ($infoResponse.result.last_error_date) {
                Write-Host "   ⚠️  Последняя ошибка: $($infoResponse.result.last_error_message)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ Ошибка настройки webhook: $($response.description)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Ошибка при настройке webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Готово! Теперь бот готов к работе." -ForegroundColor Green
Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Убедитесь, что сервер запущен и доступен по URL: $WebhookUrl" -ForegroundColor Cyan
Write-Host "2. Откройте бота @PMR_MARKET_BOT в Telegram" -ForegroundColor Cyan
Write-Host "3. Отправьте команду /start" -ForegroundColor Cyan
Write-Host ""





















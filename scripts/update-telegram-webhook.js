#!/usr/bin/env node

const https = require('https');
const { config } = require('dotenv');

// Загружаем переменные окружения
config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || `${process.env.NEXTAUTH_URL}/api/telegram/webhook`;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ WEBHOOK_URL не может быть определен');
  process.exit(1);
}

console.log(`🔄 Обновляем webhook для бота...`);
console.log(`📡 Новый URL: ${WEBHOOK_URL}`);

// Функция для выполнения HTTP запроса
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function updateWebhook() {
  try {
    // Устанавливаем новый webhook
    const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
    const setResult = await makeRequest(setWebhookUrl, {
      url: WEBHOOK_URL,
      allowed_updates: ["message", "callback_query"]
    });

    if (setResult.ok) {
      console.log('✅ Webhook успешно обновлен!');
    } else {
      console.error('❌ Ошибка при установке webhook:', setResult.description);
      return;
    }

    // Проверяем webhook
    const getWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const getResult = await makeRequest(getWebhookUrl, {});

    if (getResult.ok) {
      console.log('\n📋 Информация о webhook:');
      console.log(`   URL: ${getResult.result.url}`);
      console.log(`   Статус: ${getResult.result.has_custom_certificate ? 'Кастомный сертификат' : 'Стандартный'}`);
      console.log(`   Ожидающие обновления: ${getResult.result.pending_update_count}`);
      
      if (getResult.result.last_error_date) {
        console.log(`   ⚠️  Последняя ошибка: ${new Date(getResult.result.last_error_date * 1000).toLocaleString()}`);
        console.log(`   ⚠️  Сообщение ошибки: ${getResult.result.last_error_message}`);
      }
    }

    console.log('\n🎉 Telegram бот готов к работе!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

updateWebhook();

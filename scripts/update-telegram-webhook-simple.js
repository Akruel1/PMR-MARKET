#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Функция для чтения .env файла
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = {};
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch (error) {
    console.error('❌ Не удалось прочитать .env файл:', error.message);
    process.exit(1);
  }
  
  return env;
}

// Загружаем переменные окружения
const env = loadEnvFile();

const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = env.TELEGRAM_WEBHOOK_URL || `${env.NEXTAUTH_URL}/api/telegram/webhook`;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ WEBHOOK_URL не может быть определен');
  console.error('   Убедитесь, что NEXTAUTH_URL указан в .env файле');
  process.exit(1);
}

console.log(`🔄 Обновляем webhook для бота...`);
console.log(`📡 Новый URL: ${WEBHOOK_URL}`);

// Функция для выполнения HTTP запроса
function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: data ? 'POST' : 'GET',
      headers: {}
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error(`Ошибка парсинга JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function updateWebhook() {
  try {
    console.log('\n1️⃣ Устанавливаем новый webhook...');
    
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

    console.log('\n2️⃣ Проверяем статус webhook...');
    
    // Проверяем webhook
    const getWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const getResult = await makeRequest(getWebhookUrl);

    if (getResult.ok) {
      console.log('\n📋 Информация о webhook:');
      console.log(`   URL: ${getResult.result.url}`);
      console.log(`   Статус: ${getResult.result.has_custom_certificate ? 'Кастомный сертификат' : 'Стандартный'}`);
      console.log(`   Ожидающие обновления: ${getResult.result.pending_update_count}`);
      
      if (getResult.result.last_error_date) {
        console.log(`   ⚠️  Последняя ошибка: ${new Date(getResult.result.last_error_date * 1000).toLocaleString()}`);
        console.log(`   ⚠️  Сообщение ошибки: ${getResult.result.last_error_message}`);
      } else {
        console.log('   ✅ Ошибок нет');
      }
    }

    console.log('\n🎉 Telegram бот готов к работе!');
    console.log('\n📝 Для тестирования:');
    console.log('   1. Найдите бота в Telegram');
    console.log('   2. Напишите /start');
    console.log('   3. Следуйте инструкциям для привязки аккаунта');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

updateWebhook();

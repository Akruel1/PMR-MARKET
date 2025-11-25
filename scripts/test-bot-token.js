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

// Функция для HTTP запроса
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Ошибка парсинга JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

async function testBotToken() {
  console.log('🔍 Тестируем токен Telegram бота...\n');
  
  const env = loadEnvFile();
  const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле');
    process.exit(1);
  }
  
  console.log(`📋 Найден токен: ${BOT_TOKEN.substring(0, 10)}...${BOT_TOKEN.substring(BOT_TOKEN.length - 5)}`);
  console.log(`📏 Длина токена: ${BOT_TOKEN.length} символов`);
  
  // Проверяем формат токена
  const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
  if (!tokenPattern.test(BOT_TOKEN)) {
    console.error('❌ Неправильный формат токена!');
    console.error('   Токен должен быть в формате: 123456789:AAA...');
    process.exit(1);
  }
  
  console.log('✅ Формат токена правильный\n');
  
  try {
    console.log('1️⃣ Проверяем информацию о боте...');
    const botInfo = await makeRequest(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    
    if (botInfo.ok) {
      console.log('✅ Бот найден!');
      console.log(`   ID: ${botInfo.result.id}`);
      console.log(`   Имя: ${botInfo.result.first_name}`);
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   Может присоединяться к группам: ${botInfo.result.can_join_groups}`);
      console.log(`   Может читать все сообщения: ${botInfo.result.can_read_all_group_messages}`);
    } else {
      console.error('❌ Ошибка получения информации о боте:', botInfo.description);
      process.exit(1);
    }
    
    console.log('\n2️⃣ Проверяем текущий webhook...');
    const webhookInfo = await makeRequest(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    
    if (webhookInfo.ok) {
      console.log('✅ Информация о webhook получена:');
      console.log(`   URL: ${webhookInfo.result.url || 'Не установлен'}`);
      console.log(`   Ожидающие обновления: ${webhookInfo.result.pending_update_count}`);
      
      if (webhookInfo.result.last_error_date) {
        console.log(`   ⚠️  Последняя ошибка: ${new Date(webhookInfo.result.last_error_date * 1000).toLocaleString()}`);
        console.log(`   ⚠️  Сообщение ошибки: ${webhookInfo.result.last_error_message}`);
      } else {
        console.log('   ✅ Ошибок нет');
      }
    } else {
      console.error('❌ Ошибка получения информации о webhook:', webhookInfo.description);
    }
    
    console.log('\n🎉 Токен бота работает правильно!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    process.exit(1);
  }
}

testBotToken();

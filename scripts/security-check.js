#!/usr/bin/env node

/**
 * Скрипт для проверки конфигурации безопасности
 */

const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения из .env файлов
function loadEnvFiles() {
  const envFiles = ['.env.local', '.env', '.env.example'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📄 Найден файл окружения: ${envFile}`);
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && !process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️  Не удалось загрузить ${envFile}: ${error.message}`);
      }
    }
  }
}

loadEnvFiles();

console.log('🔒 Проверка конфигурации безопасности PMR Market...\n');

const issues = [];
const warnings = [];

// Проверка переменных окружения
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID', 
  'GOOGLE_CLIENT_SECRET',
  'DATABASE_URL'
];

console.log('📋 Проверка переменных окружения:');
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    issues.push(`❌ Отсутствует обязательная переменная: ${envVar}`);
  } else {
    const value = process.env[envVar];
    const maskedValue = value.length > 10 ? 
      value.substring(0, 4) + '...' + value.substring(value.length - 4) : 
      '***';
    console.log(`✅ ${envVar}: ${maskedValue}`);
  }
});

// Проверяем наличие .env файлов
console.log('\n📄 Проверка файлов конфигурации:');
const envFiles = ['.env.local', '.env', '.env.example'];
let hasEnvFile = false;

envFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file}: найден`);
    hasEnvFile = true;
  }
});

if (!hasEnvFile) {
  warnings.push('⚠️  Не найдены файлы окружения (.env.local, .env)');
  console.log('💡 Создайте .env.local на основе .env.example');
}

// Проверка NEXTAUTH_SECRET
if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
  warnings.push(`⚠️  NEXTAUTH_SECRET слишком короткий (рекомендуется минимум 32 символа)`);
}

// Проверка NEXTAUTH_URL для production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXTAUTH_URL) {
    issues.push(`❌ NEXTAUTH_URL обязателен в production`);
  } else if (!process.env.NEXTAUTH_URL.startsWith('https://')) {
    issues.push(`❌ NEXTAUTH_URL должен использовать HTTPS в production`);
  }
}

console.log('\n📁 Проверка файлов безопасности:');

// Проверка наличия файлов безопасности
const securityFiles = [
  'lib/rate-limit.ts',
  'lib/security.ts', 
  'lib/sanitize.ts',
  'lib/error-handler.ts',
  'lib/csrf.ts',
  'middleware.ts'
];

securityFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file}: найден`);
  } else {
    issues.push(`❌ Отсутствует файл безопасности: ${file}`);
  }
});

console.log('\n🔍 Проверка package.json:');

// Проверка зависимостей безопасности
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const securityDeps = [
    'zod',
    'next-auth',
    '@prisma/client'
  ];
  
  securityDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep}: установлен`);
    } else {
      warnings.push(`⚠️  Рекомендуется установить: ${dep}`);
    }
  });
} catch (error) {
  issues.push(`❌ Не удалось прочитать package.json: ${error.message}`);
}

console.log('\n🛡️  Проверка middleware:');

// Проверка middleware
try {
  const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
  
  const middlewareChecks = [
    { pattern: /setSecurityHeaders/, name: 'Безопасные заголовки' },
    { pattern: /detectSuspiciousActivity/, name: 'Обнаружение подозрительной активности' },
    { pattern: /rateLimitConfigs/, name: 'Rate limiting' },
    { pattern: /csrf-token/, name: 'CSRF защита' }
  ];
  
  middlewareChecks.forEach(check => {
    if (check.pattern.test(middlewareContent)) {
      console.log(`✅ ${check.name}: активен`);
    } else {
      warnings.push(`⚠️  ${check.name}: не найден в middleware`);
    }
  });
} catch (error) {
  issues.push(`❌ Не удалось проверить middleware: ${error.message}`);
}

// Вывод результатов
console.log('\n' + '='.repeat(50));
console.log('📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ БЕЗОПАСНОСТИ');
console.log('='.repeat(50));

if (issues.length === 0 && warnings.length === 0) {
  console.log('🎉 Все проверки пройдены успешно!');
  console.log('✅ Конфигурация безопасности в порядке.');
} else {
  if (issues.length > 0) {
    console.log('\n🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
    issues.forEach(issue => console.log(issue));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  ПРЕДУПРЕЖДЕНИЯ:');
    warnings.forEach(warning => console.log(warning));
  }
  
  console.log('\n📖 Подробности в файле SECURITY.md');
}

console.log('\n' + '='.repeat(50));

// Выход с кодом ошибки если есть критические проблемы
process.exit(issues.length > 0 ? 1 : 0);

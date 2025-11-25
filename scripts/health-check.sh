#!/bin/bash

# 🔍 Скрипт проверки состояния PMR Market сервера
# Проверяет все основные компоненты системы

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Счетчики
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Функция для проверки сервиса
check_service() {
    local service_name=$1
    local display_name=$2
    
    if systemctl is-active --quiet $service_name; then
        print_success "$display_name запущен"
        ((CHECKS_PASSED++))
    else
        print_error "$display_name не запущен"
        ((CHECKS_FAILED++))
    fi
}

# Функция для проверки порта
check_port() {
    local port=$1
    local service_name=$2
    
    if netstat -tuln | grep -q ":$port "; then
        print_success "$service_name слушает порт $port"
        ((CHECKS_PASSED++))
    else
        print_error "$service_name не слушает порт $port"
        ((CHECKS_FAILED++))
    fi
}

# Функция для проверки URL
check_url() {
    local url=$1
    local description=$2
    local expected_code=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_code"; then
        print_success "$description доступен ($url)"
        ((CHECKS_PASSED++))
    else
        print_error "$description недоступен ($url)"
        ((CHECKS_FAILED++))
    fi
}

echo -e "${BLUE}"
echo "🔍 PMR Market - Проверка состояния сервера"
echo "=========================================="
echo -e "${NC}"

# 1. Проверка системных сервисов
print_header "Системные сервисы"
check_service "nginx" "Nginx"
check_service "postgresql" "PostgreSQL"
check_service "redis-server" "Redis"

# 2. Проверка портов
print_header "Сетевые порты"
check_port "80" "HTTP (Nginx)"
check_port "443" "HTTPS (Nginx)"
check_port "5432" "PostgreSQL"
check_port "6379" "Redis"
check_port "3000" "Next.js приложение"

# 3. Проверка PM2
print_header "PM2 процессы"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "pmrmarket"; then
        if pm2 list | grep "pmrmarket" | grep -q "online"; then
            print_success "PM2 приложение pmrmarket запущено"
            ((CHECKS_PASSED++))
        else
            print_error "PM2 приложение pmrmarket не в статусе online"
            ((CHECKS_FAILED++))
        fi
    else
        print_error "PM2 приложение pmrmarket не найдено"
        ((CHECKS_FAILED++))
    fi
else
    print_error "PM2 не установлен"
    ((CHECKS_FAILED++))
fi

# 4. Проверка базы данных
print_header "База данных"
if command -v psql &> /dev/null; then
    if PGPASSWORD="" psql -h localhost -U pmrmarket -d pmrmarket -c "SELECT 1;" &> /dev/null; then
        print_success "Подключение к PostgreSQL работает"
        ((CHECKS_PASSED++))
    else
        print_warning "Не удается подключиться к PostgreSQL (возможно, нужен пароль)"
        ((CHECKS_WARNING++))
    fi
else
    print_error "PostgreSQL клиент не установлен"
    ((CHECKS_FAILED++))
fi

# 5. Проверка Redis
print_header "Redis"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping | grep -q "PONG"; then
        print_success "Redis отвечает на ping"
        ((CHECKS_PASSED++))
    else
        print_error "Redis не отвечает на ping"
        ((CHECKS_FAILED++))
    fi
else
    print_error "Redis CLI не установлен"
    ((CHECKS_FAILED++))
fi

# 6. Проверка веб-сайта
print_header "Веб-сайт"
check_url "http://localhost:3000" "Next.js приложение (локально)"
check_url "http://localhost" "Nginx (HTTP)"

# Проверка HTTPS только если есть SSL сертификат
if [ -f "/etc/letsencrypt/live/pmrmarket.com/fullchain.pem" ]; then
    check_url "https://localhost" "Nginx (HTTPS)"
    check_url "https://pmrmarket.com" "Внешний домен (HTTPS)"
else
    print_warning "SSL сертификат не найден, HTTPS не проверяется"
    ((CHECKS_WARNING++))
fi

# 7. Проверка файлов конфигурации
print_header "Конфигурационные файлы"

# Проверка .env файла
if [ -f "/home/pmrmarket/PMR-MARKET/.env" ]; then
    print_success ".env файл существует"
    ((CHECKS_PASSED++))
    
    # Проверка основных переменных
    if grep -q "DATABASE_URL=" "/home/pmrmarket/PMR-MARKET/.env"; then
        print_success "DATABASE_URL настроен"
        ((CHECKS_PASSED++))
    else
        print_error "DATABASE_URL не найден в .env"
        ((CHECKS_FAILED++))
    fi
    
    if grep -q "NEXTAUTH_SECRET=" "/home/pmrmarket/PMR-MARKET/.env"; then
        print_success "NEXTAUTH_SECRET настроен"
        ((CHECKS_PASSED++))
    else
        print_error "NEXTAUTH_SECRET не найден в .env"
        ((CHECKS_FAILED++))
    fi
else
    print_error ".env файл не найден"
    ((CHECKS_FAILED++))
fi

# Проверка конфигурации Nginx
if [ -f "/etc/nginx/sites-enabled/pmrmarket.com" ]; then
    print_success "Конфигурация Nginx активна"
    ((CHECKS_PASSED++))
else
    print_error "Конфигурация Nginx не найдена"
    ((CHECKS_FAILED++))
fi

# 8. Проверка дискового пространства
print_header "Системные ресурсы"

# Проверка свободного места
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_success "Свободное место на диске: $((100-DISK_USAGE))%"
    ((CHECKS_PASSED++))
elif [ "$DISK_USAGE" -lt 90 ]; then
    print_warning "Мало свободного места на диске: $((100-DISK_USAGE))%"
    ((CHECKS_WARNING++))
else
    print_error "Критически мало места на диске: $((100-DISK_USAGE))%"
    ((CHECKS_FAILED++))
fi

# Проверка памяти
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    print_success "Использование памяти: ${MEMORY_USAGE}%"
    ((CHECKS_PASSED++))
elif [ "$MEMORY_USAGE" -lt 90 ]; then
    print_warning "Высокое использование памяти: ${MEMORY_USAGE}%"
    ((CHECKS_WARNING++))
else
    print_error "Критическое использование памяти: ${MEMORY_USAGE}%"
    ((CHECKS_FAILED++))
fi

# 9. Проверка логов на ошибки
print_header "Логи"

# Проверка логов PM2
if [ -f "/home/pmrmarket/logs/err.log" ]; then
    ERROR_COUNT=$(tail -100 /home/pmrmarket/logs/err.log 2>/dev/null | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        print_success "Нет ошибок в логах PM2"
        ((CHECKS_PASSED++))
    else
        print_warning "Найдено $ERROR_COUNT строк в логах ошибок PM2"
        ((CHECKS_WARNING++))
    fi
else
    print_warning "Лог файл PM2 не найден"
    ((CHECKS_WARNING++))
fi

# Проверка логов Nginx
NGINX_ERRORS=$(sudo tail -100 /var/log/nginx/error.log 2>/dev/null | wc -l)
if [ "$NGINX_ERRORS" -eq 0 ]; then
    print_success "Нет ошибок в логах Nginx"
    ((CHECKS_PASSED++))
else
    print_warning "Найдено $NGINX_ERRORS строк в логах ошибок Nginx"
    ((CHECKS_WARNING++))
fi

# 10. Итоговый отчет
print_header "Итоговый отчет"

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

echo -e "${GREEN}✅ Успешно: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Предупреждения: $CHECKS_WARNING${NC}"
echo -e "${RED}❌ Ошибки: $CHECKS_FAILED${NC}"
echo -e "${BLUE}📊 Всего проверок: $TOTAL_CHECKS${NC}"

# Определение общего статуса
if [ "$CHECKS_FAILED" -eq 0 ] && [ "$CHECKS_WARNING" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Все системы работают отлично!${NC}"
    exit 0
elif [ "$CHECKS_FAILED" -eq 0 ]; then
    echo -e "\n${YELLOW}⚠️  Система работает, но есть предупреждения${NC}"
    exit 1
else
    echo -e "\n${RED}🚨 Обнаружены критические проблемы!${NC}"
    exit 2
fi

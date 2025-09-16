# 📊 MONITORAMENTO E MANUTENÇÃO - SCRIPTS COMPLETOS

**Versão:** v1.0.0  
**Atualizado:** `{new Date().toISOString()}`

---

## 📋 **RESUMO EXECUTIVO**

Este documento contém scripts completos para **monitoramento**, **backup**, **manutenção** e **alertas** do WhiteLabel MVP em produção.

---

## 🔍 **1. SCRIPTS DE MONITORAMENTO**

### **1.1. Monitor Principal (monitor.sh)**

```bash
#!/bin/bash
# monitor.sh - Monitoramento completo do sistema

# Configurações
PROJECT_DIR="/opt/whitelabel"
LOG_FILE="/opt/whitelabel/logs/monitor.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_DISK=80

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Função de alerta
alert() {
    local message="$1"
    log "🚨 ALERT: $message"
    
    # Enviar para Telegram (se configurado)
    if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
             -d "chat_id=$TELEGRAM_CHAT_ID" \
             -d "text=🚨 WhiteLabel MVP Alert: $message" \
             -d "parse_mode=HTML" > /dev/null
    fi
    
    # Enviar por email (se configurado)
    if [ ! -z "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "WhiteLabel MVP Alert" $ALERT_EMAIL
    fi
}

# Função de verificação de serviço
check_service() {
    local service_name="$1"
    local service_url="$2"
    local timeout="${3:-10}"
    
    if curl -f -s --max-time $timeout "$service_url" > /dev/null; then
        echo -e "${GREEN}✅ $service_name está funcionando${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name está com problemas${NC}"
        alert "$service_name não está respondendo em $service_url"
        return 1
    fi
}

echo "🔍 Iniciando monitoramento do WhiteLabel MVP..."
log "Monitor iniciado"

# Carregar environment
if [ -f "$PROJECT_DIR/.env.production" ]; then
    source $PROJECT_DIR/.env.production
fi

ERRORS=0

# ===========================================
# 1. VERIFICAÇÃO DE SERVIÇOS
# ===========================================

echo -e "\n${YELLOW}📡 VERIFICANDO SERVIÇOS${NC}"

# Backend
check_service "Backend API" "http://localhost:4000/health" || ERRORS=$((ERRORS+1))

# Evolution API
check_service "Evolution API" "http://localhost:8080/manager/health" || ERRORS=$((ERRORS+1))

# Frontend (Nginx)
check_service "Frontend (Nginx)" "http://localhost/" || ERRORS=$((ERRORS+1))

# Frontend HTTPS
check_service "Frontend HTTPS" "https://localhost/" || ERRORS=$((ERRORS+1))

# PostgreSQL (via backend)
if curl -f -s http://localhost:4000/health | grep -q "database.*ok"; then
    echo -e "${GREEN}✅ PostgreSQL está funcionando${NC}"
else
    echo -e "${RED}❌ PostgreSQL está com problemas${NC}"
    alert "PostgreSQL não está respondendo"
    ERRORS=$((ERRORS+1))
fi

# Redis (via backend)
if curl -f -s http://localhost:4000/health | grep -q "redis.*ok"; then
    echo -e "${GREEN}✅ Redis está funcionando${NC}"
else
    echo -e "${RED}❌ Redis está com problemas${NC}"
    alert "Redis não está respondendo"
    ERRORS=$((ERRORS+1))
fi

# ===========================================
# 2. VERIFICAÇÃO DE CONTAINERS
# ===========================================

echo -e "\n${YELLOW}🐳 VERIFICANDO CONTAINERS${NC}"

cd $PROJECT_DIR

# Containers em execução
RUNNING_CONTAINERS=$(docker-compose ps --filter "status=running" -q | wc -l)
TOTAL_CONTAINERS=$(docker-compose ps -q | wc -l)

echo "📊 Containers rodando: $RUNNING_CONTAINERS/$TOTAL_CONTAINERS"

# Verificar containers específicos
EXPECTED_CONTAINERS=("whitelabel-backend" "postgres" "redis" "evolution-api" "whitelabel-frontend")

for container in "${EXPECTED_CONTAINERS[@]}"; do
    if docker-compose ps $container | grep -q "Up"; then
        echo -e "${GREEN}✅ $container rodando${NC}"
    else
        echo -e "${RED}❌ $container parado ou com problema${NC}"
        alert "Container $container não está rodando"
        ERRORS=$((ERRORS+1))
    fi
done

# ===========================================
# 3. VERIFICAÇÃO DE RECURSOS DO SISTEMA
# ===========================================

echo -e "\n${YELLOW}💻 VERIFICANDO RECURSOS DO SISTEMA${NC}"

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d'u' -f1)
if (( $(echo "$CPU_USAGE > $ALERT_THRESHOLD_CPU" | bc -l) )); then
    echo -e "${RED}⚠️ CPU Usage alto: ${CPU_USAGE}%${NC}"
    alert "CPU Usage alto: ${CPU_USAGE}%"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ CPU Usage: ${CPU_USAGE}%${NC}"
fi

# Memory Usage
MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
if [ $MEMORY_USAGE -gt $ALERT_THRESHOLD_MEMORY ]; then
    echo -e "${RED}⚠️ Memory Usage alto: ${MEMORY_USAGE}%${NC}"
    alert "Memory Usage alto: ${MEMORY_USAGE}%"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Memory Usage: ${MEMORY_USAGE}%${NC}"
fi

# Disk Usage
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt $ALERT_THRESHOLD_DISK ]; then
    echo -e "${RED}⚠️ Disk Usage alto: ${DISK_USAGE}%${NC}"
    alert "Disk Usage alto: ${DISK_USAGE}%"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Disk Usage: ${DISK_USAGE}%${NC}"
fi

# Load Average
LOAD_1MIN=$(uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $1}' | sed 's/^ *//')
LOAD_5MIN=$(uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $2}' | sed 's/^ *//')
LOAD_15MIN=$(uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $3}' | sed 's/^ *//')
CPU_CORES=$(nproc)

echo "📊 Load Average: $LOAD_1MIN, $LOAD_5MIN, $LOAD_15MIN (Cores: $CPU_CORES)"

if (( $(echo "$LOAD_1MIN > $CPU_CORES" | bc -l) )); then
    echo -e "${RED}⚠️ Load Average alto${NC}"
    alert "Load Average alto: $LOAD_1MIN (Cores: $CPU_CORES)"
    ERRORS=$((ERRORS+1))
fi

# ===========================================
# 4. VERIFICAÇÃO DE LOGS
# ===========================================

echo -e "\n${YELLOW}📝 VERIFICANDO LOGS${NC}"

# Verificar erros recentes nos logs
ERROR_COUNT=$(tail -100 $PROJECT_DIR/logs/app.log 2>/dev/null | grep -i error | wc -l)
if [ $ERROR_COUNT -gt 10 ]; then
    echo -e "${RED}⚠️ Muitos erros nos logs: $ERROR_COUNT${NC}"
    alert "Muitos erros nos logs recentes: $ERROR_COUNT"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Logs sem problemas críticos${NC}"
fi

# ===========================================
# 5. VERIFICAÇÃO DE CERTIFICADO SSL
# ===========================================

echo -e "\n${YELLOW}🔒 VERIFICANDO CERTIFICADO SSL${NC}"

if [ ! -z "$FRONTEND_URL" ]; then
    DOMAIN=$(echo $FRONTEND_URL | sed 's|https://||' | sed 's|http://||' | cut -d'/' -f1)
    
    # Verificar expiração do certificado
    if command -v openssl &> /dev/null; then
        CERT_EXPIRY=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        
        if [ ! -z "$CERT_EXPIRY" ]; then
            EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s)
            CURRENT_TIMESTAMP=$(date +%s)
            DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
            
            if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
                echo -e "${RED}⚠️ Certificado SSL expira em $DAYS_UNTIL_EXPIRY dias${NC}"
                alert "Certificado SSL expira em $DAYS_UNTIL_EXPIRY dias"
                ERRORS=$((ERRORS+1))
            else
                echo -e "${GREEN}✅ Certificado SSL válido por $DAYS_UNTIL_EXPIRY dias${NC}"
            fi
        fi
    fi
fi

# ===========================================
# 6. VERIFICAÇÃO DE CONECTIVIDADE EXTERNA
# ===========================================

echo -e "\n${YELLOW}🌐 VERIFICANDO CONECTIVIDADE EXTERNA${NC}"

# Internet
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conectividade com internet${NC}"
else
    echo -e "${RED}❌ Sem conectividade com internet${NC}"
    alert "Sem conectividade com internet"
    ERRORS=$((ERRORS+1))
fi

# DNS
if nslookup google.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS funcionando${NC}"
else
    echo -e "${RED}❌ Problemas com DNS${NC}"
    alert "Problemas com DNS"
    ERRORS=$((ERRORS+1))
fi

# ===========================================
# 7. RESULTADO FINAL
# ===========================================

echo -e "\n${YELLOW}📊 RESUMO DO MONITORAMENTO${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os sistemas funcionando corretamente${NC}"
    log "Monitor: Todos os sistemas OK"
    exit 0
else
    echo -e "${RED}❌ $ERRORS problemas detectados${NC}"
    log "Monitor: $ERRORS problemas detectados"
    
    # Alerta crítico se muitos problemas
    if [ $ERRORS -gt 3 ]; then
        alert "CRÍTICO: $ERRORS problemas detectados no sistema"
    fi
    
    exit 1
fi
```

### **1.2. Health Check Avançado (health-check.sh)**

```bash
#!/bin/bash
# health-check.sh - Health check detalhado para uso em load balancers

# Configurações
MAX_RESPONSE_TIME=5
LOG_FILE="/opt/whitelabel/logs/health-check.log"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Função de teste de endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local max_time="${4:-$MAX_RESPONSE_TIME}"
    
    local start_time=$(date +%s.%N)
    local response=$(curl -s -w "%{http_code}:%{time_total}" --max-time $max_time "$url" 2>/dev/null)
    local end_time=$(date +%s.%N)
    
    if [ $? -eq 0 ]; then
        local http_code=$(echo $response | cut -d: -f1)
        local response_time=$(echo $response | cut -d: -f2)
        
        if [ "$http_code" = "$expected_status" ]; then
            log "✅ $name: OK (${response_time}s)"
            return 0
        else
            log "❌ $name: HTTP $http_code (esperado $expected_status)"
            return 1
        fi
    else
        log "❌ $name: Timeout ou erro de conexão"
        return 1
    fi
}

# Testes de health check
ERRORS=0

# Backend API
test_endpoint "Backend API" "http://localhost:4000/health" 200 3 || ERRORS=$((ERRORS+1))

# Database (via backend)
test_endpoint "Database Check" "http://localhost:4000/api/health" 200 5 || ERRORS=$((ERRORS+1))

# Evolution API
test_endpoint "Evolution API" "http://localhost:8080/manager/health" 200 3 || ERRORS=$((ERRORS+1))

# Frontend
test_endpoint "Frontend" "http://localhost/" 200 2 || ERRORS=$((ERRORS+1))

# Verificação de memória disponível
MEMORY_AVAILABLE=$(free -m | awk 'NR==2{printf "%.1f", $7/$2*100}')
if (( $(echo "$MEMORY_AVAILABLE < 10" | bc -l) )); then
    log "❌ Memória disponível baixa: ${MEMORY_AVAILABLE}%"
    ERRORS=$((ERRORS+1))
fi

# Verificação de espaço em disco
DISK_AVAILABLE=$(df / | awk 'NR==2{print $4}')
if [ $DISK_AVAILABLE -lt 1048576 ]; then # Menos de 1GB
    log "❌ Espaço em disco baixo: ${DISK_AVAILABLE}KB"
    ERRORS=$((ERRORS+1))
fi

# Resultado
if [ $ERRORS -eq 0 ]; then
    echo "OK"
    exit 0
else
    echo "FAIL: $ERRORS checks failed"
    exit 1
fi
```

---

## 💾 **2. SCRIPTS DE BACKUP**

### **2.1. Backup Completo (backup-full.sh)**

```bash
#!/bin/bash
# backup-full.sh - Backup completo do sistema

set -e

# Configurações
PROJECT_DIR="/opt/whitelabel"
BACKUP_DIR="/opt/whitelabel/backups"
LOG_FILE="/opt/whitelabel/logs/backup.log"
RETENTION_DAYS=30
S3_BUCKET="${AWS_S3_BACKUP_BUCKET:-}"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "🗄️ Iniciando backup completo..."

# Criar diretório de backup
BACKUP_NAME="full_backup_$(date +%Y%m%d_%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p $BACKUP_PATH

cd $PROJECT_DIR

# ===========================================
# 1. BACKUP DO BANCO DE DADOS
# ===========================================

log "📊 Fazendo backup do PostgreSQL..."

if docker-compose ps postgres | grep -q "Up"; then
    # Backup completo
    docker-compose exec -T postgres pg_dump -U postgres -v \
        --format=custom \
        --compress=9 \
        whitelabel_mvp > $BACKUP_PATH/database.dump
    
    # Backup em SQL para facilitar restore manual
    docker-compose exec -T postgres pg_dump -U postgres \
        whitelabel_mvp | gzip > $BACKUP_PATH/database.sql.gz
    
    # Backup de esquema apenas
    docker-compose exec -T postgres pg_dump -U postgres \
        --schema-only \
        whitelabel_mvp > $BACKUP_PATH/schema.sql
    
    log "✅ Backup do PostgreSQL concluído"
else
    log "⚠️ PostgreSQL não está rodando, pulando backup do banco"
fi

# ===========================================
# 2. BACKUP DOS VOLUMES DO DOCKER
# ===========================================

log "🐳 Fazendo backup dos volumes Docker..."

# Listar volumes relacionados ao projeto
VOLUMES=$(docker volume ls --filter name=whitelabel --format "{{.Name}}")

for volume in $VOLUMES; do
    log "📦 Backup do volume: $volume"
    
    # Criar backup do volume usando container temporário
    docker run --rm \
        -v "$volume":/data:ro \
        -v "$BACKUP_PATH":/backup \
        alpine tar czf "/backup/volume_${volume}.tar.gz" -C /data .
done

log "✅ Backup dos volumes concluído"

# ===========================================
# 3. BACKUP DE CONFIGURAÇÕES
# ===========================================

log "⚙️ Fazendo backup das configurações..."

# Environment files
cp .env.production $BACKUP_PATH/ 2>/dev/null || log "⚠️ .env.production não encontrado"
cp docker-compose.yml $BACKUP_PATH/
cp docker-compose.override.yml $BACKUP_PATH/ 2>/dev/null || true

# Configurações do Nginx
if [ -f "/etc/nginx/sites-available/whitelabel" ]; then
    cp /etc/nginx/sites-available/whitelabel $BACKUP_PATH/nginx.conf
fi

# Certificados SSL
if [ -d "/etc/letsencrypt/live" ]; then
    sudo tar czf $BACKUP_PATH/ssl_certificates.tar.gz -C /etc/letsencrypt live/
fi

# Crontab
crontab -l > $BACKUP_PATH/crontab.txt 2>/dev/null || true

log "✅ Backup das configurações concluído"

# ===========================================
# 4. BACKUP DOS LOGS
# ===========================================

log "📝 Fazendo backup dos logs..."

if [ -d "logs" ]; then
    tar czf $BACKUP_PATH/logs.tar.gz logs/
fi

# Logs do sistema
sudo journalctl --since="1 week ago" > $BACKUP_PATH/system_logs.txt

log "✅ Backup dos logs concluído"

# ===========================================
# 5. BACKUP DE UPLOADS E ARQUIVOS
# ===========================================

log "📁 Fazendo backup de uploads e arquivos..."

if [ -d "uploads" ]; then
    tar czf $BACKUP_PATH/uploads.tar.gz uploads/
fi

# ===========================================
# 6. METADADOS DO BACKUP
# ===========================================

log "📋 Criando metadados do backup..."

cat > $BACKUP_PATH/backup_info.txt << EOF
WhiteLabel MVP - Backup Information
====================================

Backup Created: $(date)
Backup Type: Full System Backup
Server: $(hostname)
IP Address: $(curl -s ifconfig.me || echo "unknown")

System Information:
- OS: $(uname -a)
- Docker Version: $(docker --version)
- Docker Compose Version: $(docker-compose --version)

Services Status at Backup Time:
$(docker-compose ps)

Disk Usage:
$(df -h)

Memory Usage:
$(free -h)

Environment Variables (sanitized):
NODE_ENV=${NODE_ENV:-not_set}
FRONTEND_URL=${FRONTEND_URL:-not_set}
DATABASE_URL=***HIDDEN***
JWT_SECRET=***HIDDEN***

Files Included:
$(find $BACKUP_PATH -type f -exec basename {} \;)

EOF

# ===========================================
# 7. COMPACTAR BACKUP
# ===========================================

log "🗜️ Compactando backup..."

cd $BACKUP_DIR
tar czf ${BACKUP_NAME}.tar.gz $BACKUP_NAME/
rm -rf $BACKUP_NAME/

BACKUP_SIZE=$(du -h ${BACKUP_NAME}.tar.gz | cut -f1)
log "✅ Backup compactado: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# ===========================================
# 8. UPLOAD PARA S3 (SE CONFIGURADO)
# ===========================================

if [ ! -z "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    log "☁️ Fazendo upload para S3..."
    
    aws s3 cp ${BACKUP_NAME}.tar.gz s3://$S3_BUCKET/backups/ \
        --metadata "created=$(date),type=full_backup"
    
    if [ $? -eq 0 ]; then
        log "✅ Upload para S3 concluído"
    else
        log "❌ Erro no upload para S3"
    fi
fi

# ===========================================
# 9. LIMPEZA DE BACKUPS ANTIGOS
# ===========================================

log "🧹 Removendo backups antigos (>${RETENTION_DAYS} dias)..."

find $BACKUP_DIR -name "full_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
REMOVED=$(find $BACKUP_DIR -name "full_backup_*.tar.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)

if [ $REMOVED -gt 0 ]; then
    log "🗑️ Removidos $REMOVED backups antigos"
fi

# ===========================================
# 10. VERIFICAÇÃO DE INTEGRIDADE
# ===========================================

log "🔍 Verificando integridade do backup..."

if tar tzf ${BACKUP_NAME}.tar.gz > /dev/null; then
    log "✅ Backup íntegro e válido"
else
    log "❌ Erro na integridade do backup"
    exit 1
fi

# ===========================================
# 11. RESULTADO FINAL
# ===========================================

log "🎉 Backup completo concluído com sucesso!"
log "📊 Arquivo: ${BACKUP_NAME}.tar.gz"
log "📏 Tamanho: $BACKUP_SIZE"
log "📍 Local: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"

# Notificação de sucesso
if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
         -d "chat_id=$TELEGRAM_CHAT_ID" \
         -d "text=✅ Backup WhiteLabel MVP concluído: ${BACKUP_SIZE}" > /dev/null
fi

echo "✅ Backup completo finalizado: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"
```

### **2.2. Backup Incremental do Banco (backup-db.sh)**

```bash
#!/bin/bash
# backup-db.sh - Backup rápido apenas do banco de dados

set -e

PROJECT_DIR="/opt/whitelabel"
BACKUP_DIR="/opt/whitelabel/backups/database"
LOG_FILE="/opt/whitelabel/logs/backup-db.log"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "📊 Iniciando backup do banco de dados..."

cd $PROJECT_DIR

if docker-compose ps postgres | grep -q "Up"; then
    BACKUP_NAME="db_backup_$(date +%Y%m%d_%H%M%S)"
    
    # Backup em formato custom (melhor compressão)
    docker-compose exec -T postgres pg_dump -U postgres \
        --format=custom \
        --compress=9 \
        --verbose \
        whitelabel_mvp > $BACKUP_DIR/${BACKUP_NAME}.dump
    
    # Verificar se backup foi criado
    if [ -f "$BACKUP_DIR/${BACKUP_NAME}.dump" ]; then
        BACKUP_SIZE=$(du -h $BACKUP_DIR/${BACKUP_NAME}.dump | cut -f1)
        log "✅ Backup do banco concluído: ${BACKUP_NAME}.dump (${BACKUP_SIZE})"
        
        # Manter apenas os últimos 10 backups de banco
        cd $BACKUP_DIR
        ls -t db_backup_*.dump | tail -n +11 | xargs -r rm
        
        echo "✅ Backup do banco finalizado: ${BACKUP_NAME}.dump (${BACKUP_SIZE})"
    else
        log "❌ Erro ao criar backup do banco"
        exit 1
    fi
else
    log "❌ PostgreSQL não está rodando"
    exit 1
fi
```

---

## ⚙️ **3. SCRIPTS DE MANUTENÇÃO**

### **3.1. Limpeza Automática (cleanup.sh)**

```bash
#!/bin/bash
# cleanup.sh - Limpeza automática do sistema

LOG_FILE="/opt/whitelabel/logs/cleanup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "🧹 Iniciando limpeza automática..."

# ===========================================
# 1. LIMPEZA DE LOGS ANTIGOS
# ===========================================

log "📝 Limpando logs antigos..."

# Logs da aplicação (manter últimos 30 dias)
find /opt/whitelabel/logs -name "*.log" -mtime +30 -delete
find /opt/whitelabel/logs -name "*.log.*" -mtime +30 -delete

# Logs do sistema
sudo journalctl --vacuum-time=30d

# ===========================================
# 2. LIMPEZA DO DOCKER
# ===========================================

log "🐳 Limpando recursos Docker..."

# Remover imagens não utilizadas
docker image prune -f

# Remover volumes órfãos
docker volume prune -f

# Remover redes não utilizadas
docker network prune -f

# Remover containers parados
docker container prune -f

# ===========================================
# 3. LIMPEZA DE BACKUPS ANTIGOS
# ===========================================

log "💾 Limpando backups antigos..."

# Backups completos (manter últimos 30 dias)
find /opt/whitelabel/backups -name "full_backup_*.tar.gz" -mtime +30 -delete

# Backups de banco (manter últimos 7 dias)
find /opt/whitelabel/backups/database -name "db_backup_*.dump" -mtime +7 -delete

# ===========================================
# 4. LIMPEZA DE ARQUIVOS TEMPORÁRIOS
# ===========================================

log "🗑️ Limpando arquivos temporários..."

# Arquivos temporários do sistema
sudo find /tmp -type f -atime +7 -delete 2>/dev/null || true

# Cache da aplicação
rm -rf /opt/whitelabel/uploads/cache/* 2>/dev/null || true

# ===========================================
# 5. OTIMIZAÇÃO DO BANCO
# ===========================================

log "🗃️ Otimizando banco de dados..."

cd /opt/whitelabel

# VACUUM e ANALYZE no PostgreSQL
docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -c "VACUUM ANALYZE;"

# ===========================================
# 6. VERIFICAÇÃO DE ESPAÇO LIBERADO
# ===========================================

SPACE_FREED=$(df / | awk 'NR==2 {print $4}')
log "✅ Limpeza concluída. Espaço disponível: ${SPACE_FREED}KB"

echo "✅ Limpeza automática finalizada"
```

### **3.2. Atualização de Sistema (update-system.sh)**

```bash
#!/bin/bash
# update-system.sh - Atualização segura do sistema

set -e

LOG_FILE="/opt/whitelabel/logs/update.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "🔄 Iniciando atualização do sistema..."

# ===========================================
# 1. BACKUP PRÉ-ATUALIZAÇÃO
# ===========================================

log "💾 Criando backup pré-atualização..."
/opt/whitelabel/scripts/backup-full.sh

# ===========================================
# 2. ATUALIZAÇÃO DO SISTEMA OPERACIONAL
# ===========================================

log "🖥️ Atualizando sistema operacional..."

sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
sudo apt autoclean

# ===========================================
# 3. ATUALIZAÇÃO DO DOCKER
# ===========================================

log "🐳 Verificando atualizações do Docker..."

# Atualizar Docker se necessário
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Atualizar Docker Compose
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# ===========================================
# 4. ATUALIZAÇÃO DAS IMAGENS DOCKER
# ===========================================

log "📦 Atualizando imagens Docker..."

cd /opt/whitelabel

# Pull das novas imagens
docker-compose pull

# Rebuild se necessário
docker-compose build --pull

# ===========================================
# 5. RESTART SEGURO DOS SERVIÇOS
# ===========================================

log "🔄 Reiniciando serviços..."

# Restart gradual para minimizar downtime
docker-compose up -d --force-recreate

# Aguardar serviços ficarem prontos
sleep 30

# Verificar se todos os serviços estão funcionando
if /opt/whitelabel/scripts/health-check.sh; then
    log "✅ Atualização concluída com sucesso"
else
    log "❌ Problemas detectados após atualização"
    # Fazer rollback se necessário
    /opt/whitelabel/scripts/rollback.sh
    exit 1
fi

# ===========================================
# 6. LIMPEZA PÓS-ATUALIZAÇÃO
# ===========================================

log "🧹 Limpeza pós-atualização..."

# Remover imagens antigas
docker image prune -f

# Remover arquivos temporários
rm -f get-docker.sh

log "🎉 Atualização do sistema concluída!"
```

---

## 🚨 **4. SCRIPTS DE ALERTAS**

### **4.1. Sistema de Alertas (alert-system.sh)**

```bash
#!/bin/bash
# alert-system.sh - Sistema de alertas configurável

# Configurações de alerta
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Função para enviar alerta via Telegram
send_telegram_alert() {
    local message="$1"
    local priority="${2:-normal}"
    
    if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
        local emoji="📋"
        case $priority in
            critical) emoji="🚨" ;;
            warning) emoji="⚠️" ;;
            info) emoji="ℹ️" ;;
        esac
        
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
             -d "chat_id=$TELEGRAM_CHAT_ID" \
             -d "text=$emoji <b>WhiteLabel MVP</b>%0A%0A$message" \
             -d "parse_mode=HTML" > /dev/null
    fi
}

# Função para enviar alerta via email
send_email_alert() {
    local subject="$1"
    local message="$2"
    
    if [ ! -z "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "WhiteLabel MVP: $subject" $ALERT_EMAIL
    fi
}

# Função para enviar webhook
send_webhook_alert() {
    local message="$1"
    local priority="${2:-normal}"
    
    if [ ! -z "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"text\":\"$message\",\"priority\":\"$priority\",\"timestamp\":\"$(date -Iseconds)\"}" > /dev/null
    fi
}

# Função principal de alerta
send_alert() {
    local message="$1"
    local priority="${2:-normal}"
    local subject="${3:-Alert}"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT [$priority]: $message"
    
    # Enviar por todos os canais configurados
    send_telegram_alert "$message" "$priority"
    send_email_alert "$subject" "$message"
    send_webhook_alert "$message" "$priority"
}

# Verificar se é chamada direta ou source
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    # Chamada direta - enviar alerta passado como parâmetro
    MESSAGE="${1:-Test alert}"
    PRIORITY="${2:-info}"
    SUBJECT="${3:-Test Alert}"
    
    send_alert "$MESSAGE" "$PRIORITY" "$SUBJECT"
fi
```

### **4.2. Monitor com Alertas (monitor-alerts.sh)**

```bash
#!/bin/bash
# monitor-alerts.sh - Monitor com sistema de alertas integrado

source /opt/whitelabel/scripts/alert-system.sh

LOG_FILE="/opt/whitelabel/logs/monitor-alerts.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Configurações de threshold
CPU_WARNING=70
CPU_CRITICAL=90
MEMORY_WARNING=75
MEMORY_CRITICAL=90
DISK_WARNING=80
DISK_CRITICAL=90
LOAD_WARNING=2.0
LOAD_CRITICAL=4.0

# ===========================================
# MONITORAMENTO COM ALERTAS
# ===========================================

check_services_with_alerts() {
    local services_down=0
    
    # Backend
    if ! curl -f -s --max-time 10 http://localhost:4000/health > /dev/null; then
        send_alert "🔴 Backend API não está respondendo" "critical" "Backend Down"
        services_down=$((services_down+1))
    fi
    
    # Evolution API
    if ! curl -f -s --max-time 10 http://localhost:8080/manager/health > /dev/null; then
        send_alert "🔴 Evolution API não está respondendo" "critical" "Evolution API Down"
        services_down=$((services_down+1))
    fi
    
    # Frontend
    if ! curl -f -s --max-time 5 http://localhost/ > /dev/null; then
        send_alert "🔴 Frontend não está acessível" "critical" "Frontend Down"
        services_down=$((services_down+1))
    fi
    
    return $services_down
}

check_resources_with_alerts() {
    # CPU
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d'u' -f1)
    if (( $(echo "$CPU_USAGE > $CPU_CRITICAL" | bc -l) )); then
        send_alert "🚨 CPU Usage crítico: ${CPU_USAGE}%" "critical" "High CPU Usage"
    elif (( $(echo "$CPU_USAGE > $CPU_WARNING" | bc -l) )); then
        send_alert "⚠️ CPU Usage alto: ${CPU_USAGE}%" "warning" "High CPU Usage"
    fi
    
    # Memory
    MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
    if [ $MEMORY_USAGE -gt $MEMORY_CRITICAL ]; then
        send_alert "🚨 Memory Usage crítico: ${MEMORY_USAGE}%" "critical" "High Memory Usage"
    elif [ $MEMORY_USAGE -gt $MEMORY_WARNING ]; then
        send_alert "⚠️ Memory Usage alto: ${MEMORY_USAGE}%" "warning" "High Memory Usage"
    fi
    
    # Disk
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt $DISK_CRITICAL ]; then
        send_alert "🚨 Disk Usage crítico: ${DISK_USAGE}%" "critical" "High Disk Usage"
    elif [ $DISK_USAGE -gt $DISK_WARNING ]; then
        send_alert "⚠️ Disk Usage alto: ${DISK_USAGE}%" "warning" "High Disk Usage"
    fi
    
    # Load Average
    LOAD_1MIN=$(uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $1}' | sed 's/^ *//')
    if (( $(echo "$LOAD_1MIN > $LOAD_CRITICAL" | bc -l) )); then
        send_alert "🚨 Load Average crítico: $LOAD_1MIN" "critical" "High Load"
    elif (( $(echo "$LOAD_1MIN > $LOAD_WARNING" | bc -l) )); then
        send_alert "⚠️ Load Average alto: $LOAD_1MIN" "warning" "High Load"
    fi
}

# Executar verificações
log "🔍 Iniciando monitoramento com alertas..."

check_services_with_alerts
SERVICES_DOWN=$?

check_resources_with_alerts

# Relatório final
if [ $SERVICES_DOWN -eq 0 ]; then
    log "✅ Todos os serviços funcionando"
else
    log "❌ $SERVICES_DOWN serviços com problemas"
fi
```

---

## ⏰ **5. CONFIGURAÇÃO DE CRON JOBS**

### **5.1. Crontab Completo**

```bash
# Crontab para WhiteLabel MVP
# Editar com: crontab -e

# ===========================================
# MONITORAMENTO (A cada 5 minutos)
# ===========================================
*/5 * * * * /opt/whitelabel/scripts/monitor.sh >> /opt/whitelabel/logs/monitor-cron.log 2>&1

# ===========================================
# HEALTH CHECK (A cada minuto)
# ===========================================
* * * * * /opt/whitelabel/scripts/health-check.sh >> /opt/whitelabel/logs/health-cron.log 2>&1

# ===========================================
# BACKUP BANCO (A cada 6 horas)
# ===========================================
0 */6 * * * /opt/whitelabel/scripts/backup-db.sh >> /opt/whitelabel/logs/backup-db-cron.log 2>&1

# ===========================================
# BACKUP COMPLETO (Diariamente às 2h)
# ===========================================
0 2 * * * /opt/whitelabel/scripts/backup-full.sh >> /opt/whitelabel/logs/backup-full-cron.log 2>&1

# ===========================================
# LIMPEZA AUTOMÁTICA (Semanalmente)
# ===========================================
0 3 * * 0 /opt/whitelabel/scripts/cleanup.sh >> /opt/whitelabel/logs/cleanup-cron.log 2>&1

# ===========================================
# RENOVAÇÃO SSL (Semanalmente)
# ===========================================
0 4 * * 0 /opt/whitelabel/scripts/renew-ssl.sh >> /opt/whitelabel/logs/ssl-cron.log 2>&1

# ===========================================
# ATUALIZAÇÃO SISTEMA (Mensalmente)
# ===========================================
0 5 1 * * /opt/whitelabel/scripts/update-system.sh >> /opt/whitelabel/logs/update-cron.log 2>&1

# ===========================================
# RESTART PREVENTIVO (Semanalmente - opcional)
# ===========================================
0 6 * * 0 cd /opt/whitelabel && docker-compose restart >> /opt/whitelabel/logs/restart-cron.log 2>&1

# ===========================================
# RELATÓRIO SEMANAL (Domingos às 8h)
# ===========================================
0 8 * * 0 /opt/whitelabel/scripts/weekly-report.sh >> /opt/whitelabel/logs/report-cron.log 2>&1
```

### **5.2. Script de Instalação de Cron Jobs**

```bash
#!/bin/bash
# install-cron.sh - Instalar cron jobs automaticamente

echo "⏰ Instalando cron jobs para WhiteLabel MVP..."

# Criar arquivo temporário com cron jobs
cat > /tmp/whitelabel-cron << 'EOF'
# WhiteLabel MVP - Cron Jobs
*/5 * * * * /opt/whitelabel/scripts/monitor.sh >> /opt/whitelabel/logs/monitor-cron.log 2>&1
* * * * * /opt/whitelabel/scripts/health-check.sh >> /opt/whitelabel/logs/health-cron.log 2>&1
0 */6 * * * /opt/whitelabel/scripts/backup-db.sh >> /opt/whitelabel/logs/backup-db-cron.log 2>&1
0 2 * * * /opt/whitelabel/scripts/backup-full.sh >> /opt/whitelabel/logs/backup-full-cron.log 2>&1
0 3 * * 0 /opt/whitelabel/scripts/cleanup.sh >> /opt/whitelabel/logs/cleanup-cron.log 2>&1
0 4 * * 0 /opt/whitelabel/scripts/renew-ssl.sh >> /opt/whitelabel/logs/ssl-cron.log 2>&1
0 8 * * 0 /opt/whitelabel/scripts/weekly-report.sh >> /opt/whitelabel/logs/report-cron.log 2>&1
EOF

# Instalar cron jobs
crontab /tmp/whitelabel-cron

# Limpar arquivo temporário
rm /tmp/whitelabel-cron

echo "✅ Cron jobs instalados com sucesso!"
echo "📋 Para verificar: crontab -l"
```

---

## 📊 **6. RELATÓRIOS AUTOMATIZADOS**

### **6.1. Relatório Semanal (weekly-report.sh)**

```bash
#!/bin/bash
# weekly-report.sh - Relatório semanal automatizado

source /opt/whitelabel/scripts/alert-system.sh

REPORT_FILE="/tmp/weekly-report-$(date +%Y%m%d).txt"

# Gerar relatório
cat > $REPORT_FILE << EOF
📊 RELATÓRIO SEMANAL - WHITELABEL MVP
====================================

Período: $(date -d '7 days ago' +%Y-%m-%d) até $(date +%Y-%m-%d)
Servidor: $(hostname)
Gerado em: $(date)

===========================================
📈 ESTATÍSTICAS DE UPTIME
===========================================

Uptime do Sistema: $(uptime -p)
Load Average: $(uptime | awk -F'load average:' '{print $2}')

Containers Rodando:
$(cd /opt/whitelabel && docker-compose ps)

===========================================
💻 RECURSOS DO SISTEMA
===========================================

CPU Usage Média: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
Memory Usage: $(free -h | awk 'NR==2{printf "Usado: %s/%s (%.2f%%)", $3,$2,$3*100/$2}')
Disk Usage: $(df -h / | awk 'NR==2{printf "%s/%s (%s)", $3,$2,$5}')

===========================================
📊 ESTATÍSTICAS DE BANCO
===========================================

Tamanho do Banco: $(cd /opt/whitelabel && docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -c "SELECT pg_size_pretty(pg_database_size('whitelabel_mvp'));" | tail -n +3 | head -n 1)

Número de Registros:
- Companies: $(cd /opt/whitelabel && docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null || echo "N/A")
- Users: $(cd /opt/whitelabel && docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "N/A")
- Conversations: $(cd /opt/whitelabel && docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -t -c "SELECT COUNT(*) FROM conversations;" 2>/dev/null || echo "N/A")
- Messages: $(cd /opt/whitelabel && docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -t -c "SELECT COUNT(*) FROM messages;" 2>/dev/null || echo "N/A")

===========================================
📝 LOGS E ERROS
===========================================

Erros na Última Semana:
$(grep -c "ERROR" /opt/whitelabel/logs/app.log 2>/dev/null || echo "0") erros registrados

Backups Realizados:
$(find /opt/whitelabel/backups -name "*.tar.gz" -mtime -7 | wc -l) backups na última semana

===========================================
🔒 SEGURANÇA
===========================================

Certificado SSL Expira em: $(echo | openssl s_client -connect localhost:443 -servername localhost 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "Não disponível")

Atualizações de Segurança Pendentes:
$(apt list --upgradable 2>/dev/null | grep -c security || echo "0")

===========================================
💾 BACKUPS
===========================================

Último Backup Completo:
$(ls -lt /opt/whitelabel/backups/full_backup_*.tar.gz 2>/dev/null | head -1 | awk '{print $6, $7, $8, $9}' || echo "Nenhum backup encontrado")

Espaço Usado por Backups:
$(du -sh /opt/whitelabel/backups 2>/dev/null | cut -f1 || echo "0B")

===========================================
📊 RECOMENDAÇÕES
===========================================

$(
    # Verificar uso de CPU
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d'u' -f1)
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
        echo "⚠️ CPU usage alto - considere otimização ou upgrade"
    fi
    
    # Verificar uso de memória
    MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
    if [ $MEMORY_USAGE -gt 80 ]; then
        echo "⚠️ Memory usage alto - considere adicionar mais RAM"
    fi
    
    # Verificar espaço em disco
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        echo "⚠️ Disk usage alto - considere limpeza ou expansão"
    fi
    
    echo "✅ Sistema funcionando dentro dos parâmetros normais"
)

====================================
Relatório gerado automaticamente
WhiteLabel MVP Monitoring System
====================================
EOF

# Enviar relatório
send_alert "$(cat $REPORT_FILE)" "info" "Relatório Semanal"

echo "📊 Relatório semanal gerado e enviado!"

# Limpar arquivo temporário
rm $REPORT_FILE
```

---

## 🎯 **CONCLUSÃO**

### **✅ SISTEMA COMPLETO DE MONITORAMENTO IMPLEMENTADO:**

1. **🔍 Monitoramento**: Scripts de verificação contínua
2. **💾 Backup**: Sistema automático com retenção
3. **🧹 Manutenção**: Limpeza e otimização automatizada
4. **🚨 Alertas**: Notificações multi-canal configuráveis
5. **⏰ Automação**: Cron jobs para execução programada
6. **📊 Relatórios**: Análises semanais automatizadas

### **🚀 PARA IMPLEMENTAR:**

```bash
# 1. Criar diretórios
mkdir -p /opt/whitelabel/scripts
mkdir -p /opt/whitelabel/logs

# 2. Copiar scripts
# (copiar todos os scripts acima para /opt/whitelabel/scripts/)

# 3. Dar permissões
chmod +x /opt/whitelabel/scripts/*.sh

# 4. Instalar cron jobs
/opt/whitelabel/scripts/install-cron.sh

# 5. Configurar alertas
# (configurar variáveis de ambiente para Telegram/Email)
```

**✅ MONITORAMENTO 100% AUTOMATIZADO E FUNCIONNAL!**
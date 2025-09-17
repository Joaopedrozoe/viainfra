#!/bin/bash

# ==========================================
# SCRIPT AUTOMÁTICO DE DEPLOY - EC2
# WhiteLabel MVP - Deploy Completo com Retry
# ==========================================

# Não usar set -e aqui, vamos tratar erros manualmente
# set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log com cores
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERRO: $1${NC}"
    save_log "ERRO: $1"
    return 1
}

# Função de erro crítico que força saída
critical_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERRO CRÍTICO: $1${NC}"
    save_log "ERRO CRÍTICO: $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ AVISO: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️ INFO: $1${NC}"
}

# Configurações
PROJECT_DIR="/opt/whitelabel"
LOG_FILE="$PROJECT_DIR/logs/deploy.log"
BACKUP_DIR="$PROJECT_DIR/backups"
MAX_RETRIES=3
RETRY_DELAY=5

# Criar diretórios se não existirem
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$BACKUP_DIR"

# Função para salvar logs
save_log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Função de retry com backoff
retry_command() {
    local command="$1"
    local description="$2"
    local max_attempts="${3:-$MAX_RETRIES}"
    local delay="${4:-$RETRY_DELAY}"
    
    for attempt in $(seq 1 $max_attempts); do
        log "Tentativa $attempt/$max_attempts: $description"
        if eval "$command"; then
            log "✅ Sucesso: $description"
            return 0
        else
            if [ $attempt -eq $max_attempts ]; then
                error "❌ Falha após $max_attempts tentativas: $description"
                return 1
            else
                warning "⚠️ Tentativa $attempt falhou, aguardando ${delay}s..."
                sleep $delay
                delay=$((delay * 2))  # Exponential backoff
            fi
        fi
    done
}

# Função para fazer backup do estado atual
backup_current_state() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "📦 Criando backup do estado atual..."
    mkdir -p "$backup_path"
    
    # Backup de configurações
    if [ -f ".env" ]; then
        cp .env "$backup_path/.env.bak"
    fi
    
    if [ -f ".deploy-config" ]; then
        cp .deploy-config "$backup_path/.deploy-config.bak"
    fi
    
    # Backup de containers em execução
    docker-compose ps > "$backup_path/containers_state.txt" 2>/dev/null || true
    
    # Backup de dados do banco (apenas estrutura para speed)
    if docker-compose ps | grep -q postgres; then
        docker-compose exec -T postgres pg_dump -U postgres -d whitelabel --schema-only > "$backup_path/schema_backup.sql" 2>/dev/null || true
    fi
    
    echo "$backup_name" > "$BACKUP_DIR/latest_backup.txt"
    log "✅ Backup criado: $backup_name"
    save_log "Backup criado: $backup_name"
}

# Função para restaurar backup em caso de falha
restore_backup() {
    local latest_backup
    if [ -f "$BACKUP_DIR/latest_backup.txt" ]; then
        latest_backup=$(cat "$BACKUP_DIR/latest_backup.txt")
        local backup_path="$BACKUP_DIR/$latest_backup"
        
        if [ -d "$backup_path" ]; then
            warning "🔄 Restaurando backup: $latest_backup"
            
            # Restaurar configurações
            if [ -f "$backup_path/.env.bak" ]; then
                cp "$backup_path/.env.bak" .env
            fi
            
            if [ -f "$backup_path/.deploy-config.bak" ]; then
                cp "$backup_path/.deploy-config.bak" .deploy-config
            fi
            
            # Tentar restaurar containers
            docker-compose down 2>/dev/null || true
            docker-compose up -d 2>/dev/null || true
            
            log "✅ Backup restaurado"
        fi
    fi
}

# Trap para capturar erros e fazer cleanup
cleanup_on_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        error "❌ Deploy falhou com código de saída $exit_code"
        save_log "Deploy falhou com código $exit_code"
        
        if [ "$RESTORE_ON_FAILURE" = "true" ]; then
            log "🔄 Iniciando restauração de backup..."
            restore_backup
        else
            warning "⚠️ Restauração de backup desabilitada (RESTORE_ON_FAILURE=false)"
        fi
    fi
    exit $exit_code
}

trap cleanup_on_exit EXIT

# Função de verificação de saúde dos serviços
check_service_health() {
    local service="$1"
    local max_wait="${2:-60}"
    local check_interval=5
    
    log "🔍 Verificando saúde do serviço: $service"
    
    for i in $(seq 1 $((max_wait / check_interval))); do
        if docker-compose ps | grep "$service" | grep -q "Up"; then
            case "$service" in
                "postgres")
                    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
                        log "✅ $service está saudável"
                        return 0
                    fi
                    ;;
                "backend")
                    if curl -f -s http://localhost:4000/health > /dev/null 2>&1; then
                        log "✅ $service está saudável"
                        return 0
                    fi
                    ;;
                *)
                    log "✅ $service está rodando"
                    return 0
                    ;;
            esac
        fi
        
        log "⏳ Aguardando $service ficar saudável... (${i}/${max_wait}s)"
        sleep $check_interval
    done
    
    warning "⚠️ $service pode não estar completamente saudável"
    return 1
}

echo -e "${BLUE}"
echo "=========================================="
echo "   🚀 WHITELABEL MVP - DEPLOY EC2       "
echo "=========================================="
echo -e "${NC}"

log "Iniciando deploy automático do WhiteLabel MVP..."
save_log "Deploy iniciado"

# Configurações do ambiente
RESTORE_ON_FAILURE="${RESTORE_ON_FAILURE:-true}"
SKIP_TESTS="${SKIP_TESTS:-false}"

log "⚙️ Configurações do deploy:"
log "   - Restaurar backup em falha: $RESTORE_ON_FAILURE"
log "   - Pular testes de validação: $SKIP_TESTS"

# Verificar se está sendo executado como root
if [ "$EUID" -eq 0 ]; then
    critical_error "Não execute este script como root! Use o usuário ubuntu."
fi

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    critical_error "Execute este script a partir do diretório raiz do projeto (/opt/whitelabel)"
fi

# ==========================================
# FASE 0: BACKUP DO ESTADO ATUAL
# ==========================================

log "💾 Fase 0: Criando backup do estado atual..."
backup_current_state

# ==========================================
# FASE 1: VERIFICAÇÕES INICIAIS
# ==========================================

log "📋 Fase 1: Verificações iniciais..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    critical_error "Docker não está instalado. Execute primeiro o setup do servidor."
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    critical_error "Docker Compose não está instalado. Execute primeiro o setup do servidor."
fi

# Verificar Nginx
if ! command -v nginx &> /dev/null; then
    critical_error "Nginx não está instalado. Execute primeiro o setup do servidor."
fi

# Verificar se o usuário está no grupo docker
if ! groups $USER | grep -q '\bdocker\b'; then
    critical_error "Usuário não está no grupo docker. Execute: sudo usermod -aG docker \$USER e reconecte."
fi

# Verificar conectividade da rede
if ! ping -c 1 google.com > /dev/null 2>&1; then
    warning "⚠️ Conectividade de rede pode estar limitada"
fi

log "✅ Verificações iniciais concluídas"

# ==========================================
# FASE 2: CONFIGURAÇÃO DE AMBIENTE
# ==========================================

log "⚙️ Fase 2: Configuração de ambiente..."

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    warning "Arquivo .env não encontrado. Criando template..."
    
    # Solicitar informações do usuário
    read -p "Digite seu domínio (ex: whitelabel.com.br): " DOMAIN
    read -p "Digite seu email para SSL: " EMAIL
    
    # Gerar secrets
    JWT_SECRET=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    EVOLUTION_KEY=$(openssl rand -hex 16)
    
    # Criar arquivo .env
    cat > .env << EOF
# WhiteLabel MVP - Production Environment
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/whitelabel_mvp
POSTGRES_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=4000
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=${EVOLUTION_KEY}
EVOLUTION_FRONTEND_URL=https://${DOMAIN}:8080
REDIS_URL=redis://redis:6379
FRONTEND_URL=https://${DOMAIN}
BACKEND_URL=https://${DOMAIN}/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOF
    
    chmod 600 .env
    log "✅ Arquivo .env criado com secrets seguros"
    
    # Salvar informações importantes
    echo "DOMAIN=$DOMAIN" > .deploy-config
    echo "EMAIL=$EMAIL" >> .deploy-config
    
else
    log "✅ Arquivo .env encontrado"
    
    # Verificar se .deploy-config existe
    if [ ! -f ".deploy-config" ]; then
        read -p "Digite seu domínio (ex: whitelabel.com.br): " DOMAIN
        read -p "Digite seu email para SSL: " EMAIL
        echo "DOMAIN=$DOMAIN" > .deploy-config
        echo "EMAIL=$EMAIL" >> .deploy-config
    else
        source .deploy-config
        log "✅ Configurações carregadas: $DOMAIN"
    fi
fi

# Criar .env.production para frontend
cat > .env.production << EOF
VITE_API_URL=https://${DOMAIN}/api
VITE_EVOLUTION_API_URL=https://${DOMAIN}/evolution
VITE_APP_ENV=production
EOF

log "✅ Configuração de ambiente concluída"

# ==========================================
# FASE 3: PREPARAÇÃO DO BANCO DE DADOS
# ==========================================

log "🗃️ Fase 3: Preparação do banco de dados..."

# Parar containers se estiverem rodando
log "🛑 Parando containers existentes..."
retry_command "docker-compose down" "Parar containers" 2 3

# Subir apenas PostgreSQL
log "🐘 Subindo PostgreSQL..."
retry_command "docker-compose up -d postgres" "Subir PostgreSQL" 3 5

# Verificar saúde do PostgreSQL
if ! check_service_health "postgres" 60; then
    critical_error "PostgreSQL não ficou saudável após 60 segundos"
fi

# Executar script de setup do banco
log "📊 Executando script de setup do banco..."
setup_db_command="docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -f /docker-entrypoint-initdb.d/init.sql"
if retry_command "$setup_db_command" "Setup do banco de dados" 2 5; then
    log "✅ Script de setup do banco executado com sucesso"
else
    warning "Script do banco pode já ter sido executado anteriormente"
fi

# Verificar tabelas com retry
verify_tables_command="docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\""
if TABLES_COUNT=$(retry_command "$verify_tables_command" "Verificar tabelas do banco" 3 2 | tr -d ' ' | tail -n1); then
    log "📋 Tabelas criadas: $TABLES_COUNT"
else
    warning "Não foi possível verificar a contagem de tabelas"
fi

# ==========================================
# FASE 4: BUILD E DEPLOY DOS SERVIÇOS
# ==========================================

log "🔨 Fase 4: Build e deploy dos serviços..."

# Build do frontend com retry
log "🎨 Fazendo build do frontend..."
retry_command "npm install" "Instalar dependências do frontend" 3 10
retry_command "npm run build" "Build do frontend" 2 15

# Build do backend (se necessário)
log "⚙️ Preparando backend..."
cd backend
retry_command "npm install" "Instalar dependências do backend" 3 10
retry_command "npm run build" "Build do backend" 2 15
cd ..

# Subir todos os serviços
log "🚁 Subindo todos os serviços..."
retry_command "docker-compose up -d" "Subir todos os serviços" 3 10

# Verificar saúde de cada serviço
log "🔍 Verificando saúde dos serviços..."
services=("postgres" "backend")
for service in "${services[@]}"; do
    if ! check_service_health "$service" 90; then
        warning "⚠️ Serviço $service pode não estar completamente saudável"
    fi
done

# Verificar status dos containers
log "📊 Status dos containers:"
docker-compose ps

# ==========================================
# FASE 5: CONFIGURAÇÃO DO NGINX
# ==========================================

log "🌐 Fase 5: Configuração do Nginx..."

# Remover configuração padrão se existir
sudo rm -f /etc/nginx/sites-enabled/default

# Criar configuração temporária (HTTP apenas)
sudo tee /etc/nginx/sites-available/whitelabel > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    location / {
        root /opt/whitelabel/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /evolution/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:4000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ativar configuração
sudo ln -sf /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/

# Copiar build do frontend para nginx
sudo cp -r dist /opt/whitelabel/
sudo chown -R www-data:www-data /opt/whitelabel/dist

# Testar e recarregar nginx
if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl reload nginx
    log "✅ Nginx configurado e recarregado"
else
    error "Erro na configuração do Nginx"
fi

# ==========================================
# FASE 6: CONFIGURAÇÃO SSL
# ==========================================

log "🔒 Fase 6: Configuração SSL/HTTPS..."

# Verificar se certificado já existe
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    log "✅ Certificado SSL já existe para ${DOMAIN}"
else
    log "🔐 Criando certificado SSL para ${DOMAIN}..."
    
    # Parar nginx temporariamente
    sudo systemctl stop nginx
    
    # Obter certificado
    if sudo certbot certonly --standalone --agree-tos --no-eff-email --email "$EMAIL" -d "$DOMAIN" -d "www.$DOMAIN" > /dev/null 2>&1; then
        log "✅ Certificado SSL criado com sucesso"
    else
        warning "Falha ao criar certificado SSL. Verifique se o domínio aponta para este servidor."
        sudo systemctl start nginx
        return
    fi
fi

# Configurar nginx com HTTPS
sudo tee /etc/nginx/sites-available/whitelabel > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=30r/s;

    # Frontend
    location / {
        root /opt/whitelabel/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        limit_req zone=general burst=20 nodelay;
    }

    # Backend API
    location /api/ {
        limit_req zone=api burst=5 nodelay;
        
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Evolution API
    location /evolution/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security: Block access to sensitive files
    location ~ /\.(env|git|htaccess|svn) {
        deny all;
        return 404;
    }

    # Logs
    access_log /var/log/nginx/whitelabel_access.log;
    error_log /var/log/nginx/whitelabel_error.log;
}
EOF

# Testar e reiniciar nginx
if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl start nginx
    sudo systemctl reload nginx
    log "✅ Nginx configurado com HTTPS"
else
    error "Erro na configuração HTTPS do Nginx"
fi

# Configurar renovação automática do SSL
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 2 * * 0 sudo certbot renew --quiet --nginx --post-hook 'systemctl reload nginx'") | crontab -
    log "✅ Renovação automática SSL configurada"
fi

# ==========================================
# FASE 7: TESTES DE VALIDAÇÃO
# ==========================================

log "🧪 Fase 7: Testes de validação..."

# Aguardar serviços estabilizarem
sleep 30

# Teste 1: Containers
RUNNING_CONTAINERS=$(docker-compose ps --services --filter "status=running" | wc -l)
TOTAL_CONTAINERS=$(docker-compose ps --services | wc -l)
log "📊 Containers rodando: $RUNNING_CONTAINERS/$TOTAL_CONTAINERS"

# Teste 2: Backend Health Check
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    log "✅ Backend Health Check: OK"
else
    warning "❌ Backend Health Check: FALHOU"
fi

# Teste 3: Evolution API
if curl -f http://localhost:8080/manager/health > /dev/null 2>&1; then
    log "✅ Evolution API Health Check: OK"
else
    warning "❌ Evolution API Health Check: FALHOU"
fi

# Teste 4: Frontend HTTPS
if curl -f -k https://localhost/ > /dev/null 2>&1; then
    log "✅ Frontend HTTPS: OK"
else
    warning "❌ Frontend HTTPS: FALHOU"
fi

# Teste 5: SSL Certificate
if echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
    log "✅ Certificado SSL: VÁLIDO"
else
    warning "❌ Certificado SSL: INVÁLIDO"
fi

# ==========================================
# FASE 8: CONFIGURAÇÕES FINAIS
# ==========================================

log "🔧 Fase 8: Configurações finais..."

# Criar script de backup
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/whitelabel/backups"
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Backup do banco
docker-compose exec -T postgres pg_dump -U postgres whitelabel_mvp | gzip > "$BACKUP_DIR/$BACKUP_NAME/database.sql.gz"

# Backup das configurações
cp .env "$BACKUP_DIR/$BACKUP_NAME/"
cp docker-compose.yml "$BACKUP_DIR/$BACKUP_NAME/"

echo "✅ Backup criado: $BACKUP_NAME"
EOF

chmod +x scripts/backup.sh

# Configurar backup automático
if ! crontab -l 2>/dev/null | grep -q "backup.sh"; then
    (crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/whitelabel && ./scripts/backup.sh") | crontab -
    log "✅ Backup automático configurado"
fi

# Criar script de monitoramento
cat > scripts/monitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="/opt/whitelabel/logs/monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Verificar containers
DOWN_CONTAINERS=$(docker-compose ps --filter "status=exited" -q | wc -l)
if [ "$DOWN_CONTAINERS" -gt 0 ]; then
    log "⚠️ $DOWN_CONTAINERS containers não estão rodando"
    docker-compose up -d
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    log "⚠️ Espaço em disco baixo: ${DISK_USAGE}%"
fi

log "✅ Monitoramento concluído"
EOF

chmod +x scripts/monitor.sh

# Configurar monitoramento automático
if ! crontab -l 2>/dev/null | grep -q "monitor.sh"; then
    (crontab -l 2>/dev/null; echo "*/5 * * * * cd /opt/whitelabel && ./scripts/monitor.sh") | crontab -
    log "✅ Monitoramento automático configurado"
fi

# ==========================================
# FINALIZAÇÃO
# ==========================================

save_log "Deploy concluído com sucesso"

echo -e "${GREEN}"
echo "=========================================="
echo "   🎉 DEPLOY CONCLUÍDO COM SUCESSO!     "
echo "=========================================="
echo -e "${NC}"

# ==========================================
# FASE FINAL: VALIDAÇÃO DO SISTEMA
# ==========================================

log "🧪 Fase Final: Validação do sistema..."

# Aguardar um pouco mais para todos os serviços estabilizarem
sleep 10

# Executar o script de teste do sistema (se não for pulado)
if [ "$SKIP_TESTS" = "true" ]; then
    warning "⚠️ Testes de validação pulados (SKIP_TESTS=true)"
    save_log "Deploy concluído - testes pulados por configuração"
else
    TEST_SCRIPT="./scripts/test-system.sh"
    if [ -f "$TEST_SCRIPT" ] && [ -x "$TEST_SCRIPT" ]; then
        log "🧪 Executando testes de validação do sistema..."
        if retry_command "$TEST_SCRIPT" "Testes de validação do sistema" 2 10; then
            log "✅ Todos os testes de validação passaram!"
            save_log "Deploy concluído com sucesso - todos os testes passaram"
        else
            warning "⚠️ Alguns testes de validação falharam, mas o deploy foi concluído"
            save_log "Deploy concluído com avisos - alguns testes falharam"
            
            echo ""
            warning "🔍 Recomendações após falhas nos testes:"
            echo "   1. Execute manualmente: $TEST_SCRIPT"
            echo "   2. Verifique os logs: docker-compose logs -f"
            echo "   3. Monitore o sistema por alguns minutos"
            echo "   4. Se necessário, execute: ./scripts/deploy-ec2.sh para tentar novamente"
        fi
    else
        warning "⚠️ Script de teste não encontrado: $TEST_SCRIPT"
        save_log "Deploy concluído - script de teste não encontrado"
    fi
fi

# ==========================================
# RESULTADO FINAL
# ==========================================

log "🌐 Frontend: https://${DOMAIN}"
log "🔌 Backend API: https://${DOMAIN}/api"
log "📱 Evolution API: https://${DOMAIN}/evolution"
log "🏥 Health Check: https://${DOMAIN}/api/health"

echo ""
log "📋 Próximos passos:"
echo "   1. Acesse https://${DOMAIN} para ver o frontend"
echo "   2. Acesse https://${DOMAIN}/evolution para configurar WhatsApp"
echo "   3. Use a Evolution API Key do arquivo .env"
echo "   4. Crie uma instância do WhatsApp e escaneie o QR Code"

echo ""
log "🔧 Comandos úteis:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Status: docker-compose ps"
echo "   - Reiniciar: docker-compose restart"
echo "   - Executar testes: $TEST_SCRIPT"
echo "   - Backup: ./scripts/backup.sh"

echo ""
log "✅ Deploy completo! Sistema pronto para uso."
save_log "Deploy finalizado com sucesso"

# Remover trap de cleanup pois o deploy foi bem-sucedido
trap - EXIT
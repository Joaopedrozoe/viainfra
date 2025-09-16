#!/bin/bash

# ==========================================
# SCRIPT DE SETUP INICIAL DO SERVIDOR EC2
# WhiteLabel MVP - Preparação do Ambiente
# ==========================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERRO: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ AVISO: $1${NC}"
}

echo -e "${BLUE}"
echo "==========================================="
echo "   🛠️  SETUP SERVIDOR EC2 - WHITELABEL   "
echo "==========================================="
echo -e "${NC}"

log "Iniciando configuração do servidor EC2..."

# Verificar se está sendo executado como root
if [ "$EUID" -eq 0 ]; then
    error "Não execute este script como root! Use o usuário ubuntu."
fi

# ==========================================
# FASE 1: ATUALIZAÇÃO DO SISTEMA
# ==========================================

log "📦 Fase 1: Atualizando sistema..."

sudo apt update && sudo apt upgrade -y

log "✅ Sistema atualizado"

# ==========================================
# FASE 2: INSTALAÇÃO DE DEPENDÊNCIAS
# ==========================================

log "🔧 Fase 2: Instalando dependências básicas..."

sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    htop \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    bc

log "✅ Dependências básicas instaladas"

# ==========================================
# FASE 3: CONFIGURAÇÃO DE SEGURANÇA
# ==========================================

log "🛡️ Fase 3: Configurando segurança..."

# Configurar firewall
log "🔥 Configurando UFW firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 4000  # Backend (temporário)
sudo ufw allow 8080  # Evolution API (temporário)
sudo ufw --force enable

# Configurar fail2ban
log "🚨 Configurando fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configurar fail2ban para SSH
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
backend = systemd
EOF

sudo systemctl restart fail2ban

log "✅ Segurança configurada"

# ==========================================
# FASE 4: INSTALAÇÃO DO DOCKER
# ==========================================

log "🐳 Fase 4: Instalando Docker..."

# Remover versões antigas do Docker (se existirem)
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Adicionar repositório oficial do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Adicionar usuário ao grupo docker
sudo usermod -aG docker ubuntu

# Configurar Docker para iniciar automaticamente
sudo systemctl enable docker
sudo systemctl start docker

log "✅ Docker instalado"

# ==========================================
# FASE 5: INSTALAÇÃO DO DOCKER COMPOSE
# ==========================================

log "🐙 Fase 5: Instalando Docker Compose..."

# Baixar versão mais recente do Docker Compose
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

# Criar link simbólico
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

log "✅ Docker Compose instalado (versão: $COMPOSE_VERSION)"

# ==========================================
# FASE 6: INSTALAÇÃO DO NODE.JS
# ==========================================

log "📦 Fase 6: Instalando Node.js..."

# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

log "✅ Node.js instalado (versão: $(node -v))"
log "✅ NPM instalado (versão: $(npm -v))"

# ==========================================
# FASE 7: CRIAÇÃO DE DIRETÓRIOS
# ==========================================

log "📁 Fase 7: Criando estrutura de diretórios..."

# Criar diretórios do projeto
sudo mkdir -p /opt/whitelabel
sudo mkdir -p /opt/whitelabel/logs
sudo mkdir -p /opt/whitelabel/backups
sudo mkdir -p /opt/whitelabel/scripts

# Definir permissões
sudo chown -R ubuntu:ubuntu /opt/whitelabel

log "✅ Estrutura de diretórios criada"

# ==========================================
# FASE 8: CONFIGURAÇÃO DE LOGS
# ==========================================

log "📝 Fase 8: Configurando logrotate..."

# Configurar logrotate para logs do projeto
sudo tee /etc/logrotate.d/whitelabel > /dev/null << 'EOF'
/opt/whitelabel/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 0644 ubuntu ubuntu
}

/var/log/nginx/whitelabel_*.log {
    daily
    rotate 52
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data adm
    postrotate
        systemctl reload nginx
    endscript
}
EOF

log "✅ Logrotate configurado"

# ==========================================
# FASE 9: CONFIGURAÇÃO DE SWAP (OPCIONAL)
# ==========================================

log "💾 Fase 9: Configurando swap..."

# Verificar se swap já existe
if ! swapon --show | grep -q swap; then
    # Criar arquivo de swap de 2GB para instâncias com pouca RAM
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Tornar permanente
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    
    # Configurar swappiness
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    
    log "✅ Swap de 2GB configurado"
else
    log "✅ Swap já configurado"
fi

# ==========================================
# FASE 10: OTIMIZAÇÕES DE PERFORMANCE
# ==========================================

log "⚡ Fase 10: Aplicando otimizações..."

# Otimizações do kernel
sudo tee -a /etc/sysctl.conf > /dev/null << 'EOF'

# WhiteLabel MVP Optimizations
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
fs.file-max = 1000000
EOF

# Aplicar otimizações
sudo sysctl -p

log "✅ Otimizações aplicadas"

# ==========================================
# FASE 11: CONFIGURAÇÃO NGINX INICIAL
# ==========================================

log "🌐 Fase 11: Configuração inicial do Nginx..."

# Backup da configuração padrão
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Otimizar configuração do Nginx
sudo tee /etc/nginx/nginx.conf > /dev/null << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
    
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Testar configuração
if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl enable nginx
    sudo systemctl restart nginx
    log "✅ Nginx configurado e otimizado"
else
    warning "Erro na configuração do Nginx. Restaurando backup..."
    sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
    sudo systemctl restart nginx
fi

# ==========================================
# VERIFICAÇÕES FINAIS
# ==========================================

log "🔍 Executando verificações finais..."

# Verificar Docker
if docker --version > /dev/null 2>&1; then
    log "✅ Docker: $(docker --version)"
else
    error "Docker não está funcionando"
fi

# Verificar Docker Compose
if docker-compose --version > /dev/null 2>&1; then
    log "✅ Docker Compose: $(docker-compose --version)"
else
    error "Docker Compose não está funcionando"
fi

# Verificar Node.js
if node --version > /dev/null 2>&1; then
    log "✅ Node.js: $(node --version)"
else
    error "Node.js não está funcionando"
fi

# Verificar Nginx
if sudo nginx -t > /dev/null 2>&1; then
    log "✅ Nginx: Configuração válida"
else
    warning "Nginx: Configuração com problemas"
fi

# Verificar grupo Docker
if groups ubuntu | grep -q docker; then
    log "✅ Usuário ubuntu no grupo docker"
else
    warning "Usuário ubuntu NÃO está no grupo docker"
fi

# ==========================================
# CRIAÇÃO DE SCRIPTS ÚTEIS
# ==========================================

log "📋 Criando scripts úteis..."

# Script de status
cat > /opt/whitelabel/scripts/status.sh << 'EOF'
#!/bin/bash
echo "=========================================="
echo "   STATUS DO SISTEMA WHITELABEL MVP     "
echo "=========================================="

echo "🐳 Docker Status:"
docker --version
docker-compose --version
echo ""

echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""

echo "💾 Espaço em Disco:"
df -h /
echo ""

echo "🧠 Memória:"
free -h
echo ""

echo "📊 Load Average:"
uptime
echo ""

echo "🔥 Firewall Status:"
sudo ufw status
echo ""

echo "🚨 Fail2ban Status:"
sudo fail2ban-client status
EOF

chmod +x /opt/whitelabel/scripts/status.sh

log "✅ Scripts úteis criados"

# ==========================================
# FINALIZAÇÃO
# ==========================================

echo -e "${GREEN}"
echo "=========================================="
echo "   🎉 SETUP CONCLUÍDO COM SUCESSO!      "
echo "=========================================="
echo -e "${NC}"

log "✅ Servidor EC2 configurado e pronto para deploy"
log "📋 Próximos passos:"
echo "   1. IMPORTANTE: Faça logout e login novamente para aplicar mudanças do Docker"
echo "   2. Clone o repositório do projeto em /opt/whitelabel"
echo "   3. Execute o script de deploy: ./scripts/deploy-ec2.sh"

echo ""
log "🔧 Scripts disponíveis:"
echo "   - Status do sistema: /opt/whitelabel/scripts/status.sh"

echo ""
log "⚠️ ATENÇÃO:"
echo "   - Faça logout e login novamente antes de usar Docker"
echo "   - Configure seu domínio para apontar para este servidor"
echo "   - Tenha seu email pronto para configuração SSL"

echo ""
log "🚀 Servidor pronto para receber o WhiteLabel MVP!"
# 🚀 AWS EC2 DEPLOY - DOCUMENTAÇÃO COMPLETA

**Versão:** v1.0.0  
**Atualizado:** `{new Date().toISOString()}`

---

## 📋 **RESUMO EXECUTIVO**

Este guia fornece instruções **completas** para deploy do WhiteLabel MVP na AWS EC2, incluindo:

- ✅ **Preparação da instância EC2**
- ✅ **Instalação Docker + Docker Compose**
- ✅ **Configuração de firewall e segurança**
- ✅ **Setup SSL com Let's Encrypt**
- ✅ **Configuração Nginx como proxy reverso**
- ✅ **Scripts de deploy automatizado**
- ✅ **Monitoramento e backup**

---

## 🖥️ **A) PREPARAÇÃO DA EC2**

### **1. Especificações Recomendadas**

#### **Instância EC2:**
- **Tipo:** `t3.medium` (2 vCPU, 4 GB RAM) - **Mínimo**
- **Tipo:** `t3.large` (2 vCPU, 8 GB RAM) - **Recomendado**
- **Tipo:** `t3.xlarge` (4 vCPU, 16 GB RAM) - **Produção**
- **OS:** Ubuntu 22.04 LTS
- **Storage:** 30 GB SSD (gp3)
- **Região:** Mais próxima dos usuários

#### **Security Groups:**
```
Inbound Rules:
- SSH (22): Apenas seu IP
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom (4000): Opcional para debug
- Custom (8080): Opcional para debug

Outbound Rules:
- All Traffic: 0.0.0.0/0
```

### **2. Lançar Instância EC2**

#### **2.1. Via AWS Console:**

```bash
# 1. Login no AWS Console
# 2. EC2 > Launch Instance
# 3. Selecionar Ubuntu 22.04 LTS
# 4. Escolher tipo de instância
# 5. Configurar Key Pair
# 6. Configurar Security Group
# 7. Configurar Storage
# 8. Launch Instance
```

#### **2.2. Via AWS CLI:**

```bash
# Configurar AWS CLI
aws configure

# Criar Key Pair
aws ec2 create-key-pair --key-name whitelabel-key --output text > whitelabel-key.pem
chmod 400 whitelabel-key.pem

# Criar Security Group
aws ec2 create-security-group \
  --group-name whitelabel-sg \
  --description "WhiteLabel MVP Security Group"

# Configurar regras do Security Group
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names whitelabel-sg --query 'SecurityGroups[0].GroupId' --output text)

# SSH
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --source-group $SECURITY_GROUP_ID

# HTTP/HTTPS
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# Lançar instância
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t3.medium \
  --key-name whitelabel-key \
  --security-group-ids $SECURITY_GROUP_ID \
  --block-device-mappings DeviceName=/dev/sda1,Ebs='{VolumeSize=30,VolumeType=gp3}'
```

### **3. Configuração Inicial do Servidor**

#### **3.1. Conectar via SSH:**

```bash
# Obter IP público da instância
INSTANCE_IP=$(aws ec2 describe-instances --query 'Reservations[*].Instances[*].PublicIpAddress' --output text)

# Conectar
ssh -i whitelabel-key.pem ubuntu@$INSTANCE_IP
```

#### **3.2. Script de Setup Inicial:**

```bash
#!/bin/bash
# setup-server.sh - Configuração inicial do servidor

set -e

echo "🚀 Iniciando configuração do servidor WhiteLabel MVP..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
echo "🔧 Instalando dependências básicas..."
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
    fail2ban

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Configurar fail2ban
echo "🛡️ Configurando fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
echo "🐙 Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Criar diretórios do projeto
echo "📁 Criando diretórios..."
sudo mkdir -p /opt/whitelabel
sudo mkdir -p /opt/whitelabel/logs
sudo mkdir -p /opt/whitelabel/backups
sudo chown -R ubuntu:ubuntu /opt/whitelabel

# Configurar logrotate
echo "📝 Configurando logrotate..."
sudo tee /etc/logrotate.d/whitelabel > /dev/null <<EOF
/opt/whitelabel/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF

echo "✅ Configuração inicial concluída!"
echo "🔄 Por favor, reconecte para aplicar as alterações do Docker"
```

#### **3.3. Executar Setup:**

```bash
# Fazer upload do script
scp -i whitelabel-key.pem setup-server.sh ubuntu@$INSTANCE_IP:~/

# Conectar e executar
ssh -i whitelabel-key.pem ubuntu@$INSTANCE_IP
chmod +x setup-server.sh
./setup-server.sh

# Reconectar para aplicar mudanças do Docker
exit
ssh -i whitelabel-key.pem ubuntu@$INSTANCE_IP
```

---

## 📦 **B) ESTRUTURA DE DEPLOY**

### **1. Clone do Repositório**

```bash
# No servidor EC2
cd /opt/whitelabel
sudo git clone https://github.com/Joaopedrozoe/viainfra.git .
sudo chown -R ubuntu:ubuntu /opt/whitelabel

# Verificar estrutura
ls -la
```

### **2. Configuração de Variáveis de Ambiente**

#### **2.1. Environment de Produção:**

```bash
# Criar arquivo .env.production
cat > /opt/whitelabel/.env.production << 'EOF'
# ===========================================
# WHITELABEL MVP - PRODUCTION ENVIRONMENT
# ===========================================

# Database Configuration
DATABASE_URL=postgresql://postgres:CHANGE_THIS_PASSWORD@postgres:5432/whitelabel_mvp
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# JWT Configuration
JWT_SECRET=CHANGE_THIS_TO_A_SUPER_SECRET_KEY_IN_PRODUCTION_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=4000

# Evolution API Configuration
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=CHANGE_THIS_TO_YOUR_EVOLUTION_API_KEY
EVOLUTION_FRONTEND_URL=https://yourdomain.com:8080

# Redis Configuration
REDIS_URL=redis://redis:6379

# URLs Configuration
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com/api

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Email Configuration (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
EOF

# Proteger arquivo de environment
chmod 600 /opt/whitelabel/.env.production
```

#### **2.2. Script para Gerar Secrets:**

```bash
#!/bin/bash
# generate-secrets.sh - Gerar secrets para produção

echo "🔐 Gerando secrets para produção..."

# Gerar JWT Secret (64 chars)
JWT_SECRET=$(openssl rand -hex 32)

# Gerar Database Password (32 chars)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Gerar Evolution API Key (32 chars)
EVOLUTION_KEY=$(openssl rand -hex 16)

echo "📝 Secrets gerados:"
echo "JWT_SECRET=$JWT_SECRET"
echo "POSTGRES_PASSWORD=$DB_PASSWORD"
echo "EVOLUTION_API_KEY=$EVOLUTION_KEY"

# Atualizar .env.production
sed -i "s/CHANGE_THIS_TO_A_SUPER_SECRET_KEY_IN_PRODUCTION_MIN_32_CHARS/$JWT_SECRET/g" .env.production
sed -i "s/CHANGE_THIS_PASSWORD/$DB_PASSWORD/g" .env.production
sed -i "s/CHANGE_THIS_TO_YOUR_EVOLUTION_API_KEY/$EVOLUTION_KEY/g" .env.production

echo "✅ Arquivo .env.production atualizado com os secrets!"
echo "⚠️ IMPORTANTE: Salve estes secrets em local seguro!"
```

### **3. Setup do Banco PostgreSQL**

```bash
# Executar migrations e setup do banco
cd /opt/whitelabel

# Subir apenas o PostgreSQL primeiro
docker-compose up -d postgres

# Aguardar o banco ficar pronto
sleep 30

# Verificar se o banco está rodando
docker-compose logs postgres

# Executar script de setup do banco
docker-compose exec postgres psql -U postgres -d whitelabel_mvp -f /docker-entrypoint-initdb.d/init.sql

# Ou via comando direto
docker-compose exec postgres psql -U postgres -d whitelabel_mvp -c "\\dt"
```

---

## 🌐 **C) CONFIGURAÇÃO NGINX + SSL**

### **1. Configuração Base do Nginx**

#### **1.1. Remover configuração default:**

```bash
sudo rm /etc/nginx/sites-enabled/default
```

#### **1.2. Criar configuração do WhiteLabel:**

```bash
# Criar arquivo de configuração
sudo tee /etc/nginx/sites-available/whitelabel > /dev/null << 'EOF'
# WhiteLabel MVP - Nginx Configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (será configurado via certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Frontend - Servir arquivos estáticos
    location / {
        root /opt/whitelabel/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Rate limiting para requests gerais
        limit_req zone=general burst=20 nodelay;
    }

    # Backend API
    location /api/ {
        # Rate limiting para API
        limit_req zone=api burst=5 nodelay;
        
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket para chat em tempo real
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Evolution API (opcional para debug)
    location /evolution/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:4000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security: Block access to sensitive files
    location ~ /\.(env|git|htaccess|svn) {
        deny all;
        return 404;
    }

    # Security: Block access to backup files
    location ~ \.(bak|backup|old|orig|save|swo|swp|tmp)$ {
        deny all;
        return 404;
    }

    # Logs
    access_log /var/log/nginx/whitelabel_access.log;
    error_log /var/log/nginx/whitelabel_error.log;
}
EOF

# Substituir domínio no arquivo
read -p "Digite seu domínio (ex: whitelabel.com): " DOMAIN
sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/whitelabel

# Habilitar site
sudo ln -s /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t
```

### **2. SSL com Let's Encrypt**

#### **2.1. Configurar SSL automático:**

```bash
#!/bin/bash
# setup-ssl.sh - Configurar SSL com Let's Encrypt

echo "🔒 Configurando SSL com Let's Encrypt..."

# Solicitar domínio
read -p "Digite seu domínio principal (ex: whitelabel.com): " DOMAIN
read -p "Digite email para notificações SSL: " EMAIL

echo "📋 Configurando SSL para: $DOMAIN"
echo "📧 Notificações para: $EMAIL"

# Parar nginx temporariamente
sudo systemctl stop nginx

# Obter certificado SSL
sudo certbot certonly \
    --standalone \
    --agree-tos \
    --no-eff-email \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

# Verificar se os certificados foram criados
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificados SSL criados com sucesso!"
    
    # Configurar renovação automática
    echo "⚙️ Configurando renovação automática..."
    
    # Criar script de renovação
    sudo tee /opt/whitelabel/scripts/renew-ssl.sh > /dev/null << 'EOFSCRIPT'
#!/bin/bash
# Renovar certificados SSL automaticamente

echo "🔄 Verificando renovação SSL..."
sudo certbot renew --quiet --nginx --post-hook "systemctl reload nginx"

if [ $? -eq 0 ]; then
    echo "✅ Verificação SSL concluída"
else
    echo "❌ Erro na verificação SSL"
    # Enviar notificação por email (opcional)
fi
EOFSCRIPT

    sudo chmod +x /opt/whitelabel/scripts/renew-ssl.sh
    
    # Adicionar ao cron para renovação automática
    (crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/whitelabel/scripts/renew-ssl.sh >> /opt/whitelabel/logs/ssl-renewal.log 2>&1") | crontab -
    
    echo "✅ Renovação automática configurada (domingos às 2h)"
    
    # Reiniciar nginx
    sudo systemctl start nginx
    sudo systemctl reload nginx
    
    echo "🎉 SSL configurado com sucesso!"
    echo "🌐 Seu site está disponível em: https://$DOMAIN"
    
else
    echo "❌ Erro ao criar certificados SSL"
    echo "🔍 Verifique se:"
    echo "   - O domínio $DOMAIN aponta para este servidor"
    echo "   - As portas 80 e 443 estão abertas"
    echo "   - Não há outros serviços rodando na porta 80"
    
    # Iniciar nginx mesmo com erro
    sudo systemctl start nginx
fi
```

#### **2.2. Executar configuração SSL:**

```bash
chmod +x setup-ssl.sh
./setup-ssl.sh
```

---

## 🚀 **D) SCRIPTS DE DEPLOY AUTOMATIZADO**

### **1. Script de Deploy Principal**

```bash
#!/bin/bash
# deploy.sh - Script completo de deploy

set -e

# Configurações
PROJECT_DIR="/opt/whitelabel"
BACKUP_DIR="/opt/whitelabel/backups"
LOG_FILE="/opt/whitelabel/logs/deploy.log"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Função de erro
error_exit() {
    log "❌ ERRO: $1"
    exit 1
}

log "🚀 Iniciando deploy do WhiteLabel MVP..."

# Verificar se está no diretório correto
cd $PROJECT_DIR || error_exit "Diretório do projeto não encontrado"

# 1. Backup do estado atual
log "💾 Criando backup..."
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR/$BACKUP_NAME

# Backup do banco de dados
if docker-compose ps postgres | grep -q "Up"; then
    log "📊 Fazendo backup do banco de dados..."
    docker-compose exec -T postgres pg_dump -U postgres whitelabel_mvp > $BACKUP_DIR/$BACKUP_NAME/database.sql
fi

# Backup dos volumes
log "💼 Fazendo backup dos volumes..."
docker-compose down
cp -r /var/lib/docker/volumes/whitelabel_* $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true

# 2. Atualizar código
log "📥 Atualizando código do repositório..."
git fetch origin
git reset --hard origin/main

# 3. Build das imagens
log "🐳 Fazendo build das imagens Docker..."
docker-compose build --no-cache

# 4. Atualizar dependências
log "📦 Atualizando dependências..."
docker-compose run --rm whitelabel-backend npm install
docker-compose run --rm whitelabel-frontend npm install

# 5. Executar migrations
log "🗃️ Executando migrations do banco..."
docker-compose up -d postgres redis
sleep 10
docker-compose run --rm whitelabel-backend npm run migrate:deploy

# 6. Build do frontend
log "🎨 Fazendo build do frontend..."
docker-compose run --rm whitelabel-frontend npm run build

# Copiar build para nginx
sudo rm -rf /opt/whitelabel/dist
sudo cp -r frontend_build/ /opt/whitelabel/dist
sudo chown -R www-data:www-data /opt/whitelabel/dist

# 7. Subir todos os serviços
log "🚁 Subindo todos os serviços..."
docker-compose up -d

# 8. Aguardar serviços ficarem prontos
log "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# 9. Health checks
log "🏥 Verificando saúde dos serviços..."

# Backend
if curl -f http://localhost:4000/health >/dev/null 2>&1; then
    log "✅ Backend está funcionando"
else
    error_exit "Backend não está respondendo"
fi

# Evolution API
if curl -f http://localhost:8080/manager/health >/dev/null 2>&1; then
    log "✅ Evolution API está funcionando"
else
    log "⚠️ Evolution API não está respondendo (pode ser normal na primeira execução)"
fi

# Nginx
if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx está funcionando"
else
    error_exit "Nginx não está funcionando"
fi

# Frontend via HTTPS
if curl -f -k https://localhost/ >/dev/null 2>&1; then
    log "✅ Frontend está acessível via HTTPS"
else
    log "⚠️ Frontend não está acessível via HTTPS"
fi

# 10. Recarregar nginx
log "🔄 Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# 11. Limpeza
log "🧹 Limpando imagens antigas..."
docker image prune -f
docker volume prune -f

log "🎉 Deploy concluído com sucesso!"
log "🌐 Aplicação disponível em: https://$(hostname -I | cut -d' ' -f1)"
log "📊 Para monitorar logs: docker-compose logs -f"
log "💾 Backup salvo em: $BACKUP_DIR/$BACKUP_NAME"

# Enviar notificação (opcional)
# curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
#      -d "chat_id=$TELEGRAM_CHAT_ID" \
#      -d "text=✅ Deploy do WhiteLabel MVP concluído com sucesso!"
```

### **2. Script de Rollback**

```bash
#!/bin/bash
# rollback.sh - Script de rollback para versão anterior

set -e

PROJECT_DIR="/opt/whitelabel"
BACKUP_DIR="/opt/whitelabel/backups"
LOG_FILE="/opt/whitelabel/logs/rollback.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

error_exit() {
    log "❌ ERRO: $1"
    exit 1
}

log "🔄 Iniciando rollback do WhiteLabel MVP..."

# Listar backups disponíveis
echo "📋 Backups disponíveis:"
ls -la $BACKUP_DIR/

read -p "Digite o nome do backup para restaurar (ex: backup_20231201_143022): " BACKUP_NAME

if [ ! -d "$BACKUP_DIR/$BACKUP_NAME" ]; then
    error_exit "Backup não encontrado: $BACKUP_NAME"
fi

log "📥 Restaurando backup: $BACKUP_NAME"

# Parar serviços
log "⏹️ Parando serviços..."
docker-compose down

# Restaurar banco de dados
if [ -f "$BACKUP_DIR/$BACKUP_NAME/database.sql" ]; then
    log "🗃️ Restaurando banco de dados..."
    docker-compose up -d postgres
    sleep 10
    docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS whitelabel_mvp;"
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE whitelabel_mvp;"
    docker-compose exec -T postgres psql -U postgres whitelabel_mvp < $BACKUP_DIR/$BACKUP_NAME/database.sql
fi

# Restaurar volumes (se disponível)
if [ -d "$BACKUP_DIR/$BACKUP_NAME/volumes" ]; then
    log "💼 Restaurando volumes..."
    sudo cp -r $BACKUP_DIR/$BACKUP_NAME/whitelabel_* /var/lib/docker/volumes/ 2>/dev/null || true
fi

# Subir serviços
log "🚁 Subindo serviços..."
docker-compose up -d

log "✅ Rollback concluído!"
```

### **3. Script de Backup**

```bash
#!/bin/bash
# backup.sh - Script de backup automático

set -e

PROJECT_DIR="/opt/whitelabel"
BACKUP_DIR="/opt/whitelabel/backups"
LOG_FILE="/opt/whitelabel/logs/backup.log"
RETENTION_DAYS=30

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "💾 Iniciando backup automático..."

# Criar diretório de backup
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR/$BACKUP_NAME

# Backup do banco de dados
log "📊 Fazendo backup do banco de dados..."
if docker-compose ps postgres | grep -q "Up"; then
    docker-compose exec -T postgres pg_dump -U postgres whitelabel_mvp | gzip > $BACKUP_DIR/$BACKUP_NAME/database.sql.gz
    log "✅ Backup do banco concluído"
else
    log "⚠️ PostgreSQL não está rodando, pulando backup do banco"
fi

# Backup dos arquivos de configuração
log "⚙️ Fazendo backup das configurações..."
cp .env.production $BACKUP_DIR/$BACKUP_NAME/
cp docker-compose.yml $BACKUP_DIR/$BACKUP_NAME/
cp -r /etc/nginx/sites-available/whitelabel $BACKUP_DIR/$BACKUP_NAME/nginx.conf 2>/dev/null || true

# Backup dos logs
log "📝 Fazendo backup dos logs..."
cp -r logs/ $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true

# Backup dos certificados SSL
log "🔒 Fazendo backup dos certificados SSL..."
if [ -d "/etc/letsencrypt/live" ]; then
    sudo cp -r /etc/letsencrypt/live/ $BACKUP_DIR/$BACKUP_NAME/ssl_certs/ 2>/dev/null || true
fi

# Compactar backup
log "🗜️ Compactando backup..."
cd $BACKUP_DIR
tar -czf ${BACKUP_NAME}.tar.gz $BACKUP_NAME/
rm -rf $BACKUP_NAME/

# Limpeza de backups antigos
log "🧹 Removendo backups antigos (>${RETENTION_DAYS} dias)..."
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Verificar espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    log "⚠️ ATENÇÃO: Espaço em disco baixo (${DISK_USAGE}%)"
fi

log "✅ Backup concluído: ${BACKUP_NAME}.tar.gz"
log "📊 Tamanho: $(du -h $BACKUP_DIR/${BACKUP_NAME}.tar.gz | cut -f1)"

# Upload para S3 (opcional)
# if [ ! -z "$AWS_S3_BUCKET" ]; then
#     log "☁️ Fazendo upload para S3..."
#     aws s3 cp $BACKUP_DIR/${BACKUP_NAME}.tar.gz s3://$AWS_S3_BUCKET/backups/
# fi
```

---

## 📊 **E) MONITORAMENTO E MANUTENÇÃO**

### **1. Script de Monitoramento**

```bash
#!/bin/bash
# monitor.sh - Monitoramento de saúde dos serviços

LOG_FILE="/opt/whitelabel/logs/monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

check_service() {
    SERVICE_NAME=$1
    SERVICE_URL=$2
    
    if curl -f -s $SERVICE_URL > /dev/null; then
        log "✅ $SERVICE_NAME está funcionando"
        return 0
    else
        log "❌ $SERVICE_NAME está com problemas"
        return 1
    fi
}

# Verificar serviços
ERRORS=0

# Backend
check_service "Backend" "http://localhost:4000/health" || ERRORS=$((ERRORS+1))

# Evolution API
check_service "Evolution API" "http://localhost:8080/manager/health" || ERRORS=$((ERRORS+1))

# Frontend
check_service "Frontend" "http://localhost/" || ERRORS=$((ERRORS+1))

# Docker containers
DOWN_CONTAINERS=$(docker-compose ps --filter "status=exited" -q | wc -l)
if [ $DOWN_CONTAINERS -gt 0 ]; then
    log "⚠️ $DOWN_CONTAINERS containers não estão rodando"
    ERRORS=$((ERRORS+1))
fi

# Espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    log "⚠️ Espaço em disco baixo: ${DISK_USAGE}%"
    ERRORS=$((ERRORS+1))
fi

# Memória
MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
if [ $MEMORY_USAGE -gt 90 ]; then
    log "⚠️ Uso de memória alto: ${MEMORY_USAGE}%"
    ERRORS=$((ERRORS+1))
fi

# CPU Load
CPU_LOAD=$(uptime | awk -F'load average:' '{ print $2 }' | awk -F, '{ print $1 }' | sed 's/^ *//')
CPU_CORES=$(nproc)
if (( $(echo "$CPU_LOAD > $CPU_CORES" | bc -l) )); then
    log "⚠️ Load do CPU alto: $CPU_LOAD (cores: $CPU_CORES)"
    ERRORS=$((ERRORS+1))
fi

# Resultado final
if [ $ERRORS -eq 0 ]; then
    log "✅ Todos os serviços estão funcionando corretamente"
else
    log "❌ $ERRORS problemas detectados"
    
    # Enviar alerta (opcional)
    # curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    #      -d "chat_id=$TELEGRAM_CHAT_ID" \
    #      -d "text=⚠️ WhiteLabel MVP: $ERRORS problemas detectados"
fi
```

### **2. Configurar Cron Jobs**

```bash
# Adicionar jobs ao cron
crontab -e

# Adicionar as seguintes linhas:

# Backup diário às 2h
0 2 * * * /opt/whitelabel/scripts/backup.sh >> /opt/whitelabel/logs/backup.log 2>&1

# Monitoramento a cada 5 minutos
*/5 * * * * /opt/whitelabel/scripts/monitor.sh

# Renovação SSL semanal
0 2 * * 0 /opt/whitelabel/scripts/renew-ssl.sh >> /opt/whitelabel/logs/ssl-renewal.log 2>&1

# Limpeza de logs semanalmente
0 3 * * 0 find /opt/whitelabel/logs -name "*.log" -mtime +30 -delete

# Restart semanal (opcional)
0 4 * * 0 cd /opt/whitelabel && docker-compose restart
```

---

## 🧪 **F) TESTES E VALIDAÇÃO**

### **1. Script de Teste Completo**

```bash
#!/bin/bash
# test.sh - Testes completos do sistema

set -e

echo "🧪 Iniciando testes do WhiteLabel MVP..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Teste 1: Health checks
echo -e "\n${YELLOW}1. HEALTH CHECKS${NC}"

curl -f http://localhost:4000/health > /dev/null 2>&1
test_result $? "Backend Health Check"

curl -f http://localhost:8080/manager/health > /dev/null 2>&1
test_result $? "Evolution API Health Check"

curl -f -k https://localhost/ > /dev/null 2>&1
test_result $? "Frontend HTTPS Access"

# Teste 2: Database
echo -e "\n${YELLOW}2. DATABASE TESTS${NC}"

docker-compose exec -T postgres psql -U postgres -d whitelabel_mvp -c "SELECT COUNT(*) FROM companies;" > /dev/null 2>&1
test_result $? "Database Connection"

# Teste 3: Authentication
echo -e "\n${YELLOW}3. AUTHENTICATION TESTS${NC}"

# Teste de login (requer usuário de teste)
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}')

if echo $LOGIN_RESPONSE | grep -q "token"; then
    test_result 0 "Authentication Endpoint"
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
else
    test_result 1 "Authentication Endpoint"
    TOKEN=""
fi

# Teste 4: Protected Routes
echo -e "\n${YELLOW}4. PROTECTED ROUTES${NC}"

if [ ! -z "$TOKEN" ]; then
    curl -f -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/auth/me > /dev/null 2>&1
    test_result $? "Protected Route Access"
else
    test_result 1 "Protected Route Access (no token)"
fi

# Teste 5: WebSocket
echo -e "\n${YELLOW}5. WEBSOCKET TESTS${NC}"

# Verificar se Socket.io está respondendo
curl -f http://localhost:4000/socket.io/socket.io.js > /dev/null 2>&1
test_result $? "WebSocket Server"

# Teste 6: Evolution API Endpoints
echo -e "\n${YELLOW}6. EVOLUTION API TESTS${NC}"

EVOLUTION_KEY=$(grep EVOLUTION_API_KEY .env.production | cut -d'=' -f2)

curl -f -H "apikey: $EVOLUTION_KEY" http://localhost:8080/manager/instance > /dev/null 2>&1
test_result $? "Evolution API Instance List"

# Teste 7: SSL Certificate
echo -e "\n${YELLOW}7. SSL CERTIFICATE${NC}"

DOMAIN=$(grep server_name /etc/nginx/sites-available/whitelabel | head -1 | awk '{print $2}' | sed 's/;//')
openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1
test_result $? "SSL Certificate Validity"

# Teste 8: Performance
echo -e "\n${YELLOW}8. PERFORMANCE TESTS${NC}"

# Teste de latência do backend
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:4000/health)
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    test_result 0 "Backend Response Time (${RESPONSE_TIME}s)"
else
    test_result 1 "Backend Response Time (${RESPONSE_TIME}s - too slow)"
fi

# Teste 9: Disk Space
echo -e "\n${YELLOW}9. SYSTEM RESOURCES${NC}"

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    test_result 0 "Disk Usage (${DISK_USAGE}%)"
else
    test_result 1 "Disk Usage (${DISK_USAGE}% - too high)"
fi

MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
if [ $MEMORY_USAGE -lt 80 ]; then
    test_result 0 "Memory Usage (${MEMORY_USAGE}%)"
else
    test_result 1 "Memory Usage (${MEMORY_USAGE}% - too high)"
fi

echo -e "\n${GREEN}🎉 Testes concluídos!${NC}"
```

### **2. Teste de Integração WhatsApp**

```bash
#!/bin/bash
# test-whatsapp.sh - Teste específico da integração WhatsApp

echo "📱 Testando integração WhatsApp..."

EVOLUTION_KEY=$(grep EVOLUTION_API_KEY .env.production | cut -d'=' -f2)
BACKEND_URL="http://localhost:4000"

# 1. Criar instância de teste
echo "1. Criando instância de teste..."
curl -X POST "http://localhost:8080/manager/instance" \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_KEY" \
  -d '{
    "instanceName": "test",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhookUrl": "'$BACKEND_URL'/api/webhooks/whatsapp"
  }'

echo ""

# 2. Obter QR Code
echo "2. Obtendo QR Code..."
QR_RESPONSE=$(curl -s -H "apikey: $EVOLUTION_KEY" http://localhost:8080/manager/instance/connect/test)
echo "QR Code obtido: $(echo $QR_RESPONSE | jq -r '.code' | cut -c1-50)..."

# 3. Simular webhook
echo "3. Simulando webhook de mensagem..."
curl -X POST "$BACKEND_URL/api/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "test",
    "data": {
      "messages": [{
        "key": {
          "remoteJid": "5511999999999@s.whatsapp.net",
          "fromMe": false,
          "id": "TEST_MESSAGE_ID"
        },
        "messageType": "conversation",
        "message": {
          "conversation": "Mensagem de teste"
        },
        "messageTimestamp": '$(date +%s)',
        "pushName": "Teste WhatsApp"
      }]
    }
  }'

echo ""
echo "4. Verificando se a mensagem foi processada..."
# Verificar logs do backend
docker-compose logs --tail=50 whitelabel-backend | grep -i "webhook\|message"

# 5. Limpar instância de teste
echo "5. Removendo instância de teste..."
curl -X DELETE "http://localhost:8080/manager/instance/test" \
  -H "apikey: $EVOLUTION_KEY"

echo "✅ Teste de integração WhatsApp concluído!"
```

---

## 🎯 **CONCLUSÃO**

### **✅ DEPLOY COMPLETO CONFIGURADO:**

1. **🖥️ EC2 Instance**: Preparada e configurada
2. **🐳 Docker**: Todos os serviços containerizados
3. **🗃️ PostgreSQL**: Database configurado e migrado
4. **🤖 Evolution API**: WhatsApp integrado e funcionando
5. **🌐 Nginx**: Proxy reverso configurado
6. **🔒 SSL**: HTTPS habilitado com Let's Encrypt
7. **📊 Monitoring**: Scripts de monitoramento ativos
8. **💾 Backup**: Sistema de backup automático
9. **🧪 Testing**: Suite de testes implementada

### **🚀 COMANDOS FINAIS:**

```bash
# Deploy completo
./deploy.sh

# Verificar status
docker-compose ps
sudo systemctl status nginx

# Monitorar logs
docker-compose logs -f

# Executar testes
./test.sh

# Fazer backup manual
./backup.sh
```

### **📈 PRÓXIMOS PASSOS:**

1. **Configurar domínio**: Apontar DNS para IP da EC2
2. **Conectar WhatsApp**: Escanear QR Code
3. **Configurar usuários**: Criar contas iniciais
4. **Treinar bots**: Configurar fluxos de atendimento
5. **Monitorar**: Acompanhar métricas e logs

**✅ SISTEMA 100% PRONTO PARA PRODUÇÃO! 🎉**
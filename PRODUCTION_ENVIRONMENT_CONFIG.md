# ⚙️ CONFIGURAÇÃO DE PRODUÇÃO - ENVIRONMENT VARIABLES

**Arquivo:** `.env.production`  
**Uso:** Configuração completa para deploy em produção

---

## 🚨 **IMPORTANTE: SEGURANÇA**

⚠️ **NUNCA** commite este arquivo para o Git  
⚠️ **SEMPRE** altere as senhas e chaves padrão  
⚠️ **PROTEJA** este arquivo com permissões adequadas (`chmod 600`)

---

## 📋 **ENVIRONMENT VARIABLES COMPLETAS**

```bash
# ===========================================
# WHITELABEL MVP - PRODUCTION ENVIRONMENT
# ===========================================

# ====================
# DATABASE CONFIGURATION
# ====================
DATABASE_URL=postgresql://postgres:CHANGE_THIS_PASSWORD@postgres:5432/whitelabel_mvp
POSTGRES_DB=whitelabel_mvp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# ====================
# JWT CONFIGURATION
# ====================
JWT_SECRET=CHANGE_THIS_TO_A_SUPER_SECRET_KEY_IN_PRODUCTION_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# ====================
# SERVER CONFIGURATION
# ====================
NODE_ENV=production
PORT=4000

# ====================
# EVOLUTION API (WHATSAPP)
# ====================
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=CHANGE_THIS_TO_YOUR_EVOLUTION_API_KEY
EVOLUTION_FRONTEND_URL=https://yourdomain.com/evolution

# ====================
# REDIS CONFIGURATION
# ====================
REDIS_URL=redis://redis:6379

# ====================
# URLS CONFIGURATION
# ====================
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
VITE_EVOLUTION_API_URL=https://yourdomain.com/evolution
VITE_APP_ENV=production

# ====================
# SECURITY & RATE LIMITING
# ====================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com

# ====================
# FILE UPLOAD
# ====================
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# ====================
# EMAIL CONFIGURATION (OPCIONAL)
# ====================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# ====================
# AWS S3 CONFIGURATION (OPCIONAL)
# ====================
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=whitelabel-uploads

# ====================
# LOGGING
# ====================
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10485760
LOG_MAX_FILES=5

# ====================
# SSL CONFIGURATION
# ====================
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# ====================
# BACKUP CONFIGURATION
# ====================
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=whitelabel-backups

# ====================
# MONITORING
# ====================
HEALTH_CHECK_INTERVAL=300000
METRICS_ENABLED=true

# ====================
# WEBHOOK CONFIGURATION
# ====================
WEBHOOK_SECRET=CHANGE_THIS_WEBHOOK_SECRET
WEBHOOK_TIMEOUT=30000

# ====================
# THIRD PARTY INTEGRATIONS
# ====================
# Telegram Bot (para notificações)
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ
TELEGRAM_CHAT_ID=-123456789

# Zapier/n8n (opcional)
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/123456/abcdef
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/whitelabel

# ====================
# DOCKER COMPOSE OVERRIDES
# ====================
COMPOSE_PROJECT_NAME=whitelabel_mvp
COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml
```

---

## 🔧 **SCRIPTS DE CONFIGURAÇÃO**

### **1. Script para Gerar Secrets**

```bash
#!/bin/bash
# generate-production-secrets.sh

echo "🔐 Gerando secrets seguros para produção..."

# Gerar JWT Secret (64 chars)
JWT_SECRET=$(openssl rand -hex 32)

# Gerar Database Password (32 chars, sem símbolos especiais)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Gerar Evolution API Key (32 chars)
EVOLUTION_KEY=$(openssl rand -hex 16)

# Gerar Webhook Secret (32 chars)
WEBHOOK_SECRET=$(openssl rand -hex 16)

echo "📝 Secrets gerados:"
echo "JWT_SECRET=$JWT_SECRET"
echo "POSTGRES_PASSWORD=$DB_PASSWORD"
echo "EVOLUTION_API_KEY=$EVOLUTION_KEY"
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET"

echo ""
echo "🔄 Deseja aplicar automaticamente ao .env.production? (y/n)"
read -r apply

if [ "$apply" = "y" ]; then
    if [ -f ".env.production" ]; then
        # Fazer backup
        cp .env.production .env.production.backup
        
        # Aplicar novos secrets
        sed -i "s/CHANGE_THIS_TO_A_SUPER_SECRET_KEY_IN_PRODUCTION_MIN_32_CHARS/$JWT_SECRET/g" .env.production
        sed -i "s/CHANGE_THIS_PASSWORD/$DB_PASSWORD/g" .env.production
        sed -i "s/CHANGE_THIS_TO_YOUR_EVOLUTION_API_KEY/$EVOLUTION_KEY/g" .env.production
        sed -i "s/CHANGE_THIS_WEBHOOK_SECRET/$WEBHOOK_SECRET/g" .env.production
        
        echo "✅ Secrets aplicados ao .env.production"
        echo "💾 Backup salvo em .env.production.backup"
    else
        echo "❌ Arquivo .env.production não encontrado"
    fi
fi

echo ""
echo "⚠️ IMPORTANTE: Salve estes secrets em local seguro!"
```

### **2. Script de Validação de Environment**

```bash
#!/bin/bash
# validate-env.sh

echo "🔍 Validando configuração de environment..."

ERRORS=0

# Verificar se arquivo existe
if [ ! -f ".env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado"
    exit 1
fi

# Carregar variáveis
source .env.production

# Função de validação
validate_var() {
    local var_name=$1
    local var_value=$2
    local default_value=$3
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name não está definida"
        ERRORS=$((ERRORS+1))
    elif [ "$var_value" = "$default_value" ]; then
        echo "⚠️ $var_name ainda tem valor padrão (INSEGURO)"
        ERRORS=$((ERRORS+1))
    else
        echo "✅ $var_name configurada"
    fi
}

# Validar variáveis críticas
echo "📋 Verificando variáveis críticas..."

validate_var "DATABASE_URL" "$DATABASE_URL" ""
validate_var "JWT_SECRET" "$JWT_SECRET" "CHANGE_THIS_TO_A_SUPER_SECRET_KEY_IN_PRODUCTION_MIN_32_CHARS"
validate_var "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD" "CHANGE_THIS_PASSWORD"
validate_var "EVOLUTION_API_KEY" "$EVOLUTION_API_KEY" "CHANGE_THIS_TO_YOUR_EVOLUTION_API_KEY"
validate_var "FRONTEND_URL" "$FRONTEND_URL" "https://yourdomain.com"

# Verificar comprimento do JWT Secret
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "⚠️ JWT_SECRET muito curto (mínimo 32 caracteres)"
    ERRORS=$((ERRORS+1))
fi

# Verificar se URLs estão usando HTTPS em produção
if [[ "$NODE_ENV" == "production" ]]; then
    if [[ "$FRONTEND_URL" != https://* ]]; then
        echo "⚠️ FRONTEND_URL deve usar HTTPS em produção"
        ERRORS=$((ERRORS+1))
    fi
fi

# Resultado final
if [ $ERRORS -eq 0 ]; then
    echo "✅ Configuração válida para produção!"
    exit 0
else
    echo "❌ $ERRORS problemas encontrados na configuração"
    exit 1
fi
```

### **3. Script de Setup de Domínio**

```bash
#!/bin/bash
# setup-domain.sh

echo "🌐 Configurando domínio para produção..."

read -p "Digite seu domínio principal (ex: whitelabel.com): " DOMAIN
read -p "Digite seu subdomínio para API (ex: api.whitelabel.com) [opcional]: " API_DOMAIN

if [ -z "$API_DOMAIN" ]; then
    API_DOMAIN="$DOMAIN"
fi

echo "📝 Configurando domínio: $DOMAIN"
echo "📝 API Domain: $API_DOMAIN"

# Atualizar .env.production
if [ -f ".env.production" ]; then
    # Fazer backup
    cp .env.production .env.production.backup
    
    # Substituir domínios
    sed -i "s/yourdomain.com/$DOMAIN/g" .env.production
    sed -i "s/FRONTEND_URL=https:\/\/$DOMAIN/FRONTEND_URL=https:\/\/$DOMAIN/g" .env.production
    sed -i "s/BACKEND_URL=https:\/\/$DOMAIN/BACKEND_URL=https:\/\/$API_DOMAIN/g" .env.production
    sed -i "s/VITE_API_URL=https:\/\/$DOMAIN\/api/VITE_API_URL=https:\/\/$API_DOMAIN\/api/g" .env.production
    
    echo "✅ Domínios configurados no .env.production"
else
    echo "❌ Arquivo .env.production não encontrado"
    exit 1
fi

# Atualizar configuração do Nginx
if [ -f "/etc/nginx/sites-available/whitelabel" ]; then
    echo "🔄 Atualizando configuração do Nginx..."
    sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/whitelabel
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx atualizado"
fi

echo "🎉 Configuração de domínio concluída!"
echo "📋 Próximos passos:"
echo "   1. Configure DNS para apontar $DOMAIN para este servidor"
echo "   2. Execute: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "   3. Teste: curl https://$DOMAIN/health"
```

---

## 🚀 **PROCESSO DE DEPLOY COMPLETO**

### **1. Preparação:**
```bash
# 1. Baixar template de environment
wget https://raw.githubusercontent.com/yourusername/whitelabel/main/.env.production.template -O .env.production

# 2. Gerar secrets
./scripts/generate-production-secrets.sh

# 3. Configurar domínio
./scripts/setup-domain.sh

# 4. Validar configuração
./scripts/validate-env.sh
```

### **2. Deploy:**
```bash
# 1. Deploy completo
./scripts/deploy.sh

# 2. Verificar serviços
docker-compose ps

# 3. Testar endpoints
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health
```

### **3. Monitoramento:**
```bash
# Logs em tempo real
docker-compose logs -f

# Status dos serviços
./scripts/monitor.sh

# Métricas de sistema
htop
df -h
```

---

## 🔒 **SEGURANÇA EM PRODUÇÃO**

### **Checklist de Segurança:**

- [ ] ✅ Todas as senhas padrão alteradas
- [ ] ✅ JWT_SECRET com 32+ caracteres
- [ ] ✅ HTTPS configurado e funcionando
- [ ] ✅ Firewall configurado (apenas portas 22, 80, 443)
- [ ] ✅ Fail2ban ativo
- [ ] ✅ Backup automático configurado
- [ ] ✅ Logs rotacionados
- [ ] ✅ Monitoramento ativo
- [ ] ✅ Rate limiting configurado
- [ ] ✅ CORS restrito ao domínio correto

### **Variáveis Críticas para Alterar:**

1. **`JWT_SECRET`** - Chave de assinatura JWT
2. **`POSTGRES_PASSWORD`** - Senha do banco
3. **`EVOLUTION_API_KEY`** - Chave da Evolution API
4. **`WEBHOOK_SECRET`** - Chave dos webhooks
5. **`FRONTEND_URL`** - Domínio real da aplicação

---

## 📞 **TROUBLESHOOTING**

### **Problemas Comuns:**

| Problema | Causa | Solução |
|----------|-------|---------|
| Backend não conecta no banco | URL incorreta | Verificar `DATABASE_URL` |
| JWT inválido | Secret incorreto | Verificar `JWT_SECRET` |
| CORS bloqueado | Origin incorreto | Verificar `FRONTEND_URL` |
| Evolution API erro | Key inválida | Verificar `EVOLUTION_API_KEY` |
| SSL não funciona | Domínio incorreto | Executar `certbot` novamente |

### **Comandos de Debug:**

```bash
# Verificar variáveis carregadas
docker-compose config

# Logs específicos
docker-compose logs whitelabel-backend
docker-compose logs evolution-api

# Testar conectividade
curl -k https://localhost/health
curl -H "apikey: $EVOLUTION_API_KEY" http://localhost:8080/manager/health

# Verificar certificados
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

**✅ CONFIGURAÇÃO COMPLETA PARA PRODUÇÃO PRONTA!**
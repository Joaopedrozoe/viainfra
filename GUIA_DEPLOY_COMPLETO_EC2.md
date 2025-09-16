# 🚀 GUIA COMPLETO DE DEPLOY EC2 - FRONTEND + BACKEND

**Data:** ${new Date().toISOString().split('T')[0]}  
**Versão:** 1.0.0  
**Para:** WhiteLabel MVP - Sistema Completo

---

## 📋 RESUMO EXECUTIVO

Este guia fornece o **passo a passo completo** para fazer deploy do seu projeto WhiteLabel MVP no AWS EC2, incluindo:

✅ **Frontend React (Vite)**  
✅ **Backend Node.js/Express**  
✅ **Banco PostgreSQL**  
✅ **Evolution API (WhatsApp)**  
✅ **SSL/HTTPS automatizado**  
✅ **Nginx como proxy reverso**  
✅ **Monitoramento e backup**

---

## 🎯 PRÉ-REQUISITOS

Antes de começar, você precisará de:

- [ ] Conta AWS ativa
- [ ] Domínio próprio (recomendado)
- [ ] Chave SSH para acesso
- [ ] Conhecimento básico de Linux/terminal

---

## 📦 PARTE 1: PREPARAÇÃO DA INSTÂNCIA EC2

### **Passo 1.1: Criar Instância EC2**

1. **Faça login no AWS Console**
2. **Vá para EC2 Dashboard**
3. **Clique em "Launch Instance"**

#### **Configurações Recomendadas:**
```
Nome: whitelabel-mvp
OS: Ubuntu 22.04 LTS
Tipo: t3.medium (2 vCPU, 4 GB RAM) - Mínimo
Tipo: t3.large (2 vCPU, 8 GB RAM) - Recomendado  
Storage: 30 GB SSD (gp3)
```

#### **Security Group:**
```
Inbound Rules:
- SSH (22): Seu IP atual
- HTTP (80): 0.0.0.0/0  
- HTTPS (443): 0.0.0.0/0
- Custom TCP (4000): 0.0.0.0/0 (temporário para testes)
- Custom TCP (8080): 0.0.0.0/0 (temporário para testes)
```

### **Passo 1.2: Conectar na Instância**

```bash
# Baixar a chave .pem e definir permissões
chmod 400 sua-chave.pem

# Conectar via SSH
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2
```

### **Passo 1.3: Preparar o Servidor**

Execute os comandos abaixo **na ordem**:

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependências básicas
sudo apt install -y curl wget git unzip htop nginx certbot python3-certbot-nginx ufw fail2ban

# 3. Configurar firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 4. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# 5. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 6. Criar diretórios do projeto
sudo mkdir -p /opt/whitelabel
sudo chown -R ubuntu:ubuntu /opt/whitelabel

# 7. IMPORTANTE: Sair e reconectar para aplicar mudanças do Docker
exit
```

**Reconecte agora:**
```bash
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2
```

---

## 📂 PARTE 2: CLONAR E CONFIGURAR PROJETO

### **Passo 2.1: Clonar Repositório**

```bash
cd /opt/whitelabel
git clone https://github.com/Joaopedrozoe/viainfra.git .

# Verificar se clonagem funcionou
ls -la
```

### **Passo 2.2: Configurar Variáveis de Ambiente**

#### **Criar arquivo .env principal:**

```bash
cat > /opt/whitelabel/.env << 'EOF'
# ===========================================
# WHITELABEL MVP - PRODUCTION ENVIRONMENT
# ===========================================

# Database Configuration
DATABASE_URL=postgresql://postgres:POSTGRES_PASSWORD_HERE@postgres:5432/whitelabel_mvp
POSTGRES_PASSWORD=POSTGRES_PASSWORD_HERE

# JWT Configuration  
JWT_SECRET=JWT_SECRET_AQUI_MINIMO_32_CARACTERES
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=4000

# Evolution API Configuration
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=EVOLUTION_KEY_AQUI
EVOLUTION_FRONTEND_URL=https://SEU-DOMINIO.com:8080

# Redis Configuration
REDIS_URL=redis://redis:6379

# URLs Configuration  
FRONTEND_URL=https://SEU-DOMINIO.com
BACKEND_URL=https://SEU-DOMINIO.com/api

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOF
```

#### **Gerar senhas seguras:**

```bash
# Gerar JWT Secret (64 caracteres)
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET gerado: $JWT_SECRET"

# Gerar senha do PostgreSQL (25 caracteres)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "POSTGRES_PASSWORD gerado: $DB_PASSWORD"

# Gerar chave da Evolution API (32 caracteres)
EVOLUTION_KEY=$(openssl rand -hex 16)
echo "EVOLUTION_API_KEY gerado: $EVOLUTION_KEY"

# Aplicar no arquivo .env
sed -i "s/JWT_SECRET_AQUI_MINIMO_32_CARACTERES/$JWT_SECRET/g" .env
sed -i "s/POSTGRES_PASSWORD_HERE/$DB_PASSWORD/g" .env  
sed -i "s/EVOLUTION_KEY_AQUI/$EVOLUTION_KEY/g" .env

# IMPORTANTE: Substitua SEU-DOMINIO.com pelo seu domínio real
read -p "Digite seu domínio (ex: whitelabel.com.br): " DOMAIN
sed -i "s/SEU-DOMINIO.com/$DOMAIN/g" .env

echo "✅ Variáveis de ambiente configuradas!"
```

### **Passo 2.3: Configurar Frontend**

```bash
# Criar .env para o frontend
cat > /opt/whitelabel/.env.production << EOF
# Frontend Production Environment
VITE_API_URL=https://$DOMAIN/api
VITE_EVOLUTION_API_URL=https://$DOMAIN/evolution
VITE_APP_ENV=production
EOF
```

---

## 🐳 PARTE 3: CONFIGURAR E EXECUTAR DOCKER

### **Passo 3.1: Verificar Docker Compose**

```bash
# Verificar se docker-compose.yml existe
cat docker-compose.yml

# Testar Docker
docker --version
docker-compose --version
```

### **Passo 3.2: Subir Banco de Dados Primeiro**

```bash
# Subir apenas PostgreSQL para preparar banco
docker-compose up -d postgres

# Aguardar banco ficar pronto (importante!)
sleep 30

# Verificar se PostgreSQL está rodando
docker-compose logs postgres
```

### **Passo 3.3: Configurar Banco de Dados**

```bash
# Executar script de criação das tabelas
docker-compose exec postgres psql -U postgres -d whitelabel_mvp -f /docker-entrypoint-initdb.d/init.sql

# Verificar se tabelas foram criadas
docker-compose exec postgres psql -U postgres -d whitelabel_mvp -c "\dt"
```

### **Passo 3.4: Subir Todos os Serviços**

```bash
# Subir todos os serviços
docker-compose up -d

# Verificar status de todos os containers
docker-compose ps

# Aguardar todos ficarem prontos
sleep 60

# Verificar logs para possíveis erros
docker-compose logs --tail=20
```

---

## 🌐 PARTE 4: CONFIGURAR NGINX + SSL

### **Passo 4.1: Configurar Nginx**

```bash
# Remover configuração padrão
sudo rm -f /etc/nginx/sites-enabled/default

# Criar configuração do WhiteLabel
sudo tee /etc/nginx/sites-available/whitelabel > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS (será ativado após SSL)
    # return 301 https://\$server_name\$request_uri;
    
    # Temporariamente servir HTTP para configurar SSL
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
}
EOF

# Ativar configuração
sudo ln -s /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx
```

### **Passo 4.2: Build do Frontend**

```bash
cd /opt/whitelabel

# Instalar dependências do frontend
npm install

# Build para produção
npm run build

# Copiar build para o Nginx
sudo cp -r dist /opt/whitelabel/
sudo chown -R www-data:www-data /opt/whitelabel/dist
```

### **Passo 4.3: Configurar SSL (HTTPS)**

**IMPORTANTE:** Antes de prosseguir, certifique-se que seu domínio está apontando para o IP da EC2!

```bash
# Parar nginx temporariamente
sudo systemctl stop nginx

# Configurar SSL com Let's Encrypt
read -p "Digite seu email para notificações SSL: " EMAIL

sudo certbot certonly \
    --standalone \
    --agree-tos \
    --no-eff-email \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

# Atualizar configuração nginx para HTTPS
sudo tee /etc/nginx/sites-available/whitelabel > /dev/null << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        root /opt/whitelabel/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
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

    # WebSocket
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

    # Evolution API
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

    # Health check
    location /health {
        proxy_pass http://localhost:4000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Substituir domínio na configuração
sudo sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/whitelabel

# Testar e reiniciar nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl reload nginx
```

---

## 🧪 PARTE 5: TESTES E VALIDAÇÃO

### **Passo 5.1: Verificar Serviços**

```bash
# Verificar containers Docker
docker-compose ps

# Verificar logs do backend
docker-compose logs --tail=20 whitelabel-backend

# Verificar logs da Evolution API  
docker-compose logs --tail=20 evolution-api

# Verificar status do Nginx
sudo systemctl status nginx
```

### **Passo 5.2: Testes de Conectividade**

```bash
# Testar backend
curl http://localhost:4000/health

# Testar Evolution API
curl http://localhost:8080/manager/health

# Testar frontend local
curl http://localhost/

# Testar frontend HTTPS
curl https://$DOMAIN/

# Testar API via HTTPS
curl https://$DOMAIN/api/health
```

### **Passo 5.3: Script de Teste Automatizado**

```bash
# Criar script de teste
cat > /opt/whitelabel/test-deployment.sh << 'EOF'
#!/bin/bash

echo "🧪 Testando deployment do WhiteLabel MVP..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo -e "\n${YELLOW}1. VERIFICANDO CONTAINERS${NC}"
docker-compose ps | grep "Up" > /dev/null
test_result $? "Containers Docker rodando"

echo -e "\n${YELLOW}2. TESTANDO BACKEND${NC}"
curl -f http://localhost:4000/health > /dev/null 2>&1
test_result $? "Backend Health Check"

echo -e "\n${YELLOW}3. TESTANDO EVOLUTION API${NC}"  
curl -f http://localhost:8080/manager/health > /dev/null 2>&1
test_result $? "Evolution API Health Check"

echo -e "\n${YELLOW}4. TESTANDO FRONTEND${NC}"
curl -f -k https://localhost/ > /dev/null 2>&1
test_result $? "Frontend HTTPS"

echo -e "\n${YELLOW}5. TESTANDO NGINX${NC}"
sudo systemctl is-active --quiet nginx
test_result $? "Nginx Status"

echo -e "\n${YELLOW}6. VERIFICANDO SSL${NC}"
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1
test_result $? "Certificado SSL"

echo -e "\n${GREEN}🎉 Testes concluídos!${NC}"
EOF

chmod +x /opt/whitelabel/test-deployment.sh

# Executar teste
./test-deployment.sh
```

---

## 🔧 PARTE 6: CONFIGURAÇÕES FINAIS

### **Passo 6.1: Configurar Renovação Automática SSL**

```bash
# Configurar renovação automática do SSL
echo "0 2 * * 0 sudo certbot renew --quiet --nginx --post-hook 'systemctl reload nginx'" | crontab -
```

### **Passo 6.2: Configurar Backup Automático**

```bash
# Criar script de backup
cat > /opt/whitelabel/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/whitelabel/backups"
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"

mkdir -p $BACKUP_DIR/$BACKUP_NAME

# Backup do banco
docker-compose exec -T postgres pg_dump -U postgres whitelabel_mvp | gzip > $BACKUP_DIR/$BACKUP_NAME/database.sql.gz

# Backup das configurações
cp .env $BACKUP_DIR/$BACKUP_NAME/
cp docker-compose.yml $BACKUP_DIR/$BACKUP_NAME/

echo "✅ Backup criado: $BACKUP_NAME"
EOF

chmod +x /opt/whitelabel/backup.sh

# Configurar backup automático diário às 2h
echo "0 2 * * * cd /opt/whitelabel && ./backup.sh" | crontab -
```

### **Passo 6.3: Configurar Monitoramento**

```bash
# Criar script de monitoramento
cat > /opt/whitelabel/monitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="/opt/whitelabel/monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Verificar se todos os containers estão rodando
DOWN_CONTAINERS=$(docker-compose ps --filter "status=exited" -q | wc -l)
if [ $DOWN_CONTAINERS -gt 0 ]; then
    log "⚠️ $DOWN_CONTAINERS containers não estão rodando"
    docker-compose up -d
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    log "⚠️ Espaço em disco baixo: ${DISK_USAGE}%"
fi

log "✅ Monitoramento concluído"
EOF

chmod +x /opt/whitelabel/monitor.sh

# Executar monitoramento a cada 5 minutos
echo "*/5 * * * * cd /opt/whitelabel && ./monitor.sh" | crontab -
```

---

## 🎉 PARTE 7: FINALIZAÇÃO E ACESSO

### **Passo 7.1: Verificar Tudo Funcionando**

```bash
# Status final de todos os serviços
echo "📊 Status dos Serviços:"
docker-compose ps
echo ""
sudo systemctl status nginx --no-pager -l
```

### **Passo 7.2: URLs de Acesso**

Após completar todos os passos, seu sistema estará disponível em:

```
🌐 Frontend: https://SEU-DOMINIO.com
🔌 Backend API: https://SEU-DOMINIO.com/api
📱 Evolution API: https://SEU-DOMINIO.com/evolution
🏥 Health Check: https://SEU-DOMINIO.com/api/health
```

### **Passo 7.3: Conectar WhatsApp**

1. **Acesse:** `https://SEU-DOMINIO.com/evolution`
2. **Use a API Key** que você gerou anteriormente
3. **Crie uma instância** do WhatsApp
4. **Escaneie o QR Code** com seu celular

---

## 📋 COMANDOS ÚTEIS PARA MANUTENÇÃO

### **Logs e Monitoramento:**
```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs do backend especificamente  
docker-compose logs -f whitelabel-backend

# Ver logs do nginx
sudo tail -f /var/log/nginx/access.log

# Status dos containers
docker-compose ps

# Uso de recursos
htop
```

### **Reiniciar Serviços:**
```bash
# Reiniciar todos os containers
docker-compose restart

# Reiniciar apenas o backend
docker-compose restart whitelabel-backend

# Reiniciar nginx
sudo systemctl restart nginx
```

### **Atualizar Sistema:**
```bash
# Atualizar código do repositório
cd /opt/whitelabel
git pull origin main

# Rebuild e restart
docker-compose build --no-cache
docker-compose up -d

# Rebuild do frontend
npm run build
sudo cp -r dist /opt/whitelabel/
sudo chown -R www-data:www-data /opt/whitelabel/dist
sudo systemctl reload nginx
```

---

## 🚨 TROUBLESHOOTING

### **Problemas Comuns:**

#### **1. Container não sobe:**
```bash
# Ver logs detalhados
docker-compose logs NOME_DO_CONTAINER

# Rebuild forçado
docker-compose build --no-cache NOME_DO_CONTAINER
docker-compose up -d
```

#### **2. Erro de SSL:**
```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Recarregar nginx
sudo systemctl reload nginx
```

#### **3. Backend não conecta no banco:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose exec postgres pg_isready

# Verificar logs do banco
docker-compose logs postgres

# Recriar banco se necessário
docker-compose down
docker volume rm whitelabel_postgres_data
docker-compose up -d postgres
```

#### **4. Evolution API não funciona:**
```bash
# Verificar logs
docker-compose logs evolution-api

# Resetar instância
docker-compose restart evolution-api
```

---

## ✅ CHECKLIST FINAL

Marque quando completar cada etapa:

- [ ] Instância EC2 criada e configurada
- [ ] Docker e Docker Compose instalados  
- [ ] Código clonado e variáveis configuradas
- [ ] PostgreSQL rodando e tabelas criadas
- [ ] Todos os containers Docker funcionando
- [ ] Nginx configurado e rodando
- [ ] SSL/HTTPS configurado
- [ ] Frontend acessível via HTTPS
- [ ] Backend respondendo na API
- [ ] Evolution API funcionando
- [ ] Testes de conectividade passando
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] WhatsApp conectado

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. **Criar usuário administrador** na aplicação
2. **Configurar fluxos de atendimento** nos bots
3. **Conectar canais WhatsApp** adicionais
4. **Configurar SMTP** para emails (opcional)
5. **Configurar backup para S3** (opcional)
6. **Configurar domínio personalizado** para clientes
7. **Treinar equipe** no uso da plataforma

---

## 📞 SUPORTE

Se você encontrar problemas durante o deploy:

1. **Verifique os logs** dos containers
2. **Execute o script de teste** para identificar o problema
3. **Consulte a seção troubleshooting** acima
4. **Verifique se todas as portas** estão abertas no Security Group
5. **Confirme se o domínio** está apontando para o IP correto

---

**✅ PARABÉNS! Seu WhiteLabel MVP está rodando em produção! 🎉**

Seu sistema completo agora está funcionando com:
- ✅ Frontend React otimizado
- ✅ Backend Node.js escalável  
- ✅ Banco PostgreSQL configurado
- ✅ WhatsApp integrado
- ✅ SSL/HTTPS seguro
- ✅ Monitoramento ativo
- ✅ Backup automático

Agora você pode começar a usar e personalizar sua plataforma!
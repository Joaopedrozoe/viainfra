# Backend Requirements - WhiteLabel MVP

## 📋 Resumo Executivo

Este documento detalha os requisitos para construir um backend Node.js/Express com PostgreSQL que atenda às necessidades do frontend já desenvolvido.

## 🏗️ Arquitetura Recomendada

```
📦 Backend Structure
├── 🐘 PostgreSQL Database (Container)
├── 🚀 Node.js API Server  
├── 🤖 Evolution API (WhatsApp)
├── 🔄 Redis (Cache/Sessions)
└── 🌐 Nginx (Reverse Proxy)
```

## 🎯 Funcionalidades Principais

### 1. **Sistema Multi-tenant**
- Isolamento por `company_id`
- Controle de acesso por empresa
- Dados completamente segregados

### 2. **Autenticação JWT**
- Login/registro com email/senha
- Tokens JWT com expiração
- Middleware de autenticação
- Sistema de permissões (admin/user)

### 3. **Chat em Tempo Real**
- WebSockets (Socket.io)
- Conversas multi-canal
- Transferência entre atendentes
- Histórico de mensagens

### 4. **Integração WhatsApp**
- Evolution API
- Webhooks para recebimento
- Envio de mensagens
- Status de entrega

### 5. **Gestão de Agentes IA**
- CRUD de agentes
- Base de conhecimento
- Métricas de performance
- Integração com n8n/Zapier

## 🗄️ Estrutura do Banco de Dados

**Tabelas Principais:**
- `companies` - Multi-tenancy
- `users` - Usuários do sistema
- `channels` - Canais de comunicação
- `conversations` - Conversas ativas
- `messages` - Histórico de mensagens
- `contacts` - Base de contatos
- `agents` - Agentes IA
- `events` - Calendário/agendamentos

**Script disponível:** `database-setup.sql`

## 🔗 Endpoints Críticos

### Autenticação
```
POST /auth/login
POST /auth/register
GET /auth/me
POST /auth/logout
```

### Conversas
```
GET /conversations
GET /conversations/:id/messages
POST /conversations/:id/messages
PUT /conversations/:id/assign
```

### Canais
```
GET /channels
POST /channels
PUT /channels/:id/connect
POST /webhooks/whatsapp
```

### Contatos
```
GET /contacts
POST /contacts
PUT /contacts/:id
GET /contacts/:id/history
```

## 🔌 Integrações Necessárias

### Evolution API (WhatsApp)
- **URL:** Configurável via ENV
- **Webhooks:** Receber mensagens
- **Endpoints:** Envio de mensagens
- **QR Code:** Conexão inicial

### WebSockets
- **Namespace:** `/chat`
- **Eventos:** new_message, conversation_updated, typing
- **Autenticação:** JWT no handshake

## 🐳 Docker Setup

```yaml
# docker-compose.yml
services:
  postgres:    # Banco principal
  backend:     # API Node.js
  evolution:   # WhatsApp API
  redis:       # Cache/Sessions
  nginx:       # Proxy reverso
```

## 🔐 Segurança

### Obrigatório
- Rate limiting
- Validação de entrada
- Sanitização de dados
- CORS configurado
- Headers de segurança
- Logs de auditoria

### Multi-tenant
- Todas as queries filtradas por `company_id`
- Middleware de isolamento
- Validação de acesso

## 🌍 Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
POSTGRES_PASSWORD=secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_api_key

# Frontend
FRONTEND_URL=https://yourfrontend.com
ALLOWED_ORIGINS=https://yourfrontend.com

# Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_bucket

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 📊 Tecnologias Recomendadas

### Core
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Prisma ou TypeORM
- **Cache:** Redis
- **WebSockets:** Socket.io

### Middlewares
- **Auth:** jsonwebtoken
- **Validation:** Joi ou Yup
- **Security:** Helmet
- **CORS:** cors
- **Rate Limit:** express-rate-limit
- **Logs:** Winston

### DevOps
- **Container:** Docker + Docker Compose
- **Process Manager:** PM2
- **Proxy:** Nginx
- **SSL:** Let's Encrypt

## 🚀 Passo a Passo para Deploy

### 1. Preparar Servidor EC2
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y
```

### 2. Configurar Projeto
```bash
# Clonar repositório
git clone <seu-repositorio-backend>
cd whitelabel-backend

# Configurar variáveis
cp .env.example .env
nano .env  # Editar variáveis
```

### 3. Executar com Docker
```bash
# Subir todos os serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f backend

# Executar migrations
docker-compose exec backend npm run migrate
```

### 4. Configurar Nginx (Opcional)
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/whitelabel
sudo ln -s /etc/nginx/sites-available/whitelabel /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### 5. SSL com Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.seudominio.com
```

## 📋 Checklist de Implementação

### Backend Core
- [ ] Configuração Express.js
- [ ] Conexão PostgreSQL
- [ ] Migrations/Seeds
- [ ] Middleware de autenticação
- [ ] Sistema multi-tenant
- [ ] Validação de dados
- [ ] Error handling

### APIs
- [ ] Endpoints de autenticação
- [ ] CRUD de conversas
- [ ] CRUD de contatos
- [ ] CRUD de canais
- [ ] CRUD de agentes
- [ ] CRUD de eventos

### Integrações
- [ ] Evolution API
- [ ] WebSockets
- [ ] Webhooks WhatsApp
- [ ] Email SMTP
- [ ] Storage (AWS S3)

### Segurança
- [ ] Rate limiting
- [ ] CORS configurado
- [ ] Headers de segurança
- [ ] Logs de auditoria
- [ ] Backup automático

### Deploy
- [ ] Docker setup
- [ ] Environment variables
- [ ] SSL certificado
- [ ] Monitoramento
- [ ] Health checks

## 📞 Suporte

Para dúvidas sobre o frontend ou esclarecimentos adicionais:
- Consulte a documentação completa na aba "Frontend Docs" da aplicação
- Analise os tipos TypeScript em `/src/types/`
- Verifique os dados mock em `/src/data/` para exemplos de estrutura

## 🎯 Resultado Esperado

Um backend robusto que:
✅ Suporte múltiplas empresas (multi-tenant)
✅ Integre com WhatsApp via Evolution API  
✅ Forneça chat em tempo real
✅ Gerencie agentes IA
✅ Seja seguro e escalável
✅ Rode em containers Docker na AWS
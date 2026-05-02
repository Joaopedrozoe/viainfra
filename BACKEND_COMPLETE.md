# 🚀 WhiteLabel MVP - Complete Project

Um sistema completo de CRM/Chat com frontend React e backend Node.js, integração WhatsApp e chat em tempo real.

## 📋 Visão Geral

Este projeto inclui:
- ✅ **Frontend React** com TypeScript e Tailwind CSS
- ✅ **Backend Node.js** com Express, PostgreSQL e WebSockets
- ✅ **Integração WhatsApp** via Evolution API
- ✅ **Chat em tempo real** com Socket.io
- ✅ **Multi-tenancy** para múltiplas empresas
- ✅ **Sistema de autenticação** JWT
- ✅ **Containerização** com Docker
- ✅ **Documentação completa**

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React/TS      │◄──►│   Node.js       │◄──►│   PostgreSQL    │
│   Port 3000     │    │   Port 4000     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │              ┌─────────────────┐               │
        │              │   Evolution     │               │
        └──────────────│   API           │───────────────┘
                       │   Port 8080     │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Redis         │
                       │   Port 6379     │
                       └─────────────────┘
```

## 🚀 Quick Start

### Opção 1: Docker (Recomendado)

```bash
# 1. Clone o repositório
git clone <repository-url>
cd viainfra

# 2. Configure ambiente
cp .env.example .env
# Edite .env com suas configurações

# 3. Inicie todos os serviços
docker-compose up -d

# 4. Acesse a aplicação
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# Evolution API: http://localhost:8080
```

### Opção 2: Desenvolvimento Local

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run build
npm run dev

# Frontend (em outro terminal)
cd ..
npm install
npm run dev
```

## 📦 Estrutura do Projeto

```
viainfra/
├── 📁 backend/                 # Backend Node.js
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Lógica das rotas
│   │   ├── 📁 middleware/      # Auth, validation, etc.
│   │   ├── 📁 routes/          # Definição de rotas
│   │   ├── 📁 services/        # Lógica de negócio
│   │   ├── 📁 types/           # Tipos TypeScript
│   │   ├── 📁 utils/           # Utilidades (auth, logger)
│   │   ├── 📁 websocket/       # WebSocket server
│   │   └── 📄 index.ts         # Arquivo principal
│   ├── 📁 prisma/              # Schema do banco
│   ├── 📄 Dockerfile           # Container backend
│   └── 📄 package.json         # Dependências
├── 📁 src/                     # Frontend React
│   ├── 📁 components/          # Componentes React
│   ├── 📁 hooks/               # Custom hooks
│   ├── 📁 lib/                 # Bibliotecas
│   ├── 📁 pages/               # Páginas
│   └── 📁 types/               # Tipos TypeScript
├── 📄 docker-compose.yml       # Orquestração
├── 📄 database-setup.sql       # Schema SQL
└── 📄 README.md                # Esta documentação
```

## 🔧 Tecnologias

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **React Query** - Estado do servidor
- **Socket.io Client** - WebSocket
- **Zod** - Validação
- **Vite** - Build tool

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM
- **PostgreSQL** - Banco de dados
- **Redis** - Cache
- **Socket.io** - WebSocket
- **JWT** - Autenticação
- **bcryptjs** - Hash senhas
- **Winston** - Logs

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Evolution API** - WhatsApp
- **Nginx** - Proxy reverso
- **PM2** - Process manager

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Perfil atual

### Conversas
- `GET /api/conversations` - Listar conversas
- `GET /api/conversations/:id/messages` - Mensagens
- `POST /api/conversations/:id/messages` - Enviar mensagem
- `PUT /api/conversations/:id/assign` - Atribuir conversa

### Contatos
- `GET /api/contacts` - Listar contatos
- `POST /api/contacts` - Criar contato
- `PUT /api/contacts/:id` - Atualizar contato
- `GET /api/contacts/:id/history` - Histórico

### Canais
- `GET /api/channels` - Listar canais
- `POST /api/channels` - Criar canal
- `PUT /api/channels/:id` - Atualizar canal
- `DELETE /api/channels/:id` - Deletar canal

### Agentes IA
- `GET /api/agents` - Listar agentes
- `POST /api/agents` - Criar agente
- `PUT /api/agents/:id` - Atualizar agente
- `DELETE /api/agents/:id` - Deletar agente

### Usuários
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário

### Outros
- `GET /api/departments` - Departamentos
- `GET /api/calendar/events` - Eventos
- `POST /api/webhooks/whatsapp` - Webhook WhatsApp
- `GET /api/whatsapp/qr/:instanceId` - QR Code

## 🔌 WebSocket Events

### Conexão
```javascript
const socket = io('http://localhost:4000', {
  auth: { token: 'your-jwt-token' }
});
```

### Eventos
- `join_conversation` - Entrar em conversa
- `leave_conversation` - Sair da conversa
- `typing_start` - Começar a digitar
- `typing_stop` - Parar de digitar
- `new_message` - Nova mensagem
- `conversation_updated` - Conversa atualizada
- `notification` - Notificação

## 🔐 Autenticação

O sistema usa JWT para autenticação:

1. **Login**: Envie email/senha para `/api/auth/login`
2. **Token**: Receba JWT token na resposta
3. **Autenticação**: Inclua o token no header:
   ```
   Authorization: Bearer <token>
   ```

## 🏢 Multi-tenancy

Sistema suporta múltiplas empresas:
- Dados isolados por `company_id`
- Usuários acessam apenas dados da própria empresa
- Middleware automático de filtragem

## 📊 Monitoring

### Health Checks
```bash
# API
curl http://localhost:4000/health

# Database
curl http://localhost:4000/api/health

# WebSocket
curl -I http://localhost:4000/socket.io/
```

### Logs
```bash
# Backend logs
tail -f backend/logs/combined.log

# Docker logs
docker-compose logs -f
```

## 🛡️ Segurança

- ✅ **Rate Limiting** - 100 req/15min
- ✅ **CORS** - Configurado para frontend
- ✅ **Helmet** - Headers de segurança
- ✅ **JWT** - Tokens seguros
- ✅ **bcrypt** - Hash de senhas
- ✅ **Validation** - Zod para entradas
- ✅ **Multi-tenant** - Isolamento de dados

## 🐳 Docker Services

```yaml
services:
  whitelabel-backend:    # API Node.js
  whitelabel-frontend:   # React App
  postgres:              # Database
  redis:                 # Cache
  evolution-api:         # WhatsApp
```

## 📚 Documentação

- 📖 [Backend README](backend/README.md)
- 🚀 [Deployment Guide](backend/DEPLOYMENT.md)
- 🔧 [Setup Script](backend/setup.sh)
- 🧪 [API Tests](backend/test-api.sh)

## 🎯 Features Implementadas

### ✅ Backend (33 endpoints)
- Sistema de autenticação JWT
- CRUD completo para todas entidades
- WebSocket para chat em tempo real
- Integração Evolution API (WhatsApp)
- Multi-tenancy por empresa
- Validação de dados com Zod
- Logs estruturados
- Rate limiting
- Error handling

### ✅ Frontend
- Interface moderna com Tailwind
- Chat em tempo real
- Gestão de contatos
- Dashboard com métricas
- Sistema de agentes IA
- Calendário de eventos
- Configurações de canais

### ✅ DevOps
- Docker Compose completo
- Scripts de setup automático
- Documentação abrangente
- Health checks
- SSL/HTTPS configurado

## 🚧 Próximos Passos

1. **Implementar testes** unitários e integração
2. **Adicionar CI/CD** com GitHub Actions
3. **Métricas avançadas** com Prometheus
4. **Backup automático** do banco de dados
5. **Notificações push** no frontend
6. **API rate limiting** por usuário
7. **Auditoria** de ações do usuário

## 📞 Suporte

### Para desenvolvimento:
- ✅ Health check: `http://localhost:4000/health`
- ✅ API docs: `http://localhost:4000/api`
- ✅ Frontend: `http://localhost:3000`
- ✅ Logs: `backend/logs/`

### Para produção:
- 📧 Configurar SMTP para emails
- 🔐 SSL/HTTPS obrigatório
- 📊 Monitoramento de métricas
- 💾 Backup automático
- 🔄 Updates de segurança

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

**WhiteLabel MVP** - Sistema completo de CRM/Chat com integração WhatsApp 🚀
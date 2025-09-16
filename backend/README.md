# WhiteLabel MVP Backend

Backend Node.js/Express completo para o sistema WhiteLabel MVP com integração WhatsApp via Evolution API.

## 🚀 Tecnologias

- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **Socket.io** - WebSockets para chat em tempo real
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Zod** - Validação de dados
- **Winston** - Sistema de logs

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/     # Controladores das rotas
│   ├── middleware/      # Middlewares (auth, validation, etc)
│   ├── routes/         # Definição das rotas
│   ├── services/       # Lógica de negócio
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilitários (auth, logger, etc)
│   ├── websocket/      # Servidor WebSocket
│   └── index.ts        # Arquivo principal
├── prisma/
│   └── schema.prisma   # Schema do banco de dados
├── Dockerfile          # Container Docker
└── package.json        # Dependências
```

## 🔧 Configuração

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/whitelabel_mvp"

# JWT
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=development

# Evolution API (WhatsApp)
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="your_evolution_api_key_here"

# Redis
REDIS_URL="redis://localhost:6379"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### 3. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrations
npx prisma migrate dev

# Executar seeds (dados iniciais)
npm run seed
```

## 🚀 Executar o Projeto

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

### Com Docker

```bash
# Da raiz do projeto
docker-compose up -d
```

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `GET /api/auth/me` - Perfil do usuário autenticado

### Conversas
- `GET /api/conversations` - Listar conversas
- `GET /api/conversations/:id/messages` - Mensagens de uma conversa
- `POST /api/conversations/:id/messages` - Enviar mensagem
- `PUT /api/conversations/:id/assign` - Atribuir conversa

### Contatos
- `GET /api/contacts` - Listar contatos
- `POST /api/contacts` - Criar contato
- `PUT /api/contacts/:id` - Atualizar contato
- `GET /api/contacts/:id/history` - Histórico do contato

### Canais
- `GET /api/channels` - Listar canais
- `POST /api/channels` - Criar canal
- `PUT /api/channels/:id` - Atualizar canal
- `DELETE /api/channels/:id` - Deletar canal

### Agentes IA
- `GET /api/agents` - Listar agentes IA
- `POST /api/agents` - Criar agente
- `PUT /api/agents/:id` - Atualizar agente
- `DELETE /api/agents/:id` - Deletar agente

### Usuários
- `GET /api/users` - Listar usuários (Admin)
- `POST /api/users` - Criar usuário (Admin)
- `PUT /api/users/:id` - Atualizar usuário

### Departamentos
- `GET /api/departments` - Listar departamentos
- `POST /api/departments` - Criar departamento

### Calendário
- `GET /api/calendar/events` - Eventos do calendário
- `POST /api/calendar/events` - Criar evento

### WhatsApp/Webhooks
- `POST /api/webhooks/whatsapp` - Webhook Evolution API
- `GET /api/whatsapp/qr/:instanceId` - QR Code WhatsApp

## 🔌 WebSockets

O servidor WebSocket está disponível em `/socket.io` e suporta:

- **Autenticação JWT** no handshake
- **Isolamento multi-tenant** por empresa
- **Salas de conversa** para chat em tempo real
- **Indicadores de digitação**
- **Notificações** em tempo real

### Eventos WebSocket

```javascript
// Conectar
const socket = io('http://localhost:4000', {
  auth: { token: 'seu-jwt-token' }
});

// Entrar em uma conversa
socket.emit('join_conversation', 'conversation-id');

// Escutar novas mensagens
socket.on('new_message', (data) => {
  console.log('Nova mensagem:', data);
});
```

## 🔐 Autenticação

O sistema usa **JWT (JSON Web Tokens)** para autenticação:

1. Login via `/api/auth/login` retorna um token
2. Inclua o token no header: `Authorization: Bearer <token>`
3. Rotas protegidas verificam o token automaticamente

## 🏢 Multi-tenancy

O sistema suporta múltiplas empresas:

- Todos os dados são isolados por `company_id`
- Middleware automático filtra dados por empresa
- Usuários só acessam dados da própria empresa

## 📊 Logs

Logs estruturados usando Winston:

- **Desenvolvimento**: Console colorido
- **Produção**: Arquivos JSON rotacionados
- **Níveis**: error, warn, info, debug
- **Localização**: `logs/` directory

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes em modo watch
npm run test:watch
```

## 🐳 Docker

O backend está configurado para rodar em container:

```bash
# Build da imagem
docker build -t whitelabel-backend .

# Executar container
docker run -p 4000:4000 whitelabel-backend
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Executar em desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Executar em produção
- `npm run migrate` - Executar migrations
- `npm run seed` - Executar seeds
- `npm run generate` - Gerar cliente Prisma
- `npm run studio` - Abrir Prisma Studio
- `npm test` - Executar testes

## 📈 Monitoramento

- **Health Check**: `GET /health`
- **Logs**: Winston com rotação
- **Métricas**: Process uptime, memory usage

## 🔄 Integração Evolution API

O backend integra com a Evolution API para WhatsApp:

1. **Webhooks**: Recebe mensagens automaticamente
2. **Envio**: Envia mensagens via API
3. **QR Code**: Gera QR para conexão
4. **Status**: Monitora conexão em tempo real

## 🛡️ Segurança

- **Rate Limiting**: 100 requests por 15 minutos
- **CORS**: Configurado para frontend
- **Helmet**: Headers de segurança
- **Validação**: Zod para todas as entradas
- **Sanitização**: Prevenção de SQL injection
- **JWT**: Tokens seguros com expiração

## 📚 Documentação

- Health check: `http://localhost:4000/health`
- API: `http://localhost:4000/api`
- WebSocket: `http://localhost:4000/socket.io`

## 🤝 Suporte

Para dúvidas ou problemas:

1. Verifique os logs em `logs/`
2. Teste o health check: `/health`
3. Consulte a documentação da API
4. Verifique as variáveis de ambiente
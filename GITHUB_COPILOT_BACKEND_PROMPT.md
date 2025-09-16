# PROMPT PARA GITHUB COPILOT - CRIAÇÃO DE BACKEND COMPLETO

## COMANDO PARA GITHUB COPILOT:

```
@workspace Crie um backend Node.js/Express completo e funcional baseado no frontend existente neste repositório. Analise todos os arquivos TypeScript de tipos (src/types/), o database-setup.sql, BACKEND_REQUIREMENTS.md e docker-compose.yml para entender a estrutura necessária.

REQUISITOS OBRIGATÓRIOS:

1. **ESTRUTURA DO PROJETO:**
   - Crie uma pasta `/backend` na raiz do projeto
   - Use Node.js + Express + TypeScript + PostgreSQL + Prisma ORM
   - Implemente autenticação JWT com bcrypt
   - Configure WebSocket para chat em tempo real
   - Integre com Evolution API para WhatsApp

2. **ARQUIVOS ESSENCIAIS:**
   - package.json com todas dependências necessárias
   - tsconfig.json configurado
   - Dockerfile para containerização
   - docker-compose.yml atualizado incluindo o backend
   - Schema Prisma baseado em database-setup.sql
   - Middleware de autenticação e autorização
   - Middleware de tratamento de erros
   - Sistema de logs estruturado

3. **ENDPOINTS DE API OBRIGATÓRIOS:**
   ```
   POST /auth/login - Login de usuário
   POST /auth/register - Registro de usuário  
   GET /auth/me - Perfil do usuário autenticado
   
   GET /conversations - Listar conversas
   GET /conversations/:id/messages - Mensagens de uma conversa
   POST /conversations/:id/messages - Enviar mensagem
   PUT /conversations/:id/assign - Atribuir conversa
   
   GET /contacts - Listar contatos
   POST /contacts - Criar contato
   PUT /contacts/:id - Atualizar contato
   GET /contacts/:id/history - Histórico do contato
   
   GET /channels - Listar canais
   POST /channels - Criar canal
   PUT /channels/:id - Atualizar canal
   DELETE /channels/:id - Deletar canal
   
   GET /agents - Listar agentes IA
   POST /agents - Criar agente
   PUT /agents/:id - Atualizar agente
   DELETE /agents/:id - Deletar agente
   
   GET /users - Listar usuários
   POST /users - Criar usuário
   PUT /users/:id - Atualizar usuário
   
   GET /departments - Listar departamentos
   POST /departments - Criar departamento
   
   GET /calendar/events - Eventos do calendário
   POST /calendar/events - Criar evento
   
   POST /webhooks/whatsapp - Webhook Evolution API
   GET /whatsapp/qr/:instanceId - QR Code WhatsApp
   ```

4. **FUNCIONALIDADES CRÍTICAS:**
   - Multi-tenancy por company_id
   - Validação de entrada com Zod
   - Rate limiting
   - CORS configurado
   - Logs estruturados
   - Health check endpoint
   - Middleware de validação de planos
   - Sistema de permissões por role

5. **INTEGRAÇÃO WHATSAPP (Evolution API):**
   - Webhooks para receber mensagens
   - Envio de mensagens
   - Gerenciamento de instâncias
   - QR Code para conexão

6. **WEBSOCKETS:**
   - Chat em tempo real
   - Notificações de novas mensagens
   - Status de conexão de canais
   - Atualizações de métricas

7. **BANCO DE DADOS:**
   - Use o schema exato do database-setup.sql
   - Implemente todas as tabelas e relacionamentos
   - Configure Prisma com migrations
   - Seeders para dados iniciais

8. **VARIÁVEIS DE AMBIENTE:**
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/whitelabel_mvp
   JWT_SECRET=sua_jwt_secret_aqui
   JWT_EXPIRES_IN=7d
   EVOLUTION_API_URL=http://localhost:8080
   EVOLUTION_API_KEY=sua_evolution_key
   REDIS_URL=redis://localhost:6379
   PORT=4000
   NODE_ENV=development
   ```

9. **TIPOS TYPESCRIPT:**
   Baseie-se nos tipos existentes em:
   - src/types/database.ts (PRINCIPAL)
   - src/types/agent.ts
   - src/types/contact.ts
   - src/types/channels.ts
   - src/types/conversation.ts
   - src/types/calendar.ts
   - src/types/departments.ts
   - src/types/plans.ts
   - src/types/users.ts
   - src/types/permissions.ts

10. **SEGURANÇA:**
    - Validação rigorosa de entrada
    - Sanitização de dados
    - Headers de segurança
    - Rate limiting por IP
    - Validação de JWT em rotas protegidas

GERE TODOS OS ARQUIVOS NECESSÁRIOS PARA UM BACKEND PRODUCTION-READY QUE FUNCIONE PERFEITAMENTE COM O FRONTEND EXISTENTE. O backend deve ser capaz de rodar com `npm install && npm run dev` após a criação.
```

## INSTRUÇÕES ADICIONAIS:

1. **Execute no terminal do repositório:**
   - Abra o GitHub Copilot Chat
   - Cole o prompt acima
   - Aguarde a criação dos arquivos

2. **Após a criação:**
   - Revise os arquivos gerados
   - Execute `cd backend && npm install`
   - Configure as variáveis de ambiente
   - Execute `docker-compose up -d` para subir o banco

3. **Teste a integração:**
   - Inicie o backend: `npm run dev`
   - Teste os endpoints com Postman/Insomnia
   - Verifique WebSockets funcionando
   - Teste autenticação e JWT

O prompt está otimizado para o GitHub Copilot gerar um backend completo e funcional baseado em toda estrutura do seu frontend.
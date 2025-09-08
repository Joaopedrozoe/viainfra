import React from 'react';

export const FrontendDocumentation = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Documentação do Frontend - Especificações para Backend</h2>
        <p className="text-muted-foreground">
          Este documento detalha todas as funcionalidades, endpoints esperados e estrutura de dados 
          necessária para construir um backend compatível com este frontend.
        </p>
      </div>

      {/* 1. Principais Funcionalidades */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">1. Principais Funcionalidades e Fluxos</h3>
        
        <div className="space-y-3">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">🔐 Autenticação e Autorização</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Login/Logout com email e senha</li>
              <li>• Registro de novos usuários</li>
              <li>• Sistema de permissões por usuário</li>
              <li>• Multi-tenant (por empresa/company_id)</li>
              <li>• Roles: admin, user</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">💬 Gestão de Conversas</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Lista de conversas ativas por canal</li>
              <li>• Chat em tempo real</li>
              <li>• Transferência entre atendentes</li>
              <li>• Histórico de mensagens</li>
              <li>• Status de lida/não lida</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">📱 Gestão de Canais</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• WhatsApp (Evolution API)</li>
              <li>• Instagram, Facebook Messenger</li>
              <li>• Email, Telegram, Website</li>
              <li>• Configuração de webhooks</li>
              <li>• Status de conexão</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">🤖 IA e Agentes</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Criação e treinamento de agentes IA</li>
              <li>• Base de conhecimento (arquivos, Q&A, URLs)</li>
              <li>• Processos automatizados</li>
              <li>• Integração com n8n/Zapier</li>
              <li>• Métricas de performance</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">👥 Gestão de Contatos</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• CRUD de contatos</li>
              <li>• Tags e categorização</li>
              <li>• Notas e tarefas</li>
              <li>• Histórico de interações</li>
              <li>• Campanhas de messaging</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">📅 Agendamento</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Calendário de eventos</li>
              <li>• Bookings públicos</li>
              <li>• Integração com Google Calendar</li>
              <li>• Notificações automáticas</li>
              <li>• Permissões de acesso</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Estrutura de Dados */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">2. Estrutura de Dados e Tipos</h3>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">User/Profile</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}`}</pre>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Company</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`interface Company {
  id: string;
  name: string;
  slug: string;
  settings: object;
  created_at: string;
  updated_at: string;
}`}</pre>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Conversation</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`interface Conversation {
  id: string;
  contact_id: string;
  channel_id: string;
  bot_id?: string;
  status: "active" | "closed" | "transferred";
  assigned_to?: string;
  last_message_at: string;
  company_id: string;
  metadata: object;
  created_at: string;
  updated_at: string;
}`}</pre>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Message</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`interface Message {
  id: string;
  conversation_id: string;
  content: string;
  message_type: "text" | "image" | "audio" | "document";
  sender_type: "contact" | "agent" | "bot";
  sender_id?: string;
  external_id?: string;
  metadata: object;
  created_at: string;
}`}</pre>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Contact</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  company?: string;
  tags: string[];
  avatar_url?: string;
  status: "active" | "inactive";
  source: "conversation" | "manual";
  last_interaction?: string;
  company_id: string;
  notes: Note[];
  created_at: string;
  updated_at: string;
}`}</pre>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Agent</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`interface Agent {
  id: string;
  name: string;
  function: "SDR" | "Suporte" | "Vendas" | "Genérico";
  status: "active" | "training" | "error";
  tone: string;
  description: string;
  channels: string[];
  knowledge_files: string[];
  knowledge_qa: {question: string, answer: string}[];
  knowledge_urls: string[];
  template: string;
  processes: AgentProcess[];
  integrations?: AgentIntegration[];
  company_id: string;
  metrics: {
    conversations: number;
    success_rate: number;
    human_transfers: number;
  };
  created_at: string;
  updated_at: string;
}`}</pre>
          </div>
        </div>
      </section>

      {/* 3. Endpoints API Necessários */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">3. Endpoints API Necessários</h3>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">🔐 Autenticação</h4>
            <div className="space-y-2 text-sm">
              <div><code className="bg-muted px-2 py-1 rounded">POST /auth/login</code> - Login com email/senha</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /auth/register</code> - Registro de usuário</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /auth/logout</code> - Logout</div>
              <div><code className="bg-muted px-2 py-1 rounded">GET /auth/me</code> - Dados do usuário logado</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">💬 Conversas</h4>
            <div className="space-y-2 text-sm">
              <div><code className="bg-muted px-2 py-1 rounded">GET /conversations</code> - Lista conversas</div>
              <div><code className="bg-muted px-2 py-1 rounded">GET /conversations/:id</code> - Detalhes da conversa</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /conversations/:id/messages</code> - Enviar mensagem</div>
              <div><code className="bg-muted px-2 py-1 rounded">PUT /conversations/:id/assign</code> - Transferir conversa</div>
              <div><code className="bg-muted px-2 py-1 rounded">PUT /conversations/:id/close</code> - Encerrar conversa</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">📱 Canais</h4>
            <div className="space-y-2 text-sm">
              <div><code className="bg-muted px-2 py-1 rounded">GET /channels</code> - Lista canais</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /channels</code> - Criar canal</div>
              <div><code className="bg-muted px-2 py-1 rounded">PUT /channels/:id</code> - Atualizar canal</div>
              <div><code className="bg-muted px-2 py-1 rounded">DELETE /channels/:id</code> - Deletar canal</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /channels/:id/connect</code> - Conectar canal</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /channels/:id/disconnect</code> - Desconectar canal</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">👥 Contatos</h4>
            <div className="space-y-2 text-sm">
              <div><code className="bg-muted px-2 py-1 rounded">GET /contacts</code> - Lista contatos</div>
              <div><code className="bg-muted px-2 py-1 rounded">GET /contacts/:id</code> - Detalhes do contato</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /contacts</code> - Criar contato</div>
              <div><code className="bg-muted px-2 py-1 rounded">PUT /contacts/:id</code> - Atualizar contato</div>
              <div><code className="bg-muted px-2 py-1 rounded">DELETE /contacts/:id</code> - Deletar contato</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /contacts/:id/notes</code> - Adicionar nota</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">🤖 Agentes IA</h4>
            <div className="space-y-2 text-sm">
              <div><code className="bg-muted px-2 py-1 rounded">GET /agents</code> - Lista agentes</div>
              <div><code className="bg-muted px-2 py-1 rounded">GET /agents/:id</code> - Detalhes do agente</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /agents</code> - Criar agente</div>
              <div><code className="bg-muted px-2 py-1 rounded">PUT /agents/:id</code> - Atualizar agente</div>
              <div><code className="bg-muted px-2 py-1 rounded">DELETE /agents/:id</code> - Deletar agente</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /agents/:id/train</code> - Treinar agente</div>
              <div><code className="bg-muted px-2 py-1 rounded">GET /agents/:id/metrics</code> - Métricas do agente</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">📅 Agendamento</h4>
            <div className="space-y-2 text-sm">
              <div><code className="bg-muted px-2 py-1 rounded">GET /events</code> - Lista eventos</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /events</code> - Criar evento</div>
              <div><code className="bg-muted px-2 py-1 rounded">PUT /events/:id</code> - Atualizar evento</div>
              <div><code className="bg-muted px-2 py-1 rounded">DELETE /events/:id</code> - Deletar evento</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /bookings/public</code> - Booking público</div>
              <div><code className="bg-muted px-2 py-1 rounded">GET /bookings/availability</code> - Horários disponíveis</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">🔌 Webhooks</h4>
            <div className="space-y-2 text-sm">
              <div><code className="bg-muted px-2 py-1 rounded">POST /webhooks/whatsapp</code> - Receber eventos WhatsApp</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /webhooks/instagram</code> - Receber eventos Instagram</div>
              <div><code className="bg-muted px-2 py-1 rounded">POST /webhooks/telegram</code> - Receber eventos Telegram</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Autenticação e Autorização */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">4. Autenticação e Autorização</h3>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Fluxo de Autenticação</h4>
          <ol className="text-sm space-y-2 text-muted-foreground">
            <li>1. <strong>Login:</strong> POST /auth/login com email/senha</li>
            <li>2. <strong>Response:</strong> JWT token + dados do usuário</li>
            <li>3. <strong>Headers:</strong> Authorization: Bearer &lt;token&gt;</li>
            <li>4. <strong>Validação:</strong> Middleware verifica token em todas as rotas protegidas</li>
            <li>5. <strong>Context:</strong> Dados do usuário e empresa disponíveis em req.user</li>
          </ol>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Sistema de Permissões</h4>
          <div className="text-sm space-y-2">
            <div><strong>Admin:</strong> Acesso total a todas funcionalidades</div>
            <div><strong>User:</strong> Acesso baseado em permissões específicas</div>
            <div><strong>Multi-tenant:</strong> Dados filtrados por company_id</div>
            <div><strong>Admin específico:</strong> elisabete.silva@viainfra.com.br</div>
          </div>
        </div>
      </section>

      {/* 5. WebSockets e Tempo Real */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">5. Comunicação em Tempo Real</h3>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">WebSockets Necessários</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Namespace:</strong> /chat</div>
            <div><strong>Eventos esperados:</strong></div>
            <ul className="ml-4 space-y-1 text-muted-foreground">
              <li>• new_message - Nova mensagem recebida</li>
              <li>• conversation_updated - Status da conversa alterado</li>
              <li>• typing - Indicador de digitação</li>
              <li>• agent_status - Status do agente online/offline</li>
              <li>• notification - Notificações do sistema</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Integrações Externas */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">6. Integrações Externas</h3>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Evolution API (WhatsApp)</h4>
            <div className="text-sm space-y-2">
              <div><strong>Base URL:</strong> http://localhost:8080 (configurável)</div>
              <div><strong>Endpoints principais:</strong></div>
              <ul className="ml-4 space-y-1 text-muted-foreground">
                <li>• POST /instance/create - Criar instância</li>
                <li>• GET /instance/connect/:name - Conectar WhatsApp</li>
                <li>• POST /message/sendText/:name - Enviar mensagem</li>
                <li>• POST /webhook/set/:name - Configurar webhook</li>
              </ul>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Variáveis de Ambiente Necessárias</h4>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`# Banco de Dados
DATABASE_URL=postgresql://user:pass@host:5432/db
POSTGRES_PASSWORD=secure_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_evolution_api_key

# WhatsApp
WHATSAPP_WEBHOOK_URL=https://yourapi.com/webhooks/whatsapp

# Email (SendGrid/SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Storage (AWS S3 ou local)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# Redis (opcional - para cache e sessions)
REDIS_URL=redis://localhost:6379

# Node Environment
NODE_ENV=production
PORT=3001

# CORS
FRONTEND_URL=https://yourfrontend.com
ALLOWED_ORIGINS=https://yourfrontend.com,http://localhost:5173`}
            </pre>
          </div>
        </div>
      </section>

      {/* 7. Considerações de Segurança */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">7. Segurança e Validações</h3>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Validações Necessárias</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Rate limiting nas APIs</li>
              <li>• Validação de entrada (Joi/Yup)</li>
              <li>• Sanitização de dados</li>
              <li>• CORS configurado corretamente</li>
              <li>• Headers de segurança (Helmet.js)</li>
              <li>• Logs de auditoria</li>
              <li>• Backup automático do banco</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Multi-tenant</h4>
            <div className="text-sm space-y-2">
              <div>Todas as consultas devem filtrar por <code>company_id</code></div>
              <div>Middleware deve garantir isolamento de dados entre empresas</div>
              <div>Usuários só acessam dados de sua empresa</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Estrutura Docker Recomendada */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">8. Estrutura Docker Recomendada</h3>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">docker-compose.yml</h4>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: whitelabel_mvp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database-setup.sql:/docker-entrypoint-initdb.d/setup.sql
    ports:
      - "5432:5432"
    
  backend:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/whitelabel_mvp
      JWT_SECRET: \${JWT_SECRET}
      EVOLUTION_API_URL: http://evolution:8080
    depends_on:
      - postgres
    ports:
      - "3001:3001"
    
  evolution:
    image: atendai/evolution-api:latest
    environment:
      DATABASE_PROVIDER: postgresql
      DATABASE_URL: postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/evolution
      JWT_SECRET: \${JWT_SECRET}
    depends_on:
      - postgres
    ports:
      - "8080:8080"
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:`}
          </pre>
        </div>
      </section>
    </div>
  );
};
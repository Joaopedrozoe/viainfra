
export const knowledgeBaseContent = [
  {
    id: "overview",
    title: "Visão Geral",
    content: (
      <div>
        <p>
          O ChatViaInfra é uma plataforma unificada de comunicação que permite gerenciar conversas de múltiplos canais em um único lugar. 
          Com recursos avançados de IA e integração simplificada, o ChatViaInfra torna a comunicação com seus clientes mais eficiente e organizada.
        </p>
      </div>
    )
  },
  {
    id: "access",
    title: "Acesso ao Sistema",
    content: (
      <div>
        <h3>Login</h3>
        <ul>
          <li>Acesse a página inicial do ChatViaInfra</li>
          <li>Clique no botão "Entrar"</li>
          <li>Insira seu e-mail e senha</li>
        </ul>
        
        <h3 className="mt-4">Primeiro Acesso</h3>
        <ul>
          <li>Clique em "Registrar"</li>
          <li>Preencha seus dados</li>
          <li>Confirme seu e-mail</li>
        </ul>
      </div>
    )
  },
  {
    id: "dashboard",
    title: "Dashboard e Navegação",
    content: (
      <div>
        <p>O dashboard do ChatViaInfra oferece uma visão completa das suas conversas e canais:</p>
        <ul>
          <li>Menu lateral com acesso rápido a todas as funcionalidades</li>
          <li>Lista de conversas organizada por data e prioridade</li>
          <li>Indicadores de status e não lidos</li>
          <li>Filtros e busca avançada</li>
        </ul>
      </div>
    )
  },
  {
    id: "inbox",
    title: "Inbox Unificada",
    content: (
      <div>
        <p>Gerencie todas as suas conversas em um único lugar:</p>
        <ul>
          <li>Visualização unificada de mensagens de diferentes canais</li>
          <li>Respostas rápidas e templates</li>
          <li>Atribuição de conversas a agentes</li>
          <li>Histórico completo de interações</li>
        </ul>
      </div>
    )
  },
  {
    id: "channels",
    title: "Integração de Canais",
    content: (
      <div>
        <p>Conecte diferentes canais de comunicação:</p>
        <ol>
          <li>Acesse "Canais" no menu</li>
          <li>Selecione o canal desejado</li>
          <li>Siga as instruções de autenticação</li>
          <li>Configure as preferências do canal</li>
        </ol>
      </div>
    )
  },
  {
    id: "ai",
    title: "Integração com IA",
    content: (
      <div>
        <h3>Configuração do Webhook</h3>
        <ol>
          <li>Acesse a seção "IA" no menu</li>
          <li>Insira a URL do webhook</li>
          <li>Configure os gatilhos desejados</li>
          <li>Teste a integração</li>
        </ol>
      </div>
    )
  },
  {
    id: "widget",
    title: "Widget para Sites",
    content: (
      <div>
        <p>Adicione o chat ao seu site:</p>
        <ol>
          <li>Acesse "Widget" no menu</li>
          <li>Personalize cores e mensagens</li>
          <li>Copie o código de instalação</li>
          <li>Cole no HTML do seu site</li>
        </ol>
      </div>
    )
  },
  {
    id: "settings",
    title: "Configurações Gerais",
    content: (
      <div>
        <h3>Configurações disponíveis:</h3>
        <ul>
          <li>Perfil e preferências pessoais</li>
          <li>Notificações por e-mail e push</li>
          <li>Gerenciamento de equipe</li>
          <li>Faturamento e assinatura</li>
        </ul>
      </div>
    )
  },
  {
    id: "mobile",
    title: "Aplicativo Mobile",
    content: (
      <div>
        <p>O ChatViaInfra é totalmente responsivo:</p>
        <ul>
          <li>Interface adaptativa para diferentes telas</li>
          <li>Navegação otimizada para touch</li>
          <li>Notificações push no celular</li>
          <li>Acesso offline a conversas recentes</li>
        </ul>
      </div>
    )
  },
  {
    id: "support",
    title: "Suporte e Contato",
    content: (
      <div>
        <h3>Canais de Atendimento:</h3>
        <ul>
          <li>E-mail: suporte@viainfra.com</li>
          <li>Chat: Horário comercial (9h às 18h)</li>
          <li>Base de conhecimento</li>
          <li>FAQ e tutoriais</li>
        </ul>
      </div>
    )
  },
  {
    id: "deployment",
    title: "🚀 Deploy em Produção (AWS + PostgreSQL + Evolution API)",
    content: (
      <div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Ordem Recomendada</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
            <li>Deploy AWS (Frontend)</li>
            <li>PostgreSQL (Banco de Dados)</li>
            <li>Evolution API (WhatsApp)</li>
          </ol>
        </div>

        <h3 className="text-xl font-bold mb-4">1️⃣ Deploy AWS - Frontend</h3>
        
        <h4 className="font-semibold mb-3">🖥️ Opção A: EC2 (Recomendado)</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <p className="mb-2 font-medium">Comandos para EC2:</p>
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Conectar na EC2
ssh -i sua-chave.pem ubuntu@seu-ip-ec2

# 2. Instalar dependências
sudo apt update
sudo apt install nodejs npm nginx -y

# 3. Instalar Bun (mais rápido)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 4. Clonar seu projeto
git clone seu-repositorio.git
cd seu-projeto

# 5. Instalar dependências e buildar
bun install
bun run build

# 6. Configurar Nginx
sudo nano /etc/nginx/sites-available/chatvia
# Cole a configuração abaixo

# 7. Ativar site
sudo ln -s /etc/nginx/sites-available/chatvia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">📝 Configuração Nginx:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`server {
    listen 80;
    server_name seu-dominio.com;
    
    root /home/ubuntu/seu-projeto/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">☁️ Opção B: S3 + CloudFront</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Buildar projeto
bun run build

# 2. Upload para S3
aws s3 sync dist/ s3://seu-bucket --delete

# 3. Invalidar CloudFront
aws cloudfront create-invalidation --distribution-id SEU_ID --paths "/*"`}</code></pre>
        </div>

        <h3 className="text-xl font-bold mb-4">2️⃣ PostgreSQL - Banco de Dados</h3>
        
        <h4 className="font-semibold mb-3">🗄️ Configurar RDS PostgreSQL:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Criar RDS via AWS CLI
aws rds create-db-instance \\
    --db-instance-identifier chatvia-db \\
    --db-instance-class db.t3.micro \\
    --engine postgres \\
    --master-username postgres \\
    --master-user-password SuaSenhaSegura \\
    --allocated-storage 20 \\
    --vpc-security-group-ids sg-seugrupoid

# 2. Conectar e rodar migrations
psql -h seu-rds-endpoint.amazonaws.com -U postgres -d postgres

# 3. Executar o database-setup.sql
\\i /caminho/para/database-setup.sql`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">🔗 String de Conexão:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <pre className="text-sm overflow-x-auto"><code>{`DATABASE_URL=postgresql://postgres:SuaSenha@seu-rds-endpoint.amazonaws.com:5432/postgres`}</code></pre>
        </div>

        <h3 className="text-xl font-bold mb-4">3️⃣ Evolution API - WhatsApp</h3>
        
        <h4 className="font-semibold mb-3">📱 Configurar Webhooks:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Configurar webhook na Evolution API
curl -X POST "https://sua-evolution-api.com/webhook/set/sua-instancia" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://seu-dominio.com/api/webhooks/evolution",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGE_RECEIVED", 
      "CONNECTION_UPDATE"
    ]
  }'`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">🔧 Variáveis de Ambiente:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# Criar arquivo .env na EC2
VITE_API_URL=https://seu-dominio.com/api
DATABASE_URL=postgresql://postgres:senha@rds-endpoint:5432/postgres
EVOLUTION_API_BASE_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua_api_key
WEBHOOK_BASE_URL=https://seu-dominio.com`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">🧪 Testar Integração:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Testar webhook
curl -X POST "https://seu-dominio.com/api/webhooks/evolution" \\
  -H "Content-Type: application/json" \\
  -d '{"test": true}'

# 2. Verificar status da instância
curl -X GET "https://sua-evolution-api.com/instance/status/sua-instancia" \\
  -H "apikey: SUA_API_KEY"

# 3. Enviar mensagem de teste
curl -X POST "https://sua-evolution-api.com/message/sendText/sua-instancia" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999999999",
    "text": "Teste de integração!"
  }'`}</code></pre>
        </div>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Checklist Final:</h4>
          <ul className="space-y-1 text-green-700 dark:text-green-300">
            <li>□ Frontend rodando na AWS</li>
            <li>□ PostgreSQL conectado e migrations executadas</li>
            <li>□ Evolution API configurada com webhooks</li>
            <li>□ Teste de envio/recebimento de mensagens</li>
            <li>□ SSL/HTTPS configurado</li>
            <li>□ Domínio apontando corretamente</li>
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Importantes:</h4>
          <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>• Configure HTTPS antes de configurar webhooks</li>
            <li>• Use SSL para conexão PostgreSQL em produção</li>
            <li>• Mantenha as API keys em variáveis de ambiente</li>
            <li>• Configure backup automático do banco</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: "email-config",
    title: "📧 Configuração de E-mail (Pós-Deploy)",
    content: (
      <div>
        <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Importante</h3>
          <p className="text-amber-700 dark:text-amber-300">
            Configure o servidor de e-mail APÓS o deploy para funcionalidades como redefinição de senha e notificações.
          </p>
        </div>

        <h3 className="text-xl font-bold mb-4">🔧 Configuração SMTP na Infraestrutura</h3>
        
        <h4 className="font-semibold mb-3">📨 Opção 1: Amazon SES (Recomendado)</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Configurar SES na AWS
aws ses verify-email-identity --email-address noreply@viainfra.com.br

# 2. Criar usuário SMTP
aws iam create-user --user-name ses-smtp-user

# 3. Adicionar política
aws iam attach-user-policy --user-name ses-smtp-user \\
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess

# 4. Criar credenciais SMTP
aws iam create-access-key --user-name ses-smtp-user`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">📧 Opção 2: Gmail/Google Workspace</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# Configurações Gmail:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=senha-de-app (não a senha normal)
SMTP_SECURITY=TLS

# Para criar senha de app:
# 1. Acesse Google Account
# 2. Vá em Segurança > Verificação em duas etapas
# 3. Senhas de app > Selecione app > Gerar`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">🏢 Opção 3: Servidor SMTP Próprio</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# Instalar Postfix na EC2
sudo apt update
sudo apt install postfix mailutils -y

# Configurar Postfix
sudo nano /etc/postfix/main.cf

# Adicionar configurações:
myhostname = mail.viainfra.com.br
mydomain = viainfra.com.br
myorigin = $mydomain
inet_interfaces = all
mydestination = $myhostname, localhost.$mydomain, localhost

# Reiniciar serviço
sudo systemctl restart postfix
sudo systemctl enable postfix`}</code></pre>
        </div>

        <h3 className="text-xl font-bold mb-4">⚙️ Configuração no Sistema</h3>
        
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🎯 No Frontend (Configurações)</h4>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
            <li>Acesse <strong>Configurações &gt; E-mail</strong></li>
            <li>Preencha os dados do servidor SMTP</li>
            <li>Teste a conexão</li>
            <li>Salve as configurações</li>
          </ol>
        </div>

        <h4 className="font-semibold mb-3">🔐 Variáveis de Ambiente</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# Adicionar no .env da aplicação
SMTP_HOST=smtp.suaempresa.com
SMTP_PORT=587
SMTP_USER=noreply@viainfra.com.br
SMTP_PASSWORD=senha_segura
SMTP_SECURITY=TLS
SMTP_FROM_EMAIL=noreply@viainfra.com.br
SMTP_FROM_NAME="ChatVia Infra"

# Para redefinição de senha
FRONTEND_URL=https://seu-dominio.com
RESET_PASSWORD_SECRET=chave_secreta_muito_longa`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">🧪 Teste de Configuração</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# Testar envio via linha de comando
echo "Teste de e-mail" | mail -s "Assunto do teste" destino@exemplo.com

# Verificar logs
tail -f /var/log/mail.log

# Testar SMTP diretamente
telnet smtp.viainfra.com.br 587
EHLO viainfra.com.br
STARTTLS`}</code></pre>
        </div>

        <h3 className="text-xl font-bold mb-4">📋 Templates de E-mail</h3>
        
        <h4 className="font-semibold mb-3">🔄 Redefinição de Senha</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <p className="text-sm mb-2"><strong>Assunto:</strong> Redefinir sua senha - ChatVia</p>
          <div className="text-sm">
            <p><strong>Conteúdo HTML:</strong></p>
             <pre className="mt-2 text-xs">{`<h2>Redefinir Senha</h2>
<p>Olá,</p>
<p>Recebemos uma solicitação para redefinir sua senha.</p>
<p>Clique no link abaixo para criar uma nova senha:</p>
<a href="{{RESET_LINK}}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
  Redefinir Senha
</a>
<p>Este link expira em 24 horas.</p>
<p>Se você não solicitou esta alteração, ignore este e-mail.</p>`}</pre>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Checklist Final E-mail:</h4>
          <ul className="space-y-1 text-green-700 dark:text-green-300">
            <li>□ Servidor SMTP configurado e testado</li>
            <li>□ DNS/SPF configurado para domínio</li>
            <li>□ Configurações salvas no sistema</li>
            <li>□ Teste de redefinição de senha funcionando</li>
            <li>□ Templates personalizados configurados</li>
            <li>□ Monitoramento de logs ativo</li>
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">💡 Dicas Importantes:</h4>
          <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>• Configure SPF e DKIM para evitar spam</li>
            <li>• Use sempre SSL/TLS para segurança</li>
            <li>• Monitore taxa de entrega e reputação</li>
            <li>• Configure backup de configuração SMTP</li>
            <li>• Teste periodicamente o envio de e-mails</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: "deployment",
    title: "🚀 Deploy em Produção (AWS + PostgreSQL + Evolution API)",
    content: (
      <div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Ordem Recomendada</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
            <li>Deploy AWS (Frontend)</li>
            <li>PostgreSQL (Banco de Dados)</li>
            <li>Evolution API (WhatsApp)</li>
            <li>Configuração E-mail (SMTP)</li>
          </ol>
        </div>

        <h3 className="text-xl font-bold mb-4">1️⃣ Deploy AWS - Frontend</h3>
        
        <h4 className="font-semibold mb-3">🖥️ Opção A: EC2 (Recomendado)</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <p className="mb-2 font-medium">Comandos para EC2:</p>
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Conectar na EC2
ssh -i sua-chave.pem ubuntu@seu-ip-ec2

# 2. Instalar dependências
sudo apt update
sudo apt install nodejs npm nginx -y

# 3. Instalar Bun (mais rápido)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 4. Clonar seu projeto
git clone seu-repositorio.git
cd seu-projeto

# 5. Instalar dependências e buildar
bun install
bun run build

# 6. Configurar Nginx
sudo nano /etc/nginx/sites-available/chatvia
# Cole a configuração abaixo

# 7. Ativar site
sudo ln -s /etc/nginx/sites-available/chatvia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">📝 Configuração Nginx:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`server {
    listen 80;
    server_name seu-dominio.com;
    
    root /home/ubuntu/seu-projeto/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">☁️ Opção B: S3 + CloudFront</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Buildar projeto
bun run build

# 2. Upload para S3
aws s3 sync dist/ s3://seu-bucket --delete

# 3. Invalidar CloudFront
aws cloudfront create-invalidation --distribution-id SEU_ID --paths "/*"`}</code></pre>
        </div>

        <h3 className="text-xl font-bold mb-4">2️⃣ PostgreSQL - Banco de Dados</h3>
        
        <h4 className="font-semibold mb-3">🗄️ Configurar RDS PostgreSQL:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Criar RDS via AWS CLI
aws rds create-db-instance \\
    --db-instance-identifier chatvia-db \\
    --db-instance-class db.t3.micro \\
    --engine postgres \\
    --master-username postgres \\
    --master-user-password SuaSenhaSegura \\
    --allocated-storage 20 \\
    --vpc-security-group-ids sg-seugrupoid

# 2. Conectar e rodar migrations
psql -h seu-rds-endpoint.amazonaws.com -U postgres -d postgres

# 3. Executar o database-setup.sql
\\i /caminho/para/database-setup.sql`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">🔗 String de Conexão:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <pre className="text-sm overflow-x-auto"><code>{`DATABASE_URL=postgresql://postgres:SuaSenha@seu-rds-endpoint.amazonaws.com:5432/postgres`}</code></pre>
        </div>

        <h3 className="text-xl font-bold mb-4">3️⃣ Evolution API - WhatsApp</h3>
        
        <h4 className="font-semibold mb-3">📱 Configurar Webhooks:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Configurar webhook na Evolution API
curl -X POST "https://sua-evolution-api.com/webhook/set/sua-instancia" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://seu-dominio.com/api/webhooks/evolution",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGE_RECEIVED", 
      "CONNECTION_UPDATE"
    ]
  }'`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">🔧 Variáveis de Ambiente:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# Criar arquivo .env na EC2
VITE_API_URL=https://seu-dominio.com/api
DATABASE_URL=postgresql://postgres:senha@rds-endpoint:5432/postgres
EVOLUTION_API_BASE_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua_api_key
WEBHOOK_BASE_URL=https://seu-dominio.com`}</code></pre>
        </div>

        <h4 className="font-semibold mb-3">🧪 Testar Integração:</h4>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-x-auto"><code>{`# 1. Testar webhook
curl -X POST "https://seu-dominio.com/api/webhooks/evolution" \\
  -H "Content-Type: application/json" \\
  -d '{"test": true}'

# 2. Verificar status da instância
curl -X GET "https://sua-evolution-api.com/instance/status/sua-instancia" \\
  -H "apikey: SUA_API_KEY"

# 3. Enviar mensagem de teste
curl -X POST "https://sua-evolution-api.com/message/sendText/sua-instancia" \\
  -H "apikey: SUA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999999999",
    "text": "Teste de integração!"
  }'`}</code></pre>
        </div>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Checklist Final:</h4>
          <ul className="space-y-1 text-green-700 dark:text-green-300">
            <li>□ Frontend rodando na AWS</li>
            <li>□ PostgreSQL conectado e migrations executadas</li>
            <li>□ Evolution API configurada com webhooks</li>
            <li>□ E-mail SMTP configurado e testado</li>
            <li>□ Teste de envio/recebimento de mensagens</li>
            <li>□ SSL/HTTPS configurado</li>
            <li>□ Domínio apontando corretamente</li>
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Importantes:</h4>
          <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>• Configure HTTPS antes de configurar webhooks</li>
            <li>• Use SSL para conexão PostgreSQL em produção</li>
            <li>• Mantenha as API keys em variáveis de ambiente</li>
            <li>• Configure backup automático do banco</li>
            <li>• Configure monitoramento de logs e métricas</li>
          </ul>
        </div>
      </div>
    )
  }
];

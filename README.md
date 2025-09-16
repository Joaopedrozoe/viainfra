# 🚀 WhiteLabel MVP - Sistema Completo de Atendimento

**Sistema de CRM e atendimento com WhatsApp integrado, multi-tenant e totalmente personalizável.**

---

## 📋 Visão Geral

Este é um sistema completo de **WhiteLabel MVP** que inclui:

✅ **Frontend React** - Interface moderna e responsiva  
✅ **Backend Node.js** - API robusta com autenticação JWT  
✅ **PostgreSQL** - Banco de dados relacional  
✅ **Evolution API** - Integração completa com WhatsApp  
✅ **Sistema Multi-tenant** - Suporte a múltiplas empresas  
✅ **Chat em Tempo Real** - WebSocket para comunicação instantânea  
✅ **Gestão de Agentes IA** - Bots inteligentes para atendimento  
✅ **Dashboard Analytics** - Métricas e relatórios completos  

---

## 🚀 DEPLOY RÁPIDO EM PRODUÇÃO (EC2)

### **⚡ Início Rápido (30 minutos)**

```bash
# 1. Criar EC2 Ubuntu 22.04 + abrir portas 80/443/22
# 2. Conectar via SSH e executar:

sudo mkdir -p /opt/whitelabel && sudo chown ubuntu:ubuntu /opt/whitelabel
cd /opt/whitelabel
git clone https://github.com/Joaopedrozoe/viainfra.git .

# Setup do servidor
./scripts/setup-server.sh

# IMPORTANTE: Logout e login novamente
exit && ssh -i sua-chave.pem ubuntu@SEU-IP-EC2 && cd /opt/whitelabel

# Configurar ambiente
./scripts/generate-secrets.sh
# Editar .env para seu domínio

# Deploy completo
./scripts/deploy-ec2.sh

# Testar sistema
./scripts/test-system.sh
```

**Pronto! Sistema funcionando em produção! 🎉**

### **📚 Documentação Completa**

- 📖 **[GUIA_DEPLOY_COMPLETO_EC2.md](./GUIA_DEPLOY_COMPLETO_EC2.md)** - Passo a passo detalhado  
- ⚡ **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)** - Deploy em 30 minutos  
- 🔧 **[BACKEND_REQUIREMENTS.md](./BACKEND_REQUIREMENTS.md)** - Especificações técnicas  

---

## 🛠️ Desenvolvimento Local

### **Pré-requisitos**
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (via Docker)

### **Setup Rápido**

```bash
# Clonar repositório
git clone https://github.com/Joaopedrozoe/viainfra.git
cd viainfra

# Instalar dependências
npm install
cd backend && npm install && cd ..

# Configurar ambiente
cp .env.template .env
# Editar .env com suas configurações

# Subir banco de dados
docker-compose up -d postgres

# Executar migrations
cd backend && npm run migrate && cd ..

# Iniciar desenvolvimento
npm run dev  # Frontend
cd backend && npm run dev  # Backend (terminal separado)
```

### **URLs de Desenvolvimento**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:4000
- 🗃️ PostgreSQL: localhost:5432
- 📱 Evolution API: http://localhost:8080

---

## 📦 Scripts Automatizados

### **Scripts de Deploy**
```bash
./scripts/setup-server.sh      # Preparar servidor EC2
./scripts/deploy-ec2.sh        # Deploy completo automatizado
./scripts/generate-secrets.sh  # Gerar senhas seguras
./scripts/validate-system.sh   # Validar pré-deploy
./scripts/test-system.sh       # Testes completos do sistema
```

### **Scripts de Manutenção**
```bash
# Monitoramento
docker-compose logs -f         # Ver logs em tempo real
docker-compose ps              # Status dos containers

# Backup e Restore
./scripts/backup.sh            # Backup manual do sistema
./scripts/monitor.sh           # Verificação de saúde

# Atualizações
git pull origin main           # Atualizar código
docker-compose build --no-cache # Rebuild containers
docker-compose restart         # Reiniciar serviços
```

---

## 🏗️ Arquitetura do Sistema

### **Frontend (React + Vite)**
- ⚛️ React 18 + TypeScript
- 🎨 Tailwind CSS + Shadcn/UI
- 📊 Recharts para analytics
- 🔌 Socket.io para tempo real
- 📱 PWA ready

### **Backend (Node.js + Express)**
- 🚀 Express.js + TypeScript
- 🔐 Autenticação JWT + bcrypt
- 🗃️ Prisma ORM + PostgreSQL
- 📡 Socket.io para WebSocket
- 🛡️ Rate limiting + CORS
- 📝 Logs estruturados (Winston)

### **Integrações**
- 📱 **Evolution API** - WhatsApp Business
- 🤖 **OpenAI** - Agentes IA
- 📧 **SMTP** - Notificações por email
- ☁️ **AWS S3** - Armazenamento de arquivos
- 📊 **Redis** - Cache e sessions

### **Infraestrutura**
- 🐳 **Docker** - Containerização completa
- 🌐 **Nginx** - Proxy reverso + SSL
- 🔒 **Let's Encrypt** - Certificados SSL automáticos
- 📈 **Monitoramento** - Logs + health checks
- 💾 **Backup** - Automático daily

---

## 🔧 Configurações de Ambiente

### **Variáveis Principais (.env)**
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
POSTGRES_PASSWORD=secure_password

# JWT
JWT_SECRET=your_secret_key_32_chars_minimum
JWT_EXPIRES_IN=7d

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=your_evolution_key

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com/api
```

### **Gerar Configurações Seguras**
```bash
./scripts/generate-secrets.sh  # Gera senhas seguras automaticamente
```

---

## 🧪 Testes e Validação

### **Testes Automatizados**
```bash
# Validar sistema antes do deploy
./scripts/validate-system.sh

# Testes completos pós-deploy
./scripts/test-system.sh

# Testes específicos
npm run test           # Frontend
cd backend && npm test # Backend
```

### **Health Checks**
- 🏥 Backend: `https://yourdomain.com/api/health`
- 📱 Evolution: `https://yourdomain.com/evolution/manager/health`
- 🗃️ Database: Conectividade PostgreSQL
- 🔌 WebSocket: Socket.io functionality

---

## 📊 Funcionalidades

### **🎯 Core Features**
- ✅ Sistema multi-tenant
- ✅ Autenticação JWT + RBAC
- ✅ Chat em tempo real
- ✅ Integração WhatsApp
- ✅ Gestão de contatos
- ✅ Gestão de conversas
- ✅ Dashboard analytics
- ✅ Agentes IA personalizáveis

### **🤖 Recursos Avançados**
- ✅ Bot builder visual
- ✅ Fluxos de atendimento
- ✅ Campanhas automáticas
- ✅ Relatórios detalhados
- ✅ API completa
- ✅ Webhooks configuráveis
- ✅ Sistema de tickets
- ✅ Calendário integrado

---

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **Container não sobe**
```bash
docker-compose logs CONTAINER_NAME
docker-compose build --no-cache CONTAINER_NAME
docker-compose up -d
```

#### **SSL não funciona**
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

#### **Backend não conecta no banco**
```bash
docker-compose restart postgres
docker-compose logs postgres
```

#### **Evolution API não funciona**
```bash
docker-compose restart evolution-api
docker-compose logs evolution-api
```

### **Logs Importantes**
- 📝 Deploy: `/opt/whitelabel/logs/deploy.log`
- 📊 Monitor: `/opt/whitelabel/logs/monitor.log`  
- 🌐 Nginx: `/var/log/nginx/whitelabel_*.log`
- 🐳 Docker: `docker-compose logs -f`

---

## 📞 Suporte e Contribuição

### **Documentação**
- 📖 Guias completos na pasta raiz
- 🔧 Scripts automatizados em `/scripts`
- 💡 Exemplos de uso em `/src/data`
- 📋 Tipos TypeScript em `/src/types`

### **Comunidade**
- 🐛 **Issues**: Reporte bugs e solicite features
- 🔄 **Pull Requests**: Contribuições são bem-vindas
- 📚 **Wiki**: Documentação adicional
- 💬 **Discussions**: Dúvidas e discussões

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🎉 Próximos Passos

Após deploy bem-sucedido:

1. **Conectar WhatsApp** - Escanear QR Code na Evolution API
2. **Criar usuário admin** - Primeiro acesso ao sistema  
3. **Configurar agentes IA** - Personalizar atendimento
4. **Treinar equipe** - Onboarding dos usuários
5. **Personalizar branding** - Logo, cores, domínio
6. **Configurar integrações** - CRM, email, etc.

**✅ Sistema pronto para atender seus clientes! 🚀**
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/417de2c0-cdea-48ae-b58b-fed3ff099759) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

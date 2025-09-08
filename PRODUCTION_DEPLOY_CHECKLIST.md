# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## ✅ FASE 1: VERIFICAÇÕES PRÉ-DEPLOY

### 📋 Código e Build
- [x] ✅ Projeto buildado sem erros (`npm run build`)
- [x] ✅ TypeScript sem erros de tipos
- [x] ✅ Todas as dependências do Supabase removidas
- [x] ✅ Console.logs removidos ou condicionados para desenvolvimento
- [x] ✅ Build otimizado com code splitting automático
- [x] ✅ Assets e imagens otimizados

### 🔧 Configurações
- [x] ✅ `vite.config.ts` configurado para produção
- [x] ✅ `Dockerfile` otimizado para Node.js/npm
- [x] ✅ Variáveis de ambiente documentadas em `.env.example`
- [x] ✅ `environment.ts` configurado corretamente
- [x] ✅ API client preparado para backend Node.js

### 🔒 Segurança
- [x] ✅ Headers de segurança configurados no nginx/servidor
- [x] ✅ CORS configurado no backend
- [x] ✅ JWT authentication implementado
- [x] ✅ Tokens armazenados de forma segura

## ✅ FASE 2: AMBIENTE AWS

### 🖥️ Infraestrutura
- [ ] ⏳ EC2 instance configurada (t3.medium recomendado)
- [ ] ⏳ Security Groups configurados (portas 80, 443, 22)
- [ ] ⏳ Nginx instalado e configurado
- [ ] ⏳ SSL/TLS certificado configurado
- [ ] ⏳ Docker instalado na instância

### 📦 Deploy
- [ ] ⏳ Docker image buildado e testado
- [ ] ⏳ Container rodando corretamente
- [ ] ⏳ Nginx proxy reverso configurado
- [ ] ⏳ DNS apontando para a instância

## ✅ FASE 3: BACKEND E INTEGRAÇÕES

### 🗄️ Backend Node.js/PostgreSQL
- [ ] ⏳ Backend deployado e funcionando
- [ ] ⏳ PostgreSQL configurado (RDS ou instância)
- [ ] ⏳ Migrations do banco executadas
- [ ] ⏳ API endpoints respondem corretamente
- [ ] ⏳ JWT authentication funcionando

### 📱 Evolution API (WhatsApp)
- [ ] ⏳ Evolution API deployada em container
- [ ] ⏳ Variável `VITE_EVOLUTION_API_URL` configurada
- [ ] ⏳ Webhooks configurados
- [ ] ⏳ Integração testada

## ✅ FASE 4: VARIÁVEIS DE AMBIENTE

### 🔧 Configurações Obrigatórias
```bash
# Backend API
VITE_API_URL=https://api.seudominio.com/api

# Evolution API  
VITE_EVOLUTION_API_URL=https://evolution.seudominio.com

# Environment
VITE_APP_ENV=production
```

### 🔧 Configurações Opcionais
```bash
# Performance
VITE_API_TIMEOUT=10000

# Assets CDN
VITE_ASSETS_URL=https://cdn.seudominio.com

# Analytics
VITE_ANALYTICS_KEY=your-key
```

## ✅ FASE 5: TESTES FINAIS

### 🧪 Funcionalidades Core
- [ ] ⏳ Login/logout funcionando
- [ ] ⏳ Dashboard carregando dados
- [ ] ⏳ Conversas sendo listadas
- [ ] ⏳ Mensagens sendo enviadas/recebidas
- [ ] ⏳ Agentes criados e funcionando
- [ ] ⏳ Calendário funcionando

### 🧪 Integrações
- [ ] ⏳ WhatsApp conectando via Evolution API
- [ ] ⏳ Webhooks recebendo eventos
- [ ] ⏳ Banco de dados salvando informações
- [ ] ⏳ JWT tokens sendo renovados

### 🧪 Performance
- [ ] ⏳ Tempo de carregamento < 3 segundos
- [ ] ⏳ Build size otimizado
- [ ] ⏳ Lazy loading funcionando
- [ ] ⏳ Responsividade em mobile

## 🚨 PONTOS CRÍTICOS

### ⚠️ NÃO ESQUECER
1. **CORS**: Backend deve aceitar requests do domínio frontend
2. **SSL**: HTTPS obrigatório em produção para JWT
3. **Environment**: `VITE_APP_ENV=production` deve estar setado
4. **Evolution API**: URL deve ser acessível do frontend do usuário
5. **Database**: Migrations executadas e tabelas criadas
6. **Backup**: Backup do banco antes do deploy

### 🔍 MONITORAMENTO
- [ ] ⏳ Logs do container funcionando
- [ ] ⏳ Health check endpoint respondendo
- [ ] ⏳ Monitoramento de erros configurado
- [ ] ⏳ Métricas de performance

## 📞 TROUBLESHOOTING

### 🐛 Problemas Comuns
1. **CORS Error**: Verificar configuração no backend
2. **401 Unauthorized**: Verificar JWT implementation
3. **404 API**: Verificar `VITE_API_URL`
4. **WhatsApp não conecta**: Verificar `VITE_EVOLUTION_API_URL`
5. **Build falha**: Verificar dependências e TypeScript

### 🔧 Debug Commands
```bash
# Verificar se build está funcionando
docker build -t frontend .
docker run -p 3000:3000 frontend

# Verificar logs
docker logs container-name

# Verificar variáveis de ambiente
docker exec container-name env | grep VITE_
```

## ✅ DEPLOY APROVADO

- [ ] ⏳ Todos os itens acima verificados
- [ ] ⏳ Testes realizados com usuários reais
- [ ] ⏳ Monitoramento ativo
- [ ] ⏳ Backup realizado
- [ ] ⏳ Rollback plan preparado

**Data do Deploy**: ___________  
**Responsável**: ___________  
**Ambiente**: Produção AWS  
**Versão**: ___________
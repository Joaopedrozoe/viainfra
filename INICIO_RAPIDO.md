# 🚀 INÍCIO RÁPIDO - DEPLOY EC2 WHITELABEL MVP

**Tempo estimado:** 30-45 minutos  
**Dificuldade:** Intermediário  
**Pré-requisitos:** AWS EC2, domínio próprio

---

## ⚡ RESUMO SUPER RÁPIDO

1. **Criar EC2** → Ubuntu 22.04, t3.medium, abrir portas 80/443/22
2. **Executar setup** → `./scripts/setup-server.sh`  
3. **Clonar projeto** → Em `/opt/whitelabel`
4. **Configurar .env** → `./scripts/generate-secrets.sh`
5. **Deploy** → `./scripts/deploy-ec2.sh`
6. **Testar** → `./scripts/test-system.sh`

**Pronto! Sistema funcionando em produção! 🎉**

---

## 📋 PASSO A PASSO DETALHADO

### **1. CRIAR INSTÂNCIA EC2**

```bash
# Via AWS Console:
- OS: Ubuntu 22.04 LTS
- Tipo: t3.medium (recomendado)
- Storage: 30 GB SSD
- Security Group: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Key Pair: Criar nova ou usar existente
```

### **2. CONECTAR E PREPARAR SERVIDOR**

```bash
# Conectar via SSH
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2

# Clonar projeto
sudo mkdir -p /opt/whitelabel
sudo chown ubuntu:ubuntu /opt/whitelabel
cd /opt/whitelabel
git clone https://github.com/Joaopedrozoe/viainfra.git .

# Executar setup do servidor
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh

# IMPORTANTE: Fazer logout e login novamente
exit
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2
cd /opt/whitelabel
```

### **3. CONFIGURAR VARIÁVEIS DE AMBIENTE**

```bash
# Gerar secrets seguros
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh

# Editar .env para configurar seu domínio
nano .env
# Substitua CHANGE_YOUR_DOMAIN.com pelo seu domínio real
```

### **4. EXECUTAR DEPLOY**

```bash
# Deploy completo automatizado
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh

# Seguir instruções na tela:
# - Confirmar domínio
# - Inserir email para SSL
# - Aguardar conclusão
```

### **5. TESTAR SISTEMA**

```bash
# Executar testes completos
chmod +x scripts/test-system.sh
./scripts/test-system.sh

# Verificar URLs:
# Frontend: https://seu-dominio.com
# API: https://seu-dominio.com/api/health
# Evolution: https://seu-dominio.com/evolution
```

---

## 🎯 CHECKLIST DE DEPLOY

### **Antes do Deploy:**
- [ ] Instância EC2 criada e acessível
- [ ] Domínio configurado (DNS A record → IP da EC2)
- [ ] Email válido para certificado SSL
- [ ] Chave SSH funcionando

### **Durante o Deploy:**
- [ ] Setup do servidor executado com sucesso
- [ ] Projeto clonado em `/opt/whitelabel`
- [ ] Secrets gerados e aplicados no `.env`
- [ ] Domínio configurado no `.env`
- [ ] Deploy script executado sem erros

### **Após o Deploy:**
- [ ] Frontend acessível via HTTPS
- [ ] API respondendo em `/health`
- [ ] Evolution API funcionando
- [ ] Certificado SSL válido
- [ ] Testes passando (>90%)

---

## 🔧 COMANDOS ESSENCIAIS

### **Monitoramento:**
```bash
# Status geral
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Status do sistema
./scripts/status.sh

# Executar testes
./scripts/test-system.sh
```

### **Manutenção:**
```bash
# Reiniciar serviços
docker-compose restart

# Atualizar código
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# Backup manual
./scripts/backup.sh
```

### **Resolução de Problemas:**
```bash
# Verificar containers
docker-compose ps

# Ver logs específicos
docker-compose logs whitelabel-backend
docker-compose logs evolution-api

# Verificar nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar SSL
openssl s_client -connect seu-dominio.com:443
```

---

## 📱 CONFIGURAR WHATSAPP

1. **Acessar Evolution API:** `https://seu-dominio.com/evolution`
2. **Usar API Key** do arquivo `.env` (EVOLUTION_API_KEY)
3. **Criar instância:** Nome → `whatsapp-instance`
4. **Conectar WhatsApp:** Escanear QR Code
5. **Testar mensagem:** Enviar para seu próprio número

---

## 🚨 TROUBLESHOOTING RÁPIDO

### **Containers não sobem:**
```bash
docker-compose down
docker-compose up -d
docker-compose logs
```

### **SSL não funciona:**
```bash
# Verificar se domínio aponta para EC2
nslookup seu-dominio.com

# Recriar certificado
sudo certbot delete --cert-name seu-dominio.com
sudo certbot certonly --standalone -d seu-dominio.com
sudo systemctl reload nginx
```

### **Backend não responde:**
```bash
# Verificar logs
docker-compose logs whitelabel-backend

# Reiniciar apenas backend
docker-compose restart whitelabel-backend
```

### **Frontend não carrega:**
```bash
# Rebuild frontend
npm run build
sudo cp -r dist /opt/whitelabel/
sudo chown -R www-data:www-data /opt/whitelabel/dist
sudo systemctl reload nginx
```

---

## 🎉 PRÓXIMOS PASSOS

Após deploy bem-sucedido:

1. **Configurar primeiro usuário admin**
2. **Conectar WhatsApp Business**
3. **Configurar fluxos de atendimento**
4. **Personalizar branding**
5. **Treinar equipe**
6. **Configurar backup para S3** (opcional)
7. **Configurar monitoramento avançado** (opcional)

---

## 📞 SUPORTE

### **Documentação Completa:**
- `GUIA_DEPLOY_COMPLETO_EC2.md` - Guia detalhado
- `BACKEND_REQUIREMENTS.md` - Especificações técnicas
- `DEPLOYMENT_GUIDE.md` - Deploy frontend

### **Scripts de Ajuda:**
- `./scripts/setup-server.sh` - Preparar servidor
- `./scripts/deploy-ec2.sh` - Deploy completo
- `./scripts/test-system.sh` - Testes e validação
- `./scripts/generate-secrets.sh` - Gerar senhas seguras

### **Logs Importantes:**
- `/opt/whitelabel/logs/deploy.log` - Logs do deploy
- `/opt/whitelabel/logs/monitor.log` - Logs de monitoramento
- `/var/log/nginx/whitelabel_*.log` - Logs do Nginx

---

**✅ Com este guia, seu WhiteLabel MVP estará rodando em produção em menos de 1 hora! 🚀**
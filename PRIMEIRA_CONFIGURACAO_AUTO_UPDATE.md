# 🚀 INSTRUÇÕES DE PRIMEIRA CONFIGURAÇÃO - AUTO UPDATE EC2

## 📋 **RESUMO**

Este guia fornece instruções para configurar o sistema de atualização automática no EC2, permitindo atualizações seguras do código via git fetch/reset e docker-compose rebuild.

---

## 🎯 **PRIMEIRA CONFIGURAÇÃO**

### **1. Preparar o Servidor EC2**

```bash
# Conectar ao servidor EC2
ssh -i sua-chave.pem ubuntu@IP_DO_SERVIDOR

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Executar setup inicial do servidor (se ainda não foi feito)
# Este comando deve ser executado primeiro, apenas uma vez
curl -fsSL https://raw.githubusercontent.com/Joaopedrozoe/viainfra/main/scripts/setup-server.sh | bash

# IMPORTANTE: Fazer logout e login novamente após o setup
exit
ssh -i sua-chave.pem ubuntu@IP_DO_SERVIDOR
```

### **2. Clonar o Repositório**

```bash
# Criar diretório do projeto (se não existe)
sudo mkdir -p /opt/whitelabel
sudo chown -R ubuntu:ubuntu /opt/whitelabel

# Clonar repositório
cd /opt/whitelabel
git clone https://github.com/Joaopedrozoe/viainfra.git .

# Verificar se o script existe
ls -la scripts/auto-update-ec2.sh

# Tornar o script executável (se necessário)
chmod +x scripts/auto-update-ec2.sh
```

### **3. Configuração Inicial**

```bash
# Configurar arquivo .env (se não existe)
cp .env.template .env

# Editar configurações (substitua pelos seus valores)
nano .env

# Executar deploy inicial
./scripts/deploy-ec2.sh
```

---

## 🔧 **COMO USAR O AUTO UPDATE**

### **🚀 MÉTODO RÁPIDO (Recomendado):**

```bash
# Comando super simples - mostra menu interativo
./scripts/quick-update.sh

# Ou diretamente para uma branch específica
./scripts/quick-update.sh copilot/fix-193aa104-e81c-49b2-805d-70d71e8cfed8
./scripts/quick-update.sh main
./scripts/quick-update.sh develop
```

### **🔧 MÉTODO COMPLETO:**

```bash
# Atualizar para branch main
./scripts/auto-update-ec2.sh main

# Atualizar para branch develop
./scripts/auto-update-ec2.sh develop

# Atualizar para branch específica (como no exemplo do problema)
./scripts/auto-update-ec2.sh copilot/fix-193aa104-e81c-49b2-805d-70d71e8cfed8

# Verificar status do sistema
./scripts/auto-update-ec2.sh --status

# Fazer rollback para último estado funcional
./scripts/auto-update-ec2.sh --rollback

# Mostrar ajuda
./scripts/auto-update-ec2.sh --help
```

### **Exemplo de Uso Completo:**

```bash
# 1. Conectar ao servidor
ssh -i sua-chave.pem ubuntu@IP_DO_SERVIDOR

# 2. Ir para diretório do projeto
cd /opt/whitelabel

# 3. MÉTODO MAIS FÁCIL - Menu interativo
./scripts/quick-update.sh
# (Escolha opção 3 e digite: copilot/fix-193aa104-e81c-49b2-805d-70d71e8cfed8)

# OU MÉTODO DIRETO
./scripts/quick-update.sh copilot/fix-193aa104-e81c-49b2-805d-70d71e8cfed8

# 4. Verificar se tudo funcionou
./scripts/auto-update-ec2.sh --status
```

### **⚡ COMANDO ÚNICO PARA COPY/PASTE:**

```bash
# Cole este comando direto no terminal da EC2 (substitua a branch)
cd /opt/whitelabel && ./scripts/quick-update.sh copilot/fix-193aa104-e81c-49b2-805d-70d71e8cfed8
```

---

## 🛡️ **RECURSOS DE SEGURANÇA**

### **Backup Automático:**
- ✅ Backup do banco de dados antes da atualização
- ✅ Backup dos arquivos de configuração (.env, docker-compose.yml)
- ✅ Salvamento do commit atual para rollback

### **Rollback Automático:**
- ✅ Rollback automático em caso de falha na atualização
- ✅ Rollback manual disponível via comando
- ✅ Verificação de saúde dos serviços após atualização

### **Monitoramento:**
- ✅ Logs detalhados em `/opt/whitelabel/logs/auto-update.log`
- ✅ Verificação de status dos containers
- ✅ Health checks dos serviços

---

## 🚨 **RESOLUÇÃO DE PROBLEMAS**

### **Se a atualização falhar:**

```bash
# O rollback é automático, mas você pode forçar manualmente
./scripts/auto-update-ec2.sh --rollback

# Verificar logs
tail -f /opt/whitelabel/logs/auto-update.log

# Verificar status dos containers
docker-compose ps

# Verificar logs dos containers
docker-compose logs -f
```

### **Se não conseguir conectar aos serviços:**

```bash
# Reiniciar todos os serviços
cd /opt/whitelabel
docker-compose restart

# Verificar portas abertas
sudo netstat -tlnp | grep :4000
sudo netstat -tlnp | grep :8080

# Verificar firewall
sudo ufw status
```

### **Limpeza de espaço em disco:**

```bash
# Limpar imagens antigas do Docker
docker image prune -f

# Limpar volumes não utilizados
docker volume prune -f

# Limpar backups antigos (manter só os últimos 5)
cd /opt/whitelabel/backups
ls -t | tail -n +6 | xargs rm -rf
```

---

## 📊 **MONITORAMENTO CONTÍNUO**

### **Script para Verificação Automática:**

Crie um arquivo `monitor.sh` para verificações regulares:

```bash
#!/bin/bash
# Salvar em /opt/whitelabel/monitor.sh

cd /opt/whitelabel

echo "=== STATUS DO SISTEMA $(date) ==="
./scripts/auto-update-ec2.sh --status

echo ""
echo "=== LOGS RECENTES ==="
tail -20 /opt/whitelabel/logs/auto-update.log

echo ""
echo "=== ESPAÇO EM DISCO ==="
df -h /

echo ""
echo "=== MEMÓRIA ==="
free -h
```

### **Configurar Cron para Monitoramento:**

```bash
# Adicionar ao crontab
crontab -e

# Adicionar linha para verificação a cada 6 horas
0 */6 * * * /opt/whitelabel/monitor.sh >> /opt/whitelabel/logs/monitor.log 2>&1
```

---

## 🎉 **FINALIZAÇÃO**

Após seguir estas instruções, seu sistema estará configurado para:

1. ✅ **Receber atualizações automáticas** via git fetch/reset
2. ✅ **Rebuild automático** dos containers Docker
3. ✅ **Backup e rollback** em caso de problemas
4. ✅ **Monitoramento** da saúde dos serviços
5. ✅ **Logs detalhados** para troubleshooting

**Próximos passos:**
- Configure seu domínio para apontar para o servidor
- Configure SSL com Let's Encrypt
- Teste as atualizações em ambiente de desenvolvimento primeiro
- Configure notificações (Telegram, email) se necessário

---

## 📞 **SUPORTE**

Em caso de problemas:
1. Verificar logs em `/opt/whitelabel/logs/`
2. Usar `./scripts/auto-update-ec2.sh --status` para diagnóstico
3. Usar `./scripts/auto-update-ec2.sh --rollback` se necessário
4. Consultar documentação adicional em `AWS_EC2_DEPLOY_GUIDE.md`
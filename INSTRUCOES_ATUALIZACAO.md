# 🚀 INSTRUÇÕES DE ATUALIZAÇÃO - WhiteLabel MVP

## Scripts Disponíveis

### 1. `./update.sh` - Script Principal de Atualização

**Uso básico:**
```bash
# Atualização padrão para branch main
./update.sh

# Atualização para branch específico
./update.sh copilot/fix-16492acf-49cc-45ba-8436-1e80c824d0a5

# Ver ajuda
./update.sh --help
```

### 2. `./scripts/quick-update.sh` - Atualização Rápida

**Uso:**
```bash
# Atualizar para branch específico com retry e rollback automático
./scripts/quick-update.sh copilot/fix-16492acf-49cc-45ba-8436-1e80c824d0a5

# Ver ajuda
./scripts/quick-update.sh --help
```

### 3. `./scripts/auto-update-ec2.sh` - Script Interno de Atualização

**Uso:**
```bash
# Geralmente chamado pelos outros scripts, mas pode ser usado diretamente
./scripts/auto-update-ec2.sh branch-name
```

## 🛠️ Solução de Problemas

### Problema: "port is already allocated"

**Solução automática:**
Os novos scripts incluem limpeza automática de portas em conflito.

**Solução manual:**
```bash
# Parar todos os containers
docker-compose down --remove-orphans

# Matar processos em portas específicas se necessário
sudo lsof -i :3000
sudo kill -9 [PID]

# Reiniciar
docker-compose up -d
```

### Problema: Script não encontrado

**Verificar permissões:**
```bash
chmod +x update.sh
chmod +x scripts/*.sh
```

**Verificar localização:**
```bash
# Execute sempre a partir do diretório raiz do projeto
cd /opt/whitelabel
pwd  # Deve mostrar /opt/whitelabel
ls -la update.sh  # Deve existir
```

## 📋 Sequência Recomendada de Uso na EC2

```bash
# 1. Conectar à EC2
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2

# 2. Ir para o diretório do projeto
cd /opt/whitelabel

# 3. Verificar status atual
docker-compose ps

# 4. Executar atualização
./update.sh copilot/fix-16492acf-49cc-45ba-8436-1e80c824d0a5

# 5. Verificar se funcionou
docker-compose ps
./scripts/test-system.sh
```

## 🔍 Logs e Monitoramento

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f whitelabel-frontend

# Verificar status dos serviços
docker-compose ps

# Testar sistema completo
./scripts/test-system.sh
```

## 🆘 Rollback Manual

Se algo der errado e o script automático falhar:

```bash
# 1. Parar serviços
docker-compose down

# 2. Voltar para commit anterior
git log --oneline -5  # Ver commits recentes
git reset --hard [COMMIT-HASH-ANTERIOR]

# 3. Reiniciar serviços
docker-compose up -d
```

## ✅ Checklist de Verificação Pós-Atualização

- [ ] Todos os containers estão "Up": `docker-compose ps`
- [ ] Frontend acessível: http://SEU-IP:3000
- [ ] Backend respondendo: http://SEU-IP:4000/health
- [ ] Evolution API funcionando: http://SEU-IP:8080
- [ ] Banco de dados conectado
- [ ] Logs sem erros críticos: `docker-compose logs`

---

**Nota:** Os scripts foram projetados para serem robustos e incluem retry automático e rollback em caso de falha. Sempre verifique os logs em caso de problemas.
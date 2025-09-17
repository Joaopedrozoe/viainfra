#!/bin/bash

# ==========================================
# SCRIPT DE TESTE E VALIDAÇÃO
# WhiteLabel MVP - Testes Completos
# ==========================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

warning_result() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

echo -e "${BLUE}"
echo "=========================================="
echo "   🧪 TESTES WHITELABEL MVP - EC2       "
echo "=========================================="
echo -e "${NC}"

echo "Iniciando testes completos do sistema..."

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Execute este script a partir do diretório raiz do projeto (/opt/whitelabel)${NC}"
    exit 1
fi

# ==========================================
# CATEGORIA 1: INFRAESTRUTURA
# ==========================================

echo -e "\n${YELLOW}📋 CATEGORIA 1: INFRAESTRUTURA${NC}"

# Teste 1.1: Sistema Operacional
lsb_release -d > /dev/null 2>&1
test_result $? "Sistema Operacional ($(lsb_release -ds 2>/dev/null || echo 'Desconhecido'))"

# Teste 1.2: Docker
docker --version > /dev/null 2>&1
test_result $? "Docker ($(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo 'N/A'))"

# Teste 1.3: Docker Compose
docker compose version > /dev/null 2>&1
test_result $? "Docker Compose ($(docker compose version 2>/dev/null | grep version | awk '{print $4}' || echo 'N/A'))"

# Teste 1.4: Node.js
node --version > /dev/null 2>&1
test_result $? "Node.js ($(node --version 2>/dev/null || echo 'N/A'))"

# Teste 1.5: Nginx
sudo systemctl is-active --quiet nginx
test_result $? "Nginx ($(nginx -v 2>&1 | cut -d' ' -f3 | cut -d'/' -f2 || echo 'N/A'))"

# ==========================================
# CATEGORIA 2: CONTAINERS DOCKER
# ==========================================

echo -e "\n${YELLOW}🐳 CATEGORIA 2: CONTAINERS DOCKER${NC}"

# Verificar se containers estão rodando
CONTAINERS_RUNNING=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l)
CONTAINERS_TOTAL=$(docker compose ps --services 2>/dev/null | wc -l)

# Teste 2.1: Containers em execução
if [ "$CONTAINERS_RUNNING" -eq "$CONTAINERS_TOTAL" ] && [ "$CONTAINERS_TOTAL" -gt 0 ]; then
    test_result 0 "Containers Docker ($CONTAINERS_RUNNING/$CONTAINERS_TOTAL rodando)"
else
    test_result 1 "Containers Docker ($CONTAINERS_RUNNING/$CONTAINERS_TOTAL rodando)"
fi

# Teste 2.2: PostgreSQL
if docker compose ps postgres 2>/dev/null | grep -q "Up"; then
    test_result 0 "Container PostgreSQL"
else
    test_result 1 "Container PostgreSQL"
fi

# Teste 2.3: Backend
if docker compose ps whitelabel-backend 2>/dev/null | grep -q "Up"; then
    test_result 0 "Container Backend"
else
    test_result 1 "Container Backend"
fi

# Teste 2.4: Evolution API
if docker compose ps evolution-api 2>/dev/null | grep -q "Up"; then
    test_result 0 "Container Evolution API"
else
    test_result 1 "Container Evolution API"
fi

# Teste 2.5: Redis
if docker compose ps redis 2>/dev/null | grep -q "Up"; then
    test_result 0 "Container Redis"
else
    test_result 1 "Container Redis"
fi

# ==========================================
# CATEGORIA 3: CONECTIVIDADE DE SERVIÇOS
# ==========================================

echo -e "\n${YELLOW}🔌 CATEGORIA 3: CONECTIVIDADE DE SERVIÇOS${NC}"

# Teste 3.1: Backend Health Check
if curl -f -s http://localhost:4000/health > /dev/null 2>&1; then
    test_result 0 "Backend Health Check"
else
    test_result 1 "Backend Health Check"
fi

# Teste 3.2: Evolution API Health Check
if curl -f -s http://localhost:8080/manager/health > /dev/null 2>&1; then
    test_result 0 "Evolution API Health Check"
else
    test_result 1 "Evolution API Health Check"
fi

# Teste 3.3: PostgreSQL Connection
if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    test_result 0 "Conexão PostgreSQL"
else
    test_result 1 "Conexão PostgreSQL"
fi

# Teste 3.4: Redis Connection
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    test_result 0 "Conexão Redis"
else
    test_result 1 "Conexão Redis"
fi

# ==========================================
# CATEGORIA 4: WEB E PROXY
# ==========================================

echo -e "\n${YELLOW}🌐 CATEGORIA 4: WEB E PROXY${NC}"

# Teste 4.1: Frontend HTTP
if curl -f -s http://localhost/ > /dev/null 2>&1; then
    test_result 0 "Frontend HTTP (porta 80)"
else
    test_result 1 "Frontend HTTP (porta 80)"
fi

# Teste 4.2: Frontend HTTPS
if curl -f -s -k https://localhost/ > /dev/null 2>&1; then
    test_result 0 "Frontend HTTPS (porta 443)"
else
    test_result 1 "Frontend HTTPS (porta 443)"
fi

# Teste 4.3: API Proxy HTTP
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    test_result 0 "API Proxy HTTP"
else
    test_result 1 "API Proxy HTTP"
fi

# Teste 4.4: API Proxy HTTPS
if curl -f -s -k https://localhost/api/health > /dev/null 2>&1; then
    test_result 0 "API Proxy HTTPS"
else
    test_result 1 "API Proxy HTTPS"
fi

# ==========================================
# CATEGORIA 5: SSL E SEGURANÇA
# ==========================================

echo -e "\n${YELLOW}🔒 CATEGORIA 5: SSL E SEGURANÇA${NC}"

# Verificar se .deploy-config existe para obter domínio
if [ -f ".deploy-config" ]; then
    source .deploy-config
    
    # Teste 5.1: Certificado SSL
    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        test_result 0 "Certificado SSL existe"
        
        # Teste 5.2: Validade do certificado
        if echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
            test_result 0 "Certificado SSL válido"
        else
            test_result 1 "Certificado SSL válido"
        fi
    else
        test_result 1 "Certificado SSL existe"
        test_result 1 "Certificado SSL válido"
    fi
else
    warning_result "Domínio não configurado (.deploy-config não encontrado)"
    test_result 1 "Certificado SSL existe"
    test_result 1 "Certificado SSL válido"
fi

# Teste 5.3: Firewall UFW
if sudo ufw status | grep -q "Status: active"; then
    test_result 0 "Firewall UFW ativo"
else
    test_result 1 "Firewall UFW ativo"
fi

# Teste 5.4: Fail2ban
if sudo systemctl is-active --quiet fail2ban; then
    test_result 0 "Fail2ban ativo"
else
    test_result 1 "Fail2ban ativo"
fi

# ==========================================
# CATEGORIA 6: BANCO DE DADOS
# ==========================================

echo -e "\n${YELLOW}🗃️ CATEGORIA 6: BANCO DE DADOS${NC}"

# Teste 6.1: Tabelas do banco
if docker compose exec -T postgres psql -U postgres -d whitelabel_mvp -c "\dt" > /dev/null 2>&1; then
    TABLES_COUNT=$(docker compose exec -T postgres psql -U postgres -d whitelabel_mvp -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$TABLES_COUNT" -gt 0 ]; then
        test_result 0 "Tabelas do banco ($TABLES_COUNT tabelas)"
    else
        test_result 1 "Tabelas do banco (0 tabelas)"
    fi
else
    test_result 1 "Acesso ao banco de dados"
fi

# Teste 6.2: Backup automático
if crontab -l 2>/dev/null | grep -q "backup.sh"; then
    test_result 0 "Backup automático configurado"
else
    test_result 1 "Backup automático configurado"
fi

# ==========================================
# CATEGORIA 7: PERFORMANCE E RECURSOS
# ==========================================

echo -e "\n${YELLOW}⚡ CATEGORIA 7: PERFORMANCE E RECURSOS${NC}"

# Teste 7.1: Uso de CPU
CPU_LOAD=$(uptime | awk -F'load average:' '{ print $2 }' | awk -F, '{ print $1 }' | sed 's/^ *//')
CPU_CORES=$(nproc)
if (( $(echo "$CPU_LOAD < $CPU_CORES" | bc -l) )); then
    test_result 0 "Carga CPU ($CPU_LOAD/$CPU_CORES cores)"
else
    test_result 1 "Carga CPU ($CPU_LOAD/$CPU_CORES cores) - Alta!"
fi

# Teste 7.2: Uso de memória
MEMORY_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    test_result 0 "Uso de memória (${MEMORY_USAGE}%)"
else
    test_result 1 "Uso de memória (${MEMORY_USAGE}%) - Alto!"
fi

# Teste 7.3: Espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    test_result 0 "Espaço em disco (${DISK_USAGE}% usado)"
else
    test_result 1 "Espaço em disco (${DISK_USAGE}% usado) - Alto!"
fi

# Teste 7.4: Tempo de resposta do backend
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:4000/health 2>/dev/null || echo "999")
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    test_result 0 "Tempo resposta backend (${RESPONSE_TIME}s)"
else
    test_result 1 "Tempo resposta backend (${RESPONSE_TIME}s) - Lento!"
fi

# ==========================================
# CATEGORIA 8: MONITORAMENTO
# ==========================================

echo -e "\n${YELLOW}📊 CATEGORIA 8: MONITORAMENTO${NC}"

# Teste 8.1: Logs do sistema
if [ -d "/opt/whitelabel/logs" ] && [ "$(ls -A /opt/whitelabel/logs 2>/dev/null | wc -l)" -gt 0 ]; then
    test_result 0 "Logs do sistema"
else
    test_result 1 "Logs do sistema"
fi

# Teste 8.2: Monitoramento automático
if crontab -l 2>/dev/null | grep -q "monitor.sh"; then
    test_result 0 "Monitoramento automático"
else
    test_result 1 "Monitoramento automático"
fi

# Teste 8.3: Rotação de logs
if [ -f "/etc/logrotate.d/whitelabel" ]; then
    test_result 0 "Rotação de logs configurada"
else
    test_result 1 "Rotação de logs configurada"
fi

# ==========================================
# CATEGORIA 9: TESTES FUNCIONAIS
# ==========================================

echo -e "\n${YELLOW}🎯 CATEGORIA 9: TESTES FUNCIONAIS${NC}"

# Teste 9.1: Endpoint de autenticação
if curl -f -s -X POST -H "Content-Type: application/json" -d '{}' http://localhost:4000/api/auth/login 2>/dev/null | grep -q "email"; then
    test_result 0 "Endpoint de autenticação"
else
    test_result 1 "Endpoint de autenticação"
fi

# Teste 9.2: WebSocket Server
if curl -f -s http://localhost:4000/socket.io/socket.io.js > /dev/null 2>&1; then
    test_result 0 "Servidor WebSocket"
else
    test_result 1 "Servidor WebSocket"
fi

# Teste 9.3: Evolution API Manager
EVOLUTION_KEY=$(grep EVOLUTION_API_KEY .env 2>/dev/null | cut -d'=' -f2 || echo "")
if [ ! -z "$EVOLUTION_KEY" ] && curl -f -s -H "apikey: $EVOLUTION_KEY" http://localhost:8080/manager/instance > /dev/null 2>&1; then
    test_result 0 "Evolution API Manager"
else
    test_result 1 "Evolution API Manager"
fi

# ==========================================
# RESULTADOS FINAIS
# ==========================================

echo -e "\n${BLUE}"
echo "=========================================="
echo "       📊 RESULTADOS DOS TESTES         "
echo "=========================================="
echo -e "${NC}"

SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))

echo -e "Total de testes: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Testes aprovados: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Testes falharam: ${RED}$TESTS_FAILED${NC}"
echo -e "Taxa de sucesso: ${BLUE}$SUCCESS_RATE%${NC}"

echo ""

if [ "$SUCCESS_RATE" -ge 90 ]; then
    echo -e "${GREEN}🎉 EXCELENTE! Sistema funcionando perfeitamente.${NC}"
    echo -e "${GREEN}✅ Deploy foi bem-sucedido e sistema está pronto para produção.${NC}"
elif [ "$SUCCESS_RATE" -ge 75 ]; then
    echo -e "${YELLOW}⚠️ BOM! Sistema funcionando, mas com alguns pontos de atenção.${NC}"
    echo -e "${YELLOW}📋 Revise os testes que falharam para otimizar o sistema.${NC}"
elif [ "$SUCCESS_RATE" -ge 50 ]; then
    echo -e "${YELLOW}⚠️ ATENÇÃO! Sistema parcialmente funcional.${NC}"
    echo -e "${YELLOW}🔧 É necessário corrigir os problemas identificados.${NC}"
else
    echo -e "${RED}❌ CRÍTICO! Sistema com muitos problemas.${NC}"
    echo -e "${RED}🚨 Revise urgentemente a configuração e deploy.${NC}"
fi

echo ""
echo -e "${BLUE}📋 Comandos úteis para diagnóstico:${NC}"
echo "   - Ver logs: docker compose logs -f"
echo "   - Status containers: docker compose ps"
echo "   - Status sistema: ./scripts/status.sh"
echo "   - Reiniciar serviços: docker compose restart"

echo ""
echo -e "${BLUE}📞 Para suporte:${NC}"
echo "   - Consulte o GUIA_DEPLOY_COMPLETO_EC2.md"
echo "   - Verifique os logs dos containers"
echo "   - Execute este teste novamente após correções"

# Salvar resultado
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Teste executado: $TESTS_PASSED/$TOTAL_TESTS ($SUCCESS_RATE%)" >> logs/test-results.log

exit 0
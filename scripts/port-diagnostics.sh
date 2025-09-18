#!/bin/bash

# ==========================================
# PORT DIAGNOSTICS AND CLEANUP
# WhiteLabel MVP - Diagnóstico de Portas
# ==========================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️ $1${NC}"
}

echo "🔍 DIAGNÓSTICO DE PORTAS - WhiteLabel MVP"
echo "========================================"

# Portas utilizadas pelo sistema
PORTS=(3000 4000 5432 6379 8080)
PORT_NAMES=("Frontend" "Backend" "PostgreSQL" "Redis" "Evolution API")

echo ""
log "Verificando portas utilizadas pelo sistema..."
echo ""

conflicts_found=false

for i in "${!PORTS[@]}"; do
    port="${PORTS[$i]}"
    name="${PORT_NAMES[$i]}"
    
    if lsof -i ":$port" > /dev/null 2>&1; then
        conflicts_found=true
        echo -e "${RED}🔴 Porta $port ($name) está em uso:${NC}"
        
        # Mostrar detalhes do processo
        lsof -i ":$port" | while read line; do
            if [[ ! "$line" =~ ^COMMAND ]]; then
                pid=$(echo "$line" | awk '{print $2}')
                cmd=$(echo "$line" | awk '{print $1}')
                echo "   └─ PID: $pid, Comando: $cmd"
            fi
        done
        echo ""
    else
        echo -e "${GREEN}🟢 Porta $port ($name) disponível${NC}"
    fi
done

echo ""
echo "========================================"

if [ "$conflicts_found" = false ]; then
    log "✅ Todas as portas estão disponíveis!"
    echo ""
    info "O sistema pode ser iniciado sem conflitos."
    echo "Execute: docker-compose up -d"
else
    warning "❌ Conflitos de porta detectados!"
    echo ""
    echo "OPÇÕES DE RESOLUÇÃO:"
    echo ""
    echo "1. 🔧 LIMPEZA AUTOMÁTICA (Recomendado):"
    echo "   ./update.sh  # Inclui limpeza automática"
    echo "   ./scripts/quick-update.sh <branch>"
    echo ""
    echo "2. 🛑 PARAR CONTAINERS DOCKER:"
    echo "   docker-compose down --remove-orphans"
    echo "   docker ps -a  # Verificar containers órfãos"
    echo ""
    echo "3. 💀 KILL MANUAL DOS PROCESSOS:"
    for i in "${!PORTS[@]}"; do
        port="${PORTS[$i]}"
        if lsof -i ":$port" > /dev/null 2>&1; then
            pid=$(lsof -t -i ":$port" | head -1)
            echo "   sudo kill -9 $pid  # Porta $port"
        fi
    done
    echo ""
    echo "4. 🔄 RESTART COMPLETO:"
    echo "   sudo systemctl restart docker"
    echo "   docker-compose up -d"
    echo ""
fi

# Mostrar status do Docker
echo "========================================"
log "Status do Docker:"
echo ""

if command -v docker > /dev/null; then
    if docker ps > /dev/null 2>&1; then
        container_count=$(docker ps -q | wc -l)
        if [ "$container_count" -gt 0 ]; then
            info "🐳 $container_count containers rodando:"
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        else
            info "🐳 Nenhum container rodando"
        fi
        
        # Containers parados
        stopped_count=$(docker ps -a --filter "status=exited" -q | wc -l)
        if [ "$stopped_count" -gt 0 ]; then
            warning "⏹️ $stopped_count containers parados encontrados"
            echo "Para limpar: docker container prune -f"
        fi
    else
        warning "Docker não está rodando ou não há permissão"
    fi
else
    warning "Docker não está instalado"
fi

echo ""
echo "========================================"
info "Para mais informações, consulte: INSTRUCOES_ATUALIZACAO.md"
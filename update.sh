#!/bin/bash

# ==========================================
# WHITELABEL MVP - SCRIPT DE ATUALIZAÇÃO
# ==========================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERRO: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ AVISO: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️ INFO: $1${NC}"
}

echo "🚀 WHITELABEL MVP - SISTEMA DE ATUALIZAÇÃO"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Verificar argumentos especiais
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "USO:"
    echo "  $0                    # Atualizar para branch main"
    echo "  $0 <branch-name>      # Atualizar para branch específico"
    echo ""
    echo "EXEMPLOS:"
    echo "  $0                                                    # Atualização padrão"
    echo "  $0 copilot/fix-16492acf-49cc-45ba-8436-1e80c824d0a5  # Branch específico"
    exit 0
fi

# Se um branch for fornecido como argumento, usar o quick-update
if [ ! -z "$1" ]; then
    log "Usando quick-update para branch: $1"
    if [ -f "./scripts/quick-update.sh" ]; then
        ./scripts/quick-update.sh "$1"
    else
        error "Script quick-update.sh não encontrado em ./scripts/"
        exit 1
    fi
else
    # Atualização padrão para main branch
    log "Executando atualização padrão para branch main"
    
    # Fazer fetch das mudanças
    log "📥 Fazendo fetch das mudanças..."
    git fetch --all --prune
    
    # Resetar para main
    log "🔄 Atualizando para branch main..."
    git reset --hard origin/main
    
    # Parar serviços existentes
    log "⏹️ Parando serviços..."
    docker-compose down --remove-orphans
    
    # Rebuild e restart
    log "🚀 Rebuilding e reiniciando serviços..."
    docker-compose build --no-cache
    docker-compose up -d
    
    log "✅ Atualização concluída!"
    log "📊 Para verificar status: docker-compose ps"
    log "📋 Para ver logs: docker-compose logs -f"
fi
#!/bin/bash

# ==========================================
# QUICK UPDATE - WhiteLabel MVP
# Script de atualização rápida para branches específicos
# ==========================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

# Função para limpar portas
cleanup_ports() {
    log "🧹 Limpando portas em uso..."
    
    # Parar todos os containers docker
    docker-compose down --remove-orphans --timeout 30 2>/dev/null || true
    
    # Matar processos em portas específicas se necessário
    for port in 3000 4000 5432 6379 8080; do
        PID=$(lsof -t -i ":$port" 2>/dev/null | head -1)
        if [ ! -z "$PID" ]; then
            warning "Porta $port em uso por PID $PID, finalizando processo..."
            kill -15 "$PID" 2>/dev/null || true
            sleep 2
            # Force kill se ainda estiver rodando
            if ps -p "$PID" > /dev/null 2>&1; then
                kill -9 "$PID" 2>/dev/null || true
            fi
        fi
    done
    
    # Limpar networks órfãos
    docker network prune -f 2>/dev/null || true
    
    success "Limpeza de portas concluída"
}

# Função de rollback em caso de falha
rollback() {
    local commit_hash="$1"
    warning "🚨 Falha crítica detectada. Iniciando rollback automático..."
    
    log "🔄 Realizando rollback para commit: $commit_hash"
    
    # Parar serviços
    log "⏹️ Parando serviços..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Voltar para commit anterior
    git reset --hard "$commit_hash"
    
    # Limpar portas antes de reiniciar
    cleanup_ports
    
    # Reiniciar serviços
    log "🚀 Reiniciando serviços..."
    docker-compose up -d
    
    error "Rollback concluído. Sistema voltou ao estado anterior."
}

echo ""
echo -e "${PURPLE}🚀 QUICK UPDATE - WhiteLabel MVP${NC}"
echo ""

# Verificar argumentos
if [ -z "$1" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo ""
        echo "🚀 QUICK UPDATE - WhiteLabel MVP"
        echo "================================="
        echo ""
        echo "DESCRIÇÃO:"
        echo "  Script de atualização rápida para branches específicos"
        echo ""
        echo "USO:"
        echo "  $0 <branch-name>"
        echo ""
        echo "EXEMPLOS:"
        echo "  $0 main"
        echo "  $0 copilot/fix-16492acf-49cc-45ba-8436-1e80c824d0a5"
        echo "  $0 feature/new-feature"
        echo ""
        echo "O script irá:"
        echo "  1. Criar backup do sistema atual"
        echo "  2. Parar todos os serviços"
        echo "  3. Atualizar código para o branch especificado"
        echo "  4. Reiniciar serviços com retry automático"
        echo "  5. Fazer rollback em caso de falha"
        echo ""
        exit 0
    else
        error "Branch não especificado"
        echo "Uso: $0 <branch-name>"
        echo "Exemplo: $0 copilot/fix-16492acf-49cc-45ba-8436-1e80c824d0a5"
        echo "Para mais informações: $0 --help"
        exit 1
    fi
fi

BRANCH_NAME="$1"
PROJECT_DIR="/opt/whitelabel"
BACKUP_DIR="$PROJECT_DIR/backups"

log "Iniciando atualização para branch: $BRANCH_NAME"

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Salvar commit atual para rollback
CURRENT_COMMIT=$(git rev-parse HEAD)

# Executar o script de auto-update
if [ -f "./scripts/auto-update-ec2.sh" ]; then
    ./scripts/auto-update-ec2.sh "$BRANCH_NAME"
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -ne 0 ]; then
        error "Falha no auto-update-ec2.sh"
        rollback "$CURRENT_COMMIT"
        exit 1
    fi
else
    # Se o auto-update-ec2.sh não existir, executar update inline
    warning "auto-update-ec2.sh não encontrado, executando update inline..."
    
    echo ""
    echo "=========================================="
    echo -e "${BLUE}   🚀 AUTO UPDATE EC2 - WHITELABEL MVP${NC}"
    echo -e "\033[0m=========================================="
    echo ""
    
    log "🚀 Iniciando atualização automática para branch: $BRANCH_NAME"
    
    # 1. Backup
    log "💾 Criando backup antes da atualização..."
    BACKUP_NAME="update_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup do banco se estiver rodando
    if docker-compose ps postgres | grep -q "Up"; then
        log "📊 Fazendo backup do banco de dados..."
        docker-compose exec -T postgres pg_dump -U postgres whitelabel_mvp > "$BACKUP_DIR/$BACKUP_NAME/database.sql" 2>/dev/null || true
    fi
    
    success "Backup criado em: $BACKUP_DIR/$BACKUP_NAME"
    
    # 2. Parar serviços
    log "⏹️ Parando serviços atuais..."
    cleanup_ports
    
    # 3. Atualizar código
    log "📥 Atualizando código do repositório..."
    git fetch --all --prune
    
    log "🔄 Resetando para branch: $BRANCH_NAME"
    if ! git reset --hard "origin/$BRANCH_NAME"; then
        error "Falha ao resetar para branch $BRANCH_NAME"
        rollback "$CURRENT_COMMIT"
        exit 1
    fi
    
    # 4. Iniciar serviços
    log "🚀 Iniciando serviços atualizados..."
    
    # Tentar iniciar com retry
    RETRY_COUNT=0
    MAX_RETRIES=3
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        cleanup_ports
        sleep 5
        
        if docker-compose up -d; then
            success "Serviços iniciados com sucesso!"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            warning "Tentativa $RETRY_COUNT de $MAX_RETRIES falhou, tentando novamente..."
            
            if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
                error "Falha ao iniciar os serviços"
                rollback "$CURRENT_COMMIT"
                exit 1
            fi
        fi
    done
fi

# Verificar se os serviços estão funcionando
sleep 10
log "🔍 Verificando status dos serviços..."

if docker-compose ps | grep -q "Up"; then
    success "Atualização concluída com sucesso!"
    echo ""
    log "📊 Status dos serviços:"
    docker-compose ps
    echo ""
    log "📋 Para monitorar logs: docker-compose logs -f"
    log "🧪 Para testar sistema: ./scripts/test-system.sh"
else
    error "Alguns serviços não estão funcionando corretamente"
    warning "Execute 'docker-compose ps' para verificar o status"
    warning "Execute 'docker-compose logs' para ver os logs de erro"
fi

echo ""
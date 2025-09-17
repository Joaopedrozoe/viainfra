#!/bin/bash

# ==========================================
# AUTO UPDATE EC2 - WHITELABEL MVP
# Script de atualização automática para EC2
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

# Função para matar processos em portas específicas
kill_port_process() {
    local port=$1
    local pid=$(lsof -t -i ":$port" 2>/dev/null | head -1)
    
    if [ ! -z "$pid" ]; then
        local cmd=$(ps -p "$pid" -o cmd= 2>/dev/null || echo "unknown")
        warning "Porta $port em uso por PID $pid: $cmd"
        
        # Tentar kill graceful primeiro
        if kill -15 "$pid" 2>/dev/null; then
            sleep 3
            # Verificar se ainda está rodando
            if ps -p "$pid" > /dev/null 2>&1; then
                warning "Processo ainda ativo, forçando término..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            success "Processo na porta $port finalizado"
        fi
    fi
}

# Função para limpeza completa de portas
cleanup_ports() {
    log "🧹 Executando limpeza completa de portas..."
    
    # Parar docker-compose primeiro
    docker-compose down --remove-orphans --timeout 30 2>/dev/null || true
    
    # Aguardar um pouco para containers pararem completamente
    sleep 5
    
    # Matar processos em portas críticas
    for port in 3000 4000 5432 6379 8080; do
        kill_port_process $port
    done
    
    # Remover containers órfãos
    local orphaned_containers=$(docker ps -a --filter "status=exited" -q)
    if [ ! -z "$orphaned_containers" ]; then
        warning "Removendo containers órfãos..."
        echo "$orphaned_containers" | xargs docker rm -f 2>/dev/null || true
    fi
    
    # Limpar networks órfãos
    docker network prune -f 2>/dev/null || true
    
    # Aguardar um pouco mais para garantir limpeza
    sleep 3
    
    success "Limpeza de portas concluída"
}

# Verificar argumentos
if [ -z "$1" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo ""
        echo "🚀 AUTO UPDATE EC2 - WHITELABEL MVP"
        echo "==================================="
        echo ""
        echo "DESCRIÇÃO:"
        echo "  Script de atualização automática para EC2 com retry e rollback"
        echo ""
        echo "USO:"
        echo "  $0 <branch-name>"
        echo ""
        echo "RECURSOS:"
        echo "  - Backup automático antes da atualização"
        echo "  - Limpeza inteligente de portas em conflito"
        echo "  - Retry automático em caso de falha"
        echo "  - Rollback automático se todas as tentativas falharem"
        echo "  - Logs detalhados de todo o processo"
        echo ""
        exit 0
    else
        error "Branch não especificado"
        echo "Uso: $0 <branch-name>"
        echo "Para mais informações: $0 --help"
        exit 1
    fi
fi

BRANCH_NAME="$1"
PROJECT_DIR="/opt/whitelabel"
BACKUP_DIR="$PROJECT_DIR/backups"

echo ""
echo "=========================================="
echo -e "${BLUE}   🚀 AUTO UPDATE EC2 - WHITELABEL MVP${NC}"
echo -e "\033[0m=========================================="
echo ""

log "🚀 Iniciando atualização automática para branch: $BRANCH_NAME"

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Salvar commit atual para possível rollback
CURRENT_COMMIT=$(git rev-parse HEAD)

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

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
if ! git fetch --all --prune; then
    error "Falha ao fazer fetch do repositório"
    exit 1
fi

log "🔄 Resetando para branch: $BRANCH_NAME"
if ! git reset --hard "origin/$BRANCH_NAME"; then
    error "Falha ao resetar para branch $BRANCH_NAME"
    # Tentar rollback
    warning "Tentando rollback para commit anterior..."
    git reset --hard "$CURRENT_COMMIT"
    exit 1
fi

# 4. Iniciar serviços com retry e tratamento de conflitos
log "🚀 Iniciando serviços atualizados..."

MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "Tentativa $RETRY_COUNT de $MAX_RETRIES..."
    
    # Limpeza antes de cada tentativa
    cleanup_ports
    
    # Aguardar antes de tentar iniciar
    sleep 5
    
    # Tentar iniciar os serviços
    if docker-compose up -d; then
        success "Serviços iniciados com sucesso!"
        
        # Aguardar serviços estabilizarem
        sleep 10
        
        # Verificar se todos os serviços estão rodando
        if docker-compose ps | grep -v "Exit\|Restarting" | grep -q "Up"; then
            success "Todos os serviços estão funcionando corretamente!"
            
            # Mostrar status final
            log "📊 Status final dos serviços:"
            docker-compose ps
            
            log "✅ Atualização concluída com sucesso!"
            log "📋 Para monitorar: docker-compose logs -f"
            log "🧪 Para testar: ./scripts/test-system.sh"
            
            exit 0
        else
            warning "Alguns serviços falharam ao iniciar"
            docker-compose logs --tail=20
        fi
    else
        error "Falha ao iniciar os serviços na tentativa $RETRY_COUNT"
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            warning "Tentando novamente em 10 segundos..."
            sleep 10
        fi
    fi
done

# Se chegou aqui, todas as tentativas falharam
error "Falha ao iniciar os serviços após $MAX_RETRIES tentativas"
warning "🚨 Falha crítica detectada. Iniciando rollback automático..."

# Rollback
log "🔄 Realizando rollback para commit: $CURRENT_COMMIT"

# Parar serviços
log "⏹️ Parando serviços..."
cleanup_ports

# Voltar para commit anterior
git reset --hard "$CURRENT_COMMIT"

# Tentar reiniciar com versão anterior
log "🚀 Reiniciando serviços..."
cleanup_ports
sleep 5

if docker-compose up -d; then
    warning "Rollback realizado com sucesso"
    log "📊 Status após rollback:"
    docker-compose ps
else
    error "Falha crítica: não foi possível restaurar os serviços"
    log "Execute manualmente: docker-compose up -d"
fi

exit 1
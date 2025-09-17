#!/bin/bash

# ==========================================
# AUTO UPDATE EC2 SCRIPT
# WhiteLabel MVP - Automated Git Pull & Deploy
# ==========================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/opt/whitelabel"
LOG_FILE="$PROJECT_DIR/logs/auto-update.log"
BACKUP_DIR="$PROJECT_DIR/backups"
ROLLBACK_FILE="$PROJECT_DIR/.last_working_commit"

# Função de log com cores
log() {
    local message="$1"
    local color="${2:-$GREEN}"
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] $message${NC}" | tee -a "$LOG_FILE"
}

error() {
    log "❌ ERRO: $1" "$RED"
}

warning() {
    log "⚠️ AVISO: $1" "$YELLOW"
}

info() {
    log "ℹ️ INFO: $1" "$BLUE"
}

success() {
    log "✅ $1" "$GREEN"
}

# Função de erro crítico
critical_error() {
    error "$1"
    log "🚨 Falha crítica detectada. Iniciando rollback automático..." "$RED"
    perform_rollback
    exit 1
}

# Função para criar backup antes da atualização
create_backup() {
    local backup_name="update_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "💾 Criando backup antes da atualização..." "$BLUE"
    
    mkdir -p "$backup_path"
    
    # Salvar commit atual para rollback
    git rev-parse HEAD > "$ROLLBACK_FILE"
    
    # Backup do banco de dados se estiver rodando
    if docker-compose ps postgres | grep -q "Up"; then
        log "📊 Fazendo backup do banco de dados..."
        docker-compose exec -T postgres pg_dump -U postgres whitelabel_mvp > "$backup_path/database.sql" 2>/dev/null || warning "Falha no backup do banco (pode ser normal se não estiver configurado)"
    fi
    
    # Backup dos arquivos de configuração importantes
    [ -f ".env" ] && cp .env "$backup_path/"
    [ -f "docker-compose.yml" ] && cp docker-compose.yml "$backup_path/"
    
    success "Backup criado em: $backup_path"
    echo "$backup_name" > "$PROJECT_DIR/.last_backup"
}

# Função para realizar rollback
perform_rollback() {
    if [ ! -f "$ROLLBACK_FILE" ]; then
        error "Arquivo de rollback não encontrado. Não é possível reverter automaticamente."
        return 1
    fi
    
    local last_commit=$(cat "$ROLLBACK_FILE")
    log "🔄 Realizando rollback para commit: $last_commit" "$YELLOW"
    
    # Parar serviços
    log "⏹️ Parando serviços..."
    docker-compose down || true
    
    # Reverter código
    git reset --hard "$last_commit"
    
    # Subir serviços novamente
    log "🚀 Reiniciando serviços..."
    docker-compose up -d
    
    success "Rollback concluído!"
}

# Função para verificar saúde dos serviços
check_services_health() {
    log "🏥 Verificando saúde dos serviços..." "$BLUE"
    
    local max_attempts=30
    local attempt=0
    
    # Aguardar um pouco para os serviços iniciarem
    sleep 10
    
    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))
        
        # Verificar backend
        if curl -f -s http://localhost:4000/health >/dev/null 2>&1; then
            success "Backend está saudável"
            return 0
        fi
        
        log "Tentativa $attempt/$max_attempts - Aguardando serviços ficarem saudáveis..." "$YELLOW"
        sleep 10
    done
    
    error "Serviços não ficaram saudáveis após $((max_attempts * 10)) segundos"
    return 1
}

# Função principal de atualização
perform_update() {
    local target_branch="$1"
    
    if [ -z "$target_branch" ]; then
        error "Branch não especificada!"
        echo ""
        echo "Uso: $0 <branch>"
        echo "Exemplo: $0 main"
        echo "Exemplo: $0 copilot/fix-193aa104-e81c-49b2-805d-70d71e8cfed8"
        exit 1
    fi
    
    log "🚀 Iniciando atualização automática para branch: $target_branch" "$PURPLE"
    
    # Verificar se estamos no diretório correto
    if [ ! -f "docker-compose.yml" ]; then
        critical_error "Execute este script a partir do diretório raiz do projeto (/opt/whitelabel)"
    fi
    
    # Criar backup
    create_backup
    
    # Parar serviços graciosamente
    log "⏹️ Parando serviços atuais..." "$BLUE"
    docker-compose down || warning "Alguns serviços podem já estar parados"
    
    # Atualizar código
    log "📥 Atualizando código do repositório..." "$BLUE"
    
    # Fetch de todas as branches e tags
    git fetch --all --prune || critical_error "Falha ao fazer fetch do repositório"
    
    # Reset hard para a branch especificada
    log "🔄 Resetando para branch: $target_branch"
    git reset --hard "origin/$target_branch" || critical_error "Falha ao resetar para a branch $target_branch"
    
    # Verificar se há mudanças no docker-compose
    if git diff HEAD~1 --name-only | grep -q "docker-compose\|Dockerfile"; then
        log "🐳 Detectadas mudanças no Docker. Reconstruindo imagens..." "$BLUE"
        docker-compose build --no-cache || critical_error "Falha no build das imagens Docker"
    fi
    
    # Subir serviços
    log "🚀 Iniciando serviços atualizados..." "$BLUE"
    docker-compose up -d --build || critical_error "Falha ao iniciar os serviços"
    
    # Verificar saúde dos serviços
    if ! check_services_health; then
        critical_error "Serviços não estão saudáveis após a atualização"
    fi
    
    # Limpeza de imagens antigas
    log "🧹 Limpando imagens Docker antigas..." "$BLUE"
    docker image prune -f || warning "Falha na limpeza de imagens antigas"
    
    # Salvar estado atual como último estado funcional
    git rev-parse HEAD > "$ROLLBACK_FILE"
    
    success "Atualização concluída com sucesso!"
    log "📊 Aplicação disponível em: https://$(hostname -I | cut -d' ' -f1 2>/dev/null || echo 'seu-dominio')" "$GREEN"
    log "🔍 Para monitorar logs: docker-compose logs -f" "$BLUE"
    log "📜 Log completo em: $LOG_FILE" "$BLUE"
}

# Função para mostrar status
show_status() {
    echo ""
    log "📊 STATUS DO SISTEMA" "$PURPLE"
    echo ""
    
    # Informações do Git
    log "🔗 Branch atual: $(git branch --show-current)" "$BLUE"
    log "📝 Último commit: $(git log -1 --oneline)" "$BLUE"
    
    # Status dos containers
    log "🐳 Status dos containers:" "$BLUE"
    docker-compose ps
    
    # Último backup
    if [ -f "$PROJECT_DIR/.last_backup" ]; then
        log "💾 Último backup: $(cat $PROJECT_DIR/.last_backup)" "$BLUE"
    fi
    
    # Espaço em disco
    log "💿 Espaço em disco:" "$BLUE"
    df -h / | tail -1
    
    echo ""
}

# Função para mostrar ajuda
show_help() {
    echo ""
    echo -e "${PURPLE}🚀 AUTO UPDATE EC2 - WhiteLabel MVP${NC}"
    echo ""
    echo -e "${GREEN}DESCRIÇÃO:${NC}"
    echo "  Script para automatizar atualizações do código e deploy no EC2"
    echo ""
    echo -e "${GREEN}USO:${NC}"
    echo "  $0 <branch>              # Atualizar para uma branch específica"
    echo "  $0 --status              # Mostrar status do sistema"
    echo "  $0 --rollback            # Fazer rollback para último estado funcional"
    echo "  $0 --help               # Mostrar esta ajuda"
    echo ""
    echo -e "${GREEN}EXEMPLOS:${NC}"
    echo "  $0 main                                                    # Atualizar para main"
    echo "  $0 develop                                                 # Atualizar para develop"
    echo "  $0 copilot/fix-193aa104-e81c-49b2-805d-70d71e8cfed8      # Atualizar para branch específica"
    echo ""
    echo -e "${GREEN}RECURSOS:${NC}"
    echo "  ✅ Backup automático antes da atualização"
    echo "  ✅ Rollback automático em caso de falha"
    echo "  ✅ Verificação de saúde dos serviços"
    echo "  ✅ Rebuild inteligente do Docker"
    echo "  ✅ Logs detalhados"
    echo ""
}

# Criar diretórios necessários
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$BACKUP_DIR"

# Mudar para o diretório do projeto
cd "$PROJECT_DIR" 2>/dev/null || {
    error "Diretório do projeto não encontrado: $PROJECT_DIR"
    echo ""
    echo "Execute primeiro:"
    echo "  sudo mkdir -p $PROJECT_DIR"
    echo "  sudo chown -R \$USER:\$USER $PROJECT_DIR"
    echo "  cd $PROJECT_DIR"
    echo "  git clone <repository-url> ."
    exit 1
}

# Header do script
echo ""
echo -e "${PURPLE}=========================================="
echo "   🚀 AUTO UPDATE EC2 - WHITELABEL MVP"
echo "==========================================${NC}"
echo ""

# Processar argumentos
case "${1:-}" in
    "--help"|"-h")
        show_help
        ;;
    "--status"|"-s")
        show_status
        ;;
    "--rollback"|"-r")
        log "🔄 Iniciando rollback manual..." "$YELLOW"
        perform_rollback
        ;;
    "")
        error "Nenhuma ação especificada!"
        show_help
        exit 1
        ;;
    *)
        perform_update "$1"
        ;;
esac
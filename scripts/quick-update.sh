#!/bin/bash

# ==========================================
# QUICK UPDATE WRAPPER
# Wrapper script para facilitar atualizações rápidas
# ==========================================

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/opt/whitelabel"

# Função de log
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️ $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "$PROJECT_DIR/scripts/auto-update-ec2.sh" ]; then
    error "Script de atualização não encontrado em $PROJECT_DIR"
    echo ""
    echo "Execute primeiro:"
    echo "  cd $PROJECT_DIR"
    echo "  git clone https://github.com/Joaopedrozoe/viainfra.git ."
    exit 1
fi

# Header
echo ""
echo -e "${BLUE}🚀 QUICK UPDATE - WhiteLabel MVP${NC}"
echo ""

# Se nenhum argumento foi passado, mostrar opções
if [ $# -eq 0 ]; then
    echo "Escolha uma opção:"
    echo ""
    echo "1) Atualizar para branch MAIN"
    echo "2) Atualizar para branch DEVELOP" 
    echo "3) Atualizar para branch específica"
    echo "4) Ver status do sistema"
    echo "5) Fazer rollback"
    echo ""
    read -p "Digite sua opção (1-5): " option
    
    case $option in
        1)
            branch="main"
            ;;
        2)
            branch="develop"
            ;;
        3)
            read -p "Digite o nome da branch: " branch
            ;;
        4)
            cd "$PROJECT_DIR" && ./scripts/auto-update-ec2.sh --status
            exit 0
            ;;
        5)
            cd "$PROJECT_DIR" && ./scripts/auto-update-ec2.sh --rollback
            exit 0
            ;;
        *)
            error "Opção inválida!"
            exit 1
            ;;
    esac
else
    # Usar o primeiro argumento como branch
    branch="$1"
fi

# Executar atualização
log "Iniciando atualização para branch: $branch"
cd "$PROJECT_DIR" && ./scripts/auto-update-ec2.sh "$branch"
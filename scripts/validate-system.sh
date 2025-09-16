#!/bin/bash

# ==========================================
# SCRIPT DE VALIDAÇÃO PRÉ-DEPLOY
# WhiteLabel MVP - Verificações
# ==========================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "   ✅ VALIDAÇÃO PRÉ-DEPLOY              "
echo "=========================================="
echo -e "${NC}"

CHECKS_PASSED=0
TOTAL_CHECKS=0

check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

echo "Verificando se o sistema está pronto para deploy..."

# ==========================================
# VERIFICAÇÕES DE ARQUIVOS
# ==========================================

echo -e "\n${YELLOW}📁 VERIFICAÇÕES DE ARQUIVOS${NC}"

# Verificar se está no diretório correto
[ -f "docker-compose.yml" ]
check $? "docker-compose.yml presente"

[ -f "package.json" ]
check $? "package.json (frontend) presente"

[ -f "backend/package.json" ]
check $? "backend/package.json presente"

[ -f "database-setup.sql" ]
check $? "database-setup.sql presente"

[ -d "scripts" ]
check $? "Diretório scripts presente"

# ==========================================
# VERIFICAÇÕES DE SCRIPTS
# ==========================================

echo -e "\n${YELLOW}📜 VERIFICAÇÕES DE SCRIPTS${NC}"

[ -x "scripts/setup-server.sh" ]
check $? "scripts/setup-server.sh executável"

[ -x "scripts/deploy-ec2.sh" ]
check $? "scripts/deploy-ec2.sh executável"

[ -x "scripts/test-system.sh" ]
check $? "scripts/test-system.sh executável"

[ -x "scripts/generate-secrets.sh" ]
check $? "scripts/generate-secrets.sh executável"

# ==========================================
# VERIFICAÇÕES DE CONFIGURAÇÃO
# ==========================================

echo -e "\n${YELLOW}⚙️ VERIFICAÇÕES DE CONFIGURAÇÃO${NC}"

# Verificar .env
if [ -f ".env" ]; then
    check 0 "Arquivo .env presente"
    
    # Verificar se ainda tem placeholders
    if grep -q "CHANGE_THIS_" .env; then
        check 1 "Arquivo .env configurado (ainda tem placeholders)"
        warning "Execute: ./scripts/generate-secrets.sh para configurar"
    else
        check 0 "Arquivo .env configurado"
    fi
    
    # Verificar permissões
    PERMS=$(stat -c %a .env)
    if [ "$PERMS" = "600" ]; then
        check 0 "Permissões .env corretas (600)"
    else
        check 1 "Permissões .env corretas (atual: $PERMS)"
        warning "Execute: chmod 600 .env"
    fi
else
    if [ -f ".env.template" ]; then
        check 1 "Arquivo .env presente (apenas template encontrado)"
        warning "Execute: ./scripts/generate-secrets.sh para criar .env"
    else
        check 1 "Arquivo .env presente (nem .env nem .env.template)"
    fi
fi

# ==========================================
# VERIFICAÇÕES DE DEPENDÊNCIAS
# ==========================================

echo -e "\n${YELLOW}📦 VERIFICAÇÕES DE DEPENDÊNCIAS${NC}"

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check 0 "Node.js instalado ($NODE_VERSION)"
else
    check 1 "Node.js instalado"
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check 0 "npm instalado ($NPM_VERSION)"
else
    check 1 "npm instalado"
fi

# Verificar dependências do frontend
if [ -d "node_modules" ]; then
    check 0 "Dependências frontend instaladas"
else
    check 1 "Dependências frontend instaladas"
    warning "Execute: npm install"
fi

# Verificar dependências do backend
if [ -d "backend/node_modules" ]; then
    check 0 "Dependências backend instaladas"
else
    check 1 "Dependências backend instaladas"
    warning "Execute: cd backend && npm install"
fi

# ==========================================
# VERIFICAÇÕES DE BUILD
# ==========================================

echo -e "\n${YELLOW}🔨 VERIFICAÇÕES DE BUILD${NC}"

# Verificar se frontend builda
if npm run build > /dev/null 2>&1; then
    check 0 "Frontend build funciona"
else
    check 1 "Frontend build funciona"
    warning "Problemas no build do frontend"
fi

# Verificar se backend builda
if cd backend && npm run build > /dev/null 2>&1; then
    check 0 "Backend build funciona"
    cd ..
else
    check 1 "Backend build funciona"
    warning "Problemas no build do backend"
    cd ..
fi

# ==========================================
# VERIFICAÇÕES DE DOCKER
# ==========================================

echo -e "\n${YELLOW}🐳 VERIFICAÇÕES DE DOCKER${NC}"

# Verificar se Docker está disponível
if command -v docker &> /dev/null; then
    check 0 "Docker disponível"
    
    # Verificar se Docker está rodando
    if docker info > /dev/null 2>&1; then
        check 0 "Docker está rodando"
    else
        check 1 "Docker está rodando"
        warning "Docker não está rodando ou sem permissões"
    fi
else
    check 1 "Docker disponível"
fi

# Verificar Docker Compose
if command -v docker-compose &> /dev/null; then
    check 0 "Docker Compose disponível"
else
    check 1 "Docker Compose disponível"
fi

# ==========================================
# VERIFICAÇÕES DE SEGURANÇA
# ==========================================

echo -e "\n${YELLOW}🔒 VERIFICAÇÕES DE SEGURANÇA${NC}"

# Verificar se .env está no .gitignore
if grep -q ".env" .gitignore 2>/dev/null; then
    check 0 ".env está no .gitignore"
else
    check 1 ".env está no .gitignore"
    warning "Adicione .env ao .gitignore para segurança"
fi

# Verificar se não há secrets commitados
if git ls-files | grep -q "\.env$"; then
    check 1 "Arquivo .env não está no Git"
    warning "PERIGO: .env está no Git! Remove com: git rm --cached .env"
else
    check 0 "Arquivo .env não está no Git"
fi

# ==========================================
# VERIFICAÇÕES DE DOCUMENTAÇÃO
# ==========================================

echo -e "\n${YELLOW}📚 VERIFICAÇÕES DE DOCUMENTAÇÃO${NC}"

[ -f "README.md" ]
check $? "README.md presente"

[ -f "GUIA_DEPLOY_COMPLETO_EC2.md" ]
check $? "Guia de deploy presente"

[ -f "INICIO_RAPIDO.md" ]
check $? "Guia de início rápido presente"

# ==========================================
# RESULTADOS
# ==========================================

echo -e "\n${BLUE}"
echo "=========================================="
echo "       📊 RESULTADO DA VALIDAÇÃO        "
echo "=========================================="
echo -e "${NC}"

SUCCESS_RATE=$(( (CHECKS_PASSED * 100) / TOTAL_CHECKS ))

echo -e "Verificações realizadas: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Verificações aprovadas: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Verificações falharam: ${RED}$((TOTAL_CHECKS - CHECKS_PASSED))${NC}"
echo -e "Taxa de sucesso: ${BLUE}$SUCCESS_RATE%${NC}"

echo ""

if [ "$SUCCESS_RATE" -eq 100 ]; then
    echo -e "${GREEN}🎉 PERFEITO! Sistema 100% pronto para deploy.${NC}"
    echo -e "${GREEN}✅ Pode prosseguir com segurança para o deploy.${NC}"
    echo ""
    echo -e "${BLUE}🚀 Próximo passo:${NC}"
    echo "   ./scripts/deploy-ec2.sh"
elif [ "$SUCCESS_RATE" -ge 80 ]; then
    echo -e "${YELLOW}⚠️ QUASE PRONTO! Corrija as verificações que falharam.${NC}"
    echo -e "${YELLOW}📋 Sistema pode fazer deploy, mas recomenda-se corrigir os problemas.${NC}"
    echo ""
    echo -e "${BLUE}🔧 Ações recomendadas:${NC}"
    echo "   1. Corrija os itens marcados como ❌"
    echo "   2. Execute novamente: ./scripts/validate-system.sh"
    echo "   3. Prossiga com deploy: ./scripts/deploy-ec2.sh"
elif [ "$SUCCESS_RATE" -ge 60 ]; then
    echo -e "${YELLOW}⚠️ ATENÇÃO! Vários problemas detectados.${NC}"
    echo -e "${YELLOW}🔧 Corrija os problemas antes de fazer deploy.${NC}"
    echo ""
    echo -e "${BLUE}🔧 Ações necessárias:${NC}"
    echo "   1. Instale dependências faltantes"
    echo "   2. Configure arquivo .env"
    echo "   3. Execute: ./scripts/generate-secrets.sh"
    echo "   4. Execute novamente esta validação"
else
    echo -e "${RED}❌ CRÍTICO! Muitos problemas detectados.${NC}"
    echo -e "${RED}🚨 NÃO FAÇA DEPLOY até corrigir os problemas.${NC}"
    echo ""
    echo -e "${BLUE}🔧 Ações obrigatórias:${NC}"
    echo "   1. Instale todas as dependências necessárias"
    echo "   2. Configure corretamente o ambiente"
    echo "   3. Execute: ./scripts/generate-secrets.sh"
    echo "   4. Teste builds do frontend e backend"
    echo "   5. Execute novamente esta validação"
fi

echo ""
echo -e "${BLUE}📋 Comandos úteis:${NC}"
echo "   - Instalar dependências: npm install && cd backend && npm install && cd .."
echo "   - Configurar .env: ./scripts/generate-secrets.sh"
echo "   - Testar builds: npm run build && cd backend && npm run build && cd .."
echo "   - Validar novamente: ./scripts/validate-system.sh"

exit 0
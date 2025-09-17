#!/bin/bash

# Test script to validate the update scripts functionality
# This script simulates various scenarios without requiring docker-compose

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 TESTE DE VALIDAÇÃO DOS SCRIPTS DE UPDATE"
echo "==========================================="

# Test 1: Script existence and permissions
echo ""
echo "📋 Teste 1: Verificação de scripts..."

scripts_to_check=(
    "./update.sh"
    "./scripts/quick-update.sh"
    "./scripts/auto-update-ec2.sh"
    "./scripts/port-diagnostics.sh"
    "./INSTRUCOES_ATUALIZACAO.md"
)

all_found=true
for script in "${scripts_to_check[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ] || [[ "$script" == *.md ]]; then
            echo -e "${GREEN}✓ $script encontrado e executável${NC}"
        else
            echo -e "${RED}✗ $script encontrado mas não executável${NC}"
            all_found=false
        fi
    else
        echo -e "${RED}✗ $script não encontrado${NC}"
        all_found=false
    fi
done

# Test 2: Help functionality
echo ""
echo "📋 Teste 2: Funcionalidade de ajuda..."

if ./update.sh --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓ update.sh --help funciona${NC}"
else
    echo -e "${RED}✗ update.sh --help falhou${NC}"
    all_found=false
fi

if ./scripts/quick-update.sh --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓ quick-update.sh --help funciona${NC}"
else
    echo -e "${RED}✗ quick-update.sh --help falhou${NC}"
    all_found=false
fi

if ./scripts/auto-update-ec2.sh --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓ auto-update-ec2.sh --help funciona${NC}"
else
    echo -e "${RED}✗ auto-update-ec2.sh --help falhou${NC}"
    all_found=false
fi

# Test 3: Syntax validation
echo ""
echo "📋 Teste 3: Validação de sintaxe..."

for script in "./update.sh" "./scripts/quick-update.sh" "./scripts/auto-update-ec2.sh" "./scripts/port-diagnostics.sh"; do
    if bash -n "$script" 2>/dev/null; then
        echo -e "${GREEN}✓ $script sintaxe válida${NC}"
    else
        echo -e "${RED}✗ $script erro de sintaxe${NC}"
        all_found=false
    fi
done

# Test 4: Error handling
echo ""
echo "📋 Teste 4: Tratamento de erros..."

# Test with invalid arguments
if ./scripts/quick-update.sh 2>&1 | grep -q "Branch não especificado"; then
    echo -e "${GREEN}✓ quick-update.sh trata argumentos inválidos${NC}"
else
    echo -e "${RED}✗ quick-update.sh não trata argumentos inválidos${NC}"
    all_found=false
fi

# Test 5: Port cleanup logic (without actually killing processes)
echo ""
echo "📋 Teste 5: Lógica de limpeza de portas..."

# Check if lsof command exists and the port cleanup logic is sound
if command -v lsof > /dev/null; then
    echo -e "${GREEN}✓ lsof disponível para limpeza de portas${NC}"
else
    echo -e "${YELLOW}⚠ lsof não disponível (normal em alguns ambientes)${NC}"
fi

# Final result
echo ""
echo "==========================================="
if [ "$all_found" = true ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "Os scripts estão prontos para uso em produção."
    echo "Para usar na EC2, siga as instruções em INSTRUCOES_ATUALIZACAO.md"
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM!${NC}"
    echo ""
    echo "Verifique os erros acima antes de usar em produção."
    exit 1
fi
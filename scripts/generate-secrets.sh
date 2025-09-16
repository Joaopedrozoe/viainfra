#!/bin/bash

# ==========================================
# GERADOR DE SECRETS SEGUROS
# WhiteLabel MVP - Segurança
# ==========================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "   🔐 GERADOR DE SECRETS SEGUROS        "
echo "=========================================="
echo -e "${NC}"

echo "Gerando secrets seguros para produção..."

# Verificar se OpenSSL está disponível
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL não encontrado. Instale com: sudo apt install openssl${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔑 Secrets gerados:${NC}"
echo ""

# Gerar JWT Secret (64 caracteres hexadecimais)
JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}JWT_SECRET=${JWT_SECRET}${NC}"

# Gerar senha do PostgreSQL (32 caracteres seguros)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo -e "${GREEN}POSTGRES_PASSWORD=${DB_PASSWORD}${NC}"

# Gerar chave da Evolution API (32 caracteres hexadecimais)
EVOLUTION_KEY=$(openssl rand -hex 16)
echo -e "${GREEN}EVOLUTION_API_KEY=${EVOLUTION_KEY}${NC}"

# Gerar session secret (64 caracteres hexadecimais)
SESSION_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}SESSION_SECRET=${SESSION_SECRET}${NC}"

echo ""
echo -e "${YELLOW}📋 Aplicar automaticamente ao .env?${NC}"
read -p "Digite 'y' para aplicar ou qualquer tecla para apenas exibir: " APPLY

if [ "$APPLY" = "y" ] || [ "$APPLY" = "Y" ]; then
    if [ -f ".env" ]; then
        echo ""
        echo -e "${BLUE}📝 Aplicando secrets ao arquivo .env...${NC}"
        
        # Backup do .env atual
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${YELLOW}📦 Backup criado: .env.backup.$(date +%Y%m%d_%H%M%S)${NC}"
        
        # Aplicar os secrets
        sed -i "s/CHANGE_THIS_TO_A_SUPER_SECRET_KEY_MINIMUM_32_CHARACTERS/$JWT_SECRET/g" .env
        sed -i "s/CHANGE_THIS_DB_PASSWORD/$DB_PASSWORD/g" .env
        sed -i "s/CHANGE_THIS_EVOLUTION_API_KEY/$EVOLUTION_KEY/g" .env
        sed -i "s/CHANGE_THIS_SESSION_SECRET_32_CHARS/$SESSION_SECRET/g" .env
        
        echo -e "${GREEN}✅ Secrets aplicados ao arquivo .env${NC}"
        
        # Verificar permissões
        chmod 600 .env
        echo -e "${GREEN}✅ Permissões do .env ajustadas (600)${NC}"
        
    elif [ -f ".env.template" ]; then
        echo ""
        echo -e "${BLUE}📝 Criando arquivo .env a partir do template...${NC}"
        
        cp .env.template .env
        
        # Aplicar os secrets
        sed -i "s/CHANGE_THIS_TO_A_SUPER_SECRET_KEY_MINIMUM_32_CHARACTERS/$JWT_SECRET/g" .env
        sed -i "s/CHANGE_THIS_DB_PASSWORD/$DB_PASSWORD/g" .env
        sed -i "s/CHANGE_THIS_EVOLUTION_API_KEY/$EVOLUTION_KEY/g" .env
        sed -i "s/CHANGE_THIS_SESSION_SECRET_32_CHARS/$SESSION_SECRET/g" .env
        
        chmod 600 .env
        
        echo -e "${GREEN}✅ Arquivo .env criado com secrets seguros${NC}"
        echo -e "${YELLOW}⚠️ IMPORTANTE: Configure seu domínio no arquivo .env${NC}"
        
    else
        echo -e "${RED}❌ Arquivo .env ou .env.template não encontrado${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${BLUE}📋 Para aplicar manualmente:${NC}"
    echo "1. Edite o arquivo .env"
    echo "2. Substitua os valores CHANGE_THIS_* pelos secrets acima"
    echo "3. Configure seu domínio"
    echo "4. Execute: chmod 600 .env"
fi

echo ""
echo -e "${YELLOW}⚠️ IMPORTANTE - SALVE ESTES SECRETS:${NC}"
echo "Anote estes valores em local seguro!"
echo "Você precisará deles para recuperação do sistema."

echo ""
echo -e "${GREEN}✅ Geração de secrets concluída!${NC}"

# Verificar força das senhas
echo ""
echo -e "${BLUE}🔍 Análise de segurança:${NC}"

# JWT Secret
JWT_LENGTH=${#JWT_SECRET}
if [ $JWT_LENGTH -ge 64 ]; then
    echo -e "${GREEN}✅ JWT Secret: EXCELENTE ($JWT_LENGTH caracteres)${NC}"
elif [ $JWT_LENGTH -ge 32 ]; then
    echo -e "${YELLOW}⚠️ JWT Secret: BOM ($JWT_LENGTH caracteres)${NC}"
else
    echo -e "${RED}❌ JWT Secret: FRACO ($JWT_LENGTH caracteres)${NC}"
fi

# Database Password
DB_LENGTH=${#DB_PASSWORD}
if [ $DB_LENGTH -ge 20 ]; then
    echo -e "${GREEN}✅ DB Password: EXCELENTE ($DB_LENGTH caracteres)${NC}"
elif [ $DB_LENGTH -ge 12 ]; then
    echo -e "${YELLOW}⚠️ DB Password: BOM ($DB_LENGTH caracteres)${NC}"
else
    echo -e "${RED}❌ DB Password: FRACO ($DB_LENGTH caracteres)${NC}"
fi

# Evolution Key
EVO_LENGTH=${#EVOLUTION_KEY}
if [ $EVO_LENGTH -ge 32 ]; then
    echo -e "${GREEN}✅ Evolution Key: EXCELENTE ($EVO_LENGTH caracteres)${NC}"
elif [ $EVO_LENGTH -ge 16 ]; then
    echo -e "${YELLOW}⚠️ Evolution Key: BOM ($EVO_LENGTH caracteres)${NC}"
else
    echo -e "${RED}❌ Evolution Key: FRACO ($EVO_LENGTH caracteres)${NC}"
fi

echo ""
echo -e "${BLUE}🔐 Dicas de segurança:${NC}"
echo "- NUNCA compartilhe estes secrets"
echo "- NUNCA commite o arquivo .env no Git"
echo "- Faça backup seguro dos secrets"
echo "- Troque os secrets se houver comprometimento"
echo "- Use HTTPS sempre em produção"

echo ""
echo -e "${GREEN}🎉 Sistema pronto para deploy seguro!${NC}"
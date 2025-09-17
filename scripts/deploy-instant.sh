#!/bin/bash

# ==========================================
# INSTANT DEPLOYMENT TRIGGER
# WhiteLabel MVP - One-click deployment
# ==========================================

echo "🚀 WHITELABEL MVP - INSTANT DEPLOYMENT"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO="Joaopedrozoe/viainfra"
WORKFLOW="deploy-now.yml"
DEPLOYMENT_MODE="${1:-autonomous}"
MAX_RETRIES="${2:-5}"

echo -e "${BLUE}Configuration:${NC}"
echo "- Repository: $REPO"
echo "- Workflow: $WORKFLOW"
echo "- Mode: $DEPLOYMENT_MODE"
echo "- Max Retries: $MAX_RETRIES"
echo ""

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found${NC}"
    echo "Please install GitHub CLI from: https://cli.github.com/"
    echo ""
    echo "Alternative: Manual trigger via GitHub Web UI"
    echo "1. Go to: https://github.com/$REPO/actions"
    echo "2. Select: 🚀 Deploy Now - Manual Trigger"
    echo "3. Click: Run workflow"
    echo "4. Choose deployment mode and click Run workflow"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${YELLOW}🎯 Triggering deployment...${NC}"

# Trigger the workflow
if gh workflow run "$WORKFLOW" \
  --repo "$REPO" \
  --field deployment_mode="$DEPLOYMENT_MODE" \
  --field max_retries="$MAX_RETRIES"; then
    
    echo -e "${GREEN}✅ Deployment triggered successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Monitor progress:${NC}"
    echo "🌐 Web UI: https://github.com/$REPO/actions"
    echo "💻 CLI: gh run list --repo $REPO --limit 5"
    echo ""
    echo -e "${BLUE}📋 View logs:${NC}"
    echo "💻 CLI: gh run view --repo $REPO --log"
    echo ""
    echo -e "${YELLOW}⏳ Waiting 30 seconds for workflow to start...${NC}"
    sleep 30
    
    # Show latest run status
    echo -e "${BLUE}📈 Latest run status:${NC}"
    gh run list --repo "$REPO" --limit 1
    
    echo ""
    echo -e "${GREEN}🎉 Deployment is now running autonomously!${NC}"
    echo "The system will handle retries and error recovery automatically."
    
else
    echo -e "${RED}❌ Failed to trigger deployment${NC}"
    echo "Please check your GitHub CLI authentication and permissions."
    exit 1
fi
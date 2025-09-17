#!/bin/bash

# ==========================================
# DEPLOYMENT TRIGGER SCRIPT
# WhiteLabel MVP - Run Autonomous Deployment
# ==========================================

echo "🚀 Triggering Autonomous Deployment for WhiteLabel MVP"
echo "==============================================="

# Check if we have GitHub CLI installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Please run: gh auth login"
    exit 1
fi

# Set default values
DEPLOYMENT_TYPE="${1:-full}"
MAX_RETRIES="${2:-5}"
AUTO_FIX="${3:-true}"
DOMAIN="${4:-}"
WEBHOOK="${5:-}"

echo "Configuration:"
echo "- Deployment Type: $DEPLOYMENT_TYPE"
echo "- Max Retries: $MAX_RETRIES"
echo "- Auto Fix Issues: $AUTO_FIX"
echo "- Domain: ${DOMAIN:-Not specified}"
echo "- Webhook: ${WEBHOOK:-Not specified}"
echo ""

# Trigger the workflow
echo "🎯 Triggering autonomous deployment workflow..."

gh workflow run "autonomous-deploy.yml" \
  --field deployment_type="$DEPLOYMENT_TYPE" \
  --field max_retries="$MAX_RETRIES" \
  --field auto_fix_issues="$AUTO_FIX" \
  --field domain="$DOMAIN" \
  --field notification_webhook="$WEBHOOK" \
  --repo Joaopedrozoe/viainfra

if [ $? -eq 0 ]; then
    echo "✅ Deployment workflow triggered successfully!"
    echo ""
    echo "📋 You can monitor the deployment progress at:"
    echo "   https://github.com/Joaopedrozoe/viainfra/actions"
    echo ""
    echo "🔍 To check the status in real-time, run:"
    echo "   gh run list --repo Joaopedrozoe/viainfra --limit 1"
    echo ""
    echo "📊 To view logs of the latest run:"
    echo "   gh run view --repo Joaopedrozoe/viainfra --log"
else
    echo "❌ Failed to trigger deployment workflow"
    exit 1
fi
#!/bin/bash

# ==========================================
# DEPLOYMENT TRIGGER SCRIPT
# WhiteLabel MVP - Run Enhanced Autonomous Deployment
# ==========================================

echo "🚀 Triggering Enhanced Autonomous Deployment for WhiteLabel MVP"
echo "================================================================"

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

# Set default values for enhanced autonomous deployment
DEPLOYMENT_TYPE="${1:-full}"
MAX_RETRIES="${2:-10}"  # Increased default, but system continues beyond this
AUTO_FIX="${3:-true}"   # Required for autonomous operation
DOMAIN="${4:-}"
WEBHOOK="${5:-}"

echo "📋 Enhanced Autonomous Deployment Configuration:"
echo "- Deployment Type: $DEPLOYMENT_TYPE"
echo "- Max Initial Retries: $MAX_RETRIES (system continues beyond this)"
echo "- Auto Fix Issues: $AUTO_FIX (REQUIRED for autonomous operation)"
echo "- Domain: ${DOMAIN:-Not specified}"
echo "- Webhook: ${WEBHOOK:-Not specified}"
echo ""

# Validate critical settings
if [ "$AUTO_FIX" != "true" ]; then
    echo "⚠️  WARNING: Auto Fix Issues should be 'true' for autonomous deployment"
    echo "   Setting it to 'false' may cause deployment to fail"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo "🎯 Triggering autonomous deployment workflow..."
echo ""

# Trigger the workflow
gh workflow run "autonomous-deploy.yml" \
  --field deployment_type="$DEPLOYMENT_TYPE" \
  --field max_retries="$MAX_RETRIES" \
  --field auto_fix_issues="$AUTO_FIX" \
  --field domain="$DOMAIN" \
  --field notification_webhook="$WEBHOOK" \
  --repo Joaopedrozoe/viainfra

if [ $? -eq 0 ]; then
    echo "✅ Enhanced autonomous deployment workflow triggered successfully!"
    echo ""
    echo "🎉 AUTONOMOUS DEPLOYMENT FEATURES ENABLED:"
    echo "   • ♾️  Unlimited retries (never gives up)"
    echo "   • 🔧 Auto-healing capabilities"
    echo "   • 🛠️  Environment auto-configuration"
    echo "   • 📊 Real-time monitoring"
    echo "   • 🚨 Progressive escalation strategies"
    echo "   • 🎯 Intelligent success detection"
    echo ""
    echo "📋 You can monitor the deployment progress at:"
    echo "   https://github.com/Joaopedrozoe/viainfra/actions"
    echo ""
    echo "🔍 To check the status in real-time, run:"
    echo "   gh run list --repo Joaopedrozoe/viainfra --limit 1"
    echo ""
    echo "📊 To view logs of the latest run:"
    echo "   gh run view --repo Joaopedrozoe/viainfra --log"
    echo ""
    echo "⚡ IMPORTANT: This deployment will continue autonomously until 100% successful!"
    echo "   No manual intervention should be necessary."
else
    echo "❌ Failed to trigger deployment workflow"
    exit 1
fi
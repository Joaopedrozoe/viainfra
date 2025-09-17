# 🚀 Autonomous Deployment System

This repository includes a fully autonomous deployment system that will automatically deploy and manage the WhiteLabel MVP on AWS EC2 with automatic error handling, retries, and validation.

## 🎯 Quick Start - Autonomous Deployment

### Option 1: Via GitHub Actions (Recommended)

1. Go to the [Actions tab](https://github.com/Joaopedrozoe/viainfra/actions)
2. Select "Autonomous AWS EC2 Deployment"
3. Click "Run workflow"
4. Configure options:
   - **Deployment Type**: `full` (for new deployments) or `update` (for updates)
   - **Max Retries**: `5` (recommended)
   - **Auto Fix Issues**: `true` (recommended)
   - **Domain**: Your domain name (optional)
   - **Notification Webhook**: Webhook URL for notifications (optional)
5. Click "Run workflow"

### Option 2: Via Command Line

```bash
# Clone the repository (if not already done)
git clone https://github.com/Joaopedrozoe/viainfra.git
cd viainfra

# Make sure you have GitHub CLI installed and authenticated
gh auth login

# Run the autonomous deployment
./scripts/trigger-autonomous-deploy.sh full 5 true your-domain.com
```

## 🤖 What the Autonomous System Does

The autonomous deployment system will:

1. **🔍 Pre-deployment Checks**
   - Test server connectivity
   - Check system resources
   - Verify Docker installation
   - Validate network connectivity

2. **🚀 Autonomous Deployment**
   - Automatically retry failed deployments (up to 5 times by default)
   - Self-diagnose and fix common issues
   - Monitor deployment progress
   - Handle cleanup on failures

3. **🔧 Auto-healing Features**
   - Clean up disk space if needed
   - Restart Docker daemon if issues detected
   - Kill conflicting processes on required ports
   - Fix permission issues
   - Restart services on health check failures

4. **🧪 Comprehensive Validation**
   - Run complete test suite
   - Validate all service endpoints
   - Check database connectivity
   - Verify container health
   - Performance testing

5. **📊 Monitoring Setup**
   - Configure automatic health checks (every 5 minutes)
   - Setup log rotation
   - Create monitoring dashboards
   - Send notifications on issues

6. **📋 Detailed Reporting**
   - Generate deployment reports
   - Provide access URLs
   - Log all activities
   - Send success/failure notifications

## 🔧 Configuration Options

### Environment Variables

- `MAX_RETRIES`: Maximum number of deployment retries (default: 5)
- `RETRY_DELAY`: Delay between retries in seconds (default: 30)
- `AUTO_FIX_ISSUES`: Automatically fix common issues (default: true)
- `DOMAIN`: Your domain name for SSL configuration
- `AUTO_RESTART`: Automatically restart services on health check failures

### GitHub Secrets Required

Make sure these secrets are configured in your repository:

- `EC2_SSH_KEY`: Your private SSH key for EC2 access
- `EC2_HOST`: Your EC2 instance IP address
- `EC2_USER`: SSH username (usually 'ubuntu' for Ubuntu instances)

## 📊 Monitoring and Health Checks

The system automatically sets up:

- **Health checks every 5 minutes** via cron job
- **Log rotation** to prevent disk space issues
- **Resource monitoring** (disk, memory, CPU)
- **Service endpoint monitoring**
- **Database connectivity checks**

### Manual Health Check

```bash
# SSH to your server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run health check
cd /opt/whitelabel
./scripts/health-check.sh

# View health logs
tail -f logs/health.log
```

## 🔍 Troubleshooting

### If Deployment Fails

1. **Check the GitHub Actions logs** for detailed error information
2. **SSH to your server** and check the deployment logs:
   ```bash
   cd /opt/whitelabel
   tail -f logs/autonomous-deploy.log
   ```

3. **Check container status**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

4. **Run manual health check**:
   ```bash
   ./scripts/health-check.sh
   ./scripts/test-system.sh
   ```

### Common Issues and Solutions

| Issue | Auto-Fix | Manual Solution |
|-------|----------|----------------|
| Port conflicts | ✅ Automatic | `sudo lsof -i :PORT && kill PID` |
| High disk usage | ✅ Automatic | `docker system prune -af` |
| Docker daemon issues | ✅ Automatic | `sudo systemctl restart docker` |
| Permission issues | ✅ Automatic | `sudo chown -R user:user /opt/whitelabel` |
| Container failures | ✅ Automatic | `docker-compose restart SERVICE` |

## 🌐 Access Your Application

After successful deployment, your application will be available at:

- **Frontend**: `https://your-domain.com` (if domain configured) or `http://your-ec2-ip:3000`
- **Backend API**: `https://your-domain.com/api` or `http://your-ec2-ip:4000`
- **Evolution API**: `https://your-domain.com/evolution` or `http://your-ec2-ip:8080`

## 📈 Next Steps After Deployment

1. **Configure WhatsApp Connection**
   - Access Evolution API manager
   - Scan QR code to connect WhatsApp
   - Configure webhooks

2. **Setup Users and Permissions**
   - Create admin accounts
   - Configure user roles
   - Setup company settings

3. **Configure Automation**
   - Setup chatbot flows
   - Configure auto-responses
   - Setup triggers and actions

4. **Monitor Performance**
   - Check health dashboards
   - Monitor response times
   - Review system logs

## 🆘 Emergency Recovery

If something goes wrong, you can:

1. **Trigger emergency deployment**:
   ```bash
   ./scripts/trigger-autonomous-deploy.sh emergency 3 true
   ```

2. **Manual rollback** (if needed):
   ```bash
   cd /opt/whitelabel
   docker-compose down
   # Restore from backup if available
   ```

3. **Contact support** with the deployment logs and error messages

## 📞 Support

- **Documentation**: Check the various `.md` files in this repository
- **Logs**: Always check `/opt/whitelabel/logs/` for detailed information
- **Health Status**: Use `./scripts/health-check.sh` for current status
- **Community**: Create an issue in this repository for help

---

## 🎉 Success!

When the autonomous deployment completes successfully, you'll have:

- ✅ Fully deployed WhiteLabel MVP
- ✅ All services running and healthy
- ✅ Automatic monitoring enabled
- ✅ SSL configured (if domain provided)
- ✅ Database initialized and ready
- ✅ Evolution API ready for WhatsApp connection
- ✅ Auto-healing enabled for resilience

**Your WhiteLabel MVP is now ready for production use! 🚀**
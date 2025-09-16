# GitHub Action SSH Deployment Setup

## Overview

This repository includes a GitHub Action workflow for automatic deployment to an EC2 instance via SSH. The workflow triggers on pushes to the `main` branch and executes deployment commands on the remote server.

## Required GitHub Secrets

You need to configure the following secret in your GitHub repository:

### SSH_PRIVATE_KEY

**Value**: The complete SSH private key (ed25519 format)

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL+6g2IAhZOcgMkL3iGacSfuQ4kOJ9z4g24O9p5ANmXg github-deploy
```

**How to configure**:
1. Go to your repository's Settings
2. Navigate to "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `SSH_PRIVATE_KEY`
5. Value: The complete private key content (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines)

## Deployment Target

- **Host**: 18.217.14.91
- **User**: ubuntu
- **Project Path**: /opt/whitelabel

## Deployment Process

The workflow performs the following steps:

1. **Checkout code** - Gets the latest code from the repository
2. **Setup SSH Agent** - Configures SSH agent with the private key
3. **Add host to known_hosts** - Adds the EC2 instance to trusted hosts
4. **Deploy to EC2** - Executes the following commands on the remote server:
   - Navigate to `/opt/whitelabel`
   - Pull latest changes with `git pull`
   - Install frontend dependencies with `npm install`
   - Build frontend with `npm run build`
   - Install backend dependencies in `backend/` directory
   - Build backend with `npm run build`
   - Start services with `docker-compose up -d`
5. **Verify deployment** - Checks container status and backend health

## Triggering Deployment

The deployment runs automatically when:
- Code is pushed to the `main` branch
- Manually triggered via GitHub Actions UI (workflow_dispatch)

## Security Considerations

- The SSH key is stored securely as a GitHub secret
- The workflow uses `ssh-keyscan` to verify the host fingerprint
- Error handling is implemented to fail fast on any deployment issues
- The deployment includes health checks to verify successful deployment

## Troubleshooting

If deployment fails, check:
1. SSH key is correctly configured in GitHub secrets
2. EC2 instance is running and accessible
3. Project directory `/opt/whitelabel` exists on the server
4. Docker and Docker Compose are installed on the server
5. The ubuntu user has necessary permissions for the project directory
# Guia de Deploy - Frontend WhiteLabel

## 📋 Resumo

Este frontend está preparado para conectar com um backend Node.js/PostgreSQL personalizado em AWS EC2. Todas as dependências do Supabase foram removidas e o sistema está pronto para produção.

## 🔧 Configurações de Ambiente

### Variáveis de Ambiente (.env.production)

```env
# API Configuration
VITE_API_URL=https://api.seudominio.com/api

# Evolution API Configuration (WhatsApp)
VITE_EVOLUTION_API_URL=https://evolution.seudominio.com

# Environment
VITE_APP_ENV=production
```

### Variáveis de Desenvolvimento (.env.development)

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Evolution API Configuration (WhatsApp)
VITE_EVOLUTION_API_URL=http://localhost:8080

# Environment
VITE_APP_ENV=development
```

## 🚀 Deploy para AWS S3 + CloudFront

### 1. Build para Produção

```bash
# Instalar dependências
npm install

# Build para produção
npm run build
```

### 2. Deploy AWS CLI

```bash
# Upload para S3 bucket
aws s3 sync dist/ s3://seu-bucket-frontend --delete

# Invalidar cache do CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 3. Configuração do S3 Bucket

```json
{
  "Rules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 4. Configuração do CloudFront

- Origin: S3 bucket
- Behaviors: `/api/*` → ALB (backend)
- Default: S3 (frontend)
- Error Pages: 403, 404 → `/index.html`

## 🐳 Deploy com Docker (Alternativo)

### Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
  listen 80;
  server_name _;
  
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass http://backend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## 📊 Monitoramento e Logs

### AWS CloudWatch

1. Configure logs para o S3 bucket
2. Set up alarmes para errors 4xx/5xx
3. Monitor performance metrics

### Application Logs

O frontend enviará métricas para o backend via API:

```typescript
// Exemplo de tracking de eventos
apiClient.post('/analytics/events', {
  event: 'page_view',
  page: '/dashboard',
  timestamp: Date.now()
});
```

## 🔐 Segurança

### Headers de Segurança

Configure no CloudFront/Nginx:

```
Content-Security-Policy: default-src 'self' *.seudominio.com
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### CORS

Backend deve permitir:

```javascript
const corsOptions = {
  origin: [
    'https://app.seudominio.com',
    'http://localhost:5173' // dev
  ],
  credentials: true
};
```

## 🔄 CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
          VITE_EVOLUTION_API_URL: ${{ secrets.EVOLUTION_API_URL }}
          VITE_APP_ENV: production
          
      - name: Deploy to S3
        run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build local
npm run build

# Preview build local
npm run preview

# Lint
npm run lint

# Type check
npm run type-check
```

## 📱 PWA Support

O projeto já está configurado como PWA:

- Service Worker automático
- Manifest.json configurado
- Offline fallback
- Install prompt

## 🔧 Troubleshooting

### Problemas Comuns

1. **CORS Error**: Verificar configuração do backend
2. **404 em rotas**: Configurar fallback para `/index.html`
3. **Env vars não carregam**: Verificar prefixo `VITE_`
4. **Build falha**: Verificar Node.js versão 18+

### Health Check

Endpoint de health check no frontend:

```
GET /health
Response: { "status": "healthy", "version": "1.0.0" }
```

## 📞 Suporte

Para dúvidas técnicas:
- Consulte a documentação do backend em `BACKEND_REQUIREMENTS.md`
- Verifique os logs do CloudWatch
- Teste localmente com `npm run dev`

## 🎯 Próximos Passos

1. Configure o backend seguindo `BACKEND_REQUIREMENTS.md`
2. Configure DNS e SSL certificates
3. Configure monitoramento e alertas
4. Teste integração completa
5. Configure backup e disaster recovery
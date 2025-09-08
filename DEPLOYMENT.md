# WhiteLabel MVP - Deployment Instructions

Este projeto está preparado para deployment em produção com PostgreSQL.

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Supabase project configured

### Environment Setup

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd <project-name>
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Variables:**
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. **Configure Supabase with PostgreSQL:**
   - Create a new Supabase project
   - Connect your PostgreSQL database
   - Run the database migrations (see `/supabase` folder)

2. **Required Tables:**
   - `conversations` - stores chat conversations
   - `users` - user authentication
   - `companies` - multi-tenant support
   - Additional tables as per your schema

### Build and Deploy

1. **Build for production:**
```bash
npm run build
```

2. **Deploy to your infrastructure:**
```bash
# Using Docker
docker build -t whitelabel-mvp .
docker run -p 3000:3000 whitelabel-mvp

# Or deploy the dist/ folder to your server
```

### AWS Deployment (Recommended)

1. **Using AWS Amplify or S3 + CloudFront:**
   - Upload the `dist/` folder contents
   - Configure environment variables
   - Set up custom domain

2. **Using AWS ECS/Fargate:**
   - Build Docker image
   - Push to ECR
   - Deploy using ECS

## 🔧 Configuration

### Features Enabled for Production:
- ✅ PostgreSQL integration via Supabase
- ✅ Real-time conversations
- ✅ Preview conversations (local storage)
- ✅ Multi-tenant architecture ready
- ✅ Authentication system
- ✅ Bot builder with form flows
- ✅ Channel management
- ✅ Contact management
- ✅ Dashboard analytics

### Demo Mode Disabled:
- ❌ Demo mode completely removed
- ❌ Local storage dependencies minimized
- ❌ All features work with real database

## 📊 Database Schema

Key tables required:
```sql
-- Conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  preview text,
  time timestamptz DEFAULT now(),
  unread integer DEFAULT 0,
  company_id text,
  is_preview boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add other tables as needed
```

## 🛡️ Security Notes

1. **Environment Variables:**
   - Never commit API keys to git
   - Use proper environment variable management
   - Rotate keys regularly

2. **Database Security:**
   - Enable RLS (Row Level Security) in Supabase
   - Configure proper user permissions
   - Use SSL connections

3. **Authentication:**
   - Implement proper session management
   - Use secure cookies
   - Enable MFA if needed

## 🧪 Testing

Before deployment, test:
1. Bot preview functionality
2. Conversation persistence
3. Real-time updates
4. Channel integrations
5. User authentication

## 📞 Support

For deployment support or issues:
- Check console logs for errors
- Verify database connections
- Ensure all environment variables are set
- Test Supabase connectivity

---

**Production Checklist:**
- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] Build successful
- [ ] All features tested
- [ ] Security measures in place
- [ ] Monitoring set up
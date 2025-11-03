# Batten SafeCheck - Deployment Guide

## Deploying to Vercel

### Prerequisites
1. Create a free Vercel account at https://vercel.com/signup
2. Install Vercel CLI: `npm install -g vercel`

### Deployment Steps

#### Option 1: Using Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Navigate to the deployment folder**
   ```bash
   cd vercel-deployment
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Follow the prompts:**
   - Set up and deploy: Y
   - Which scope: Choose your account
   - Link to existing project: N
   - Project name: batten-safecheck (or your choice)
   - Directory: ./ (current directory)
   - Override settings: N

5. **Done!** Your app will be live at: `https://batten-safecheck.vercel.app` (or your custom URL)

#### Option 2: Using Vercel Dashboard (No CLI needed)

1. Go to https://vercel.com/new
2. Click "Import Git Repository" or drag and drop this folder
3. Configure:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (leave empty)
   - Output Directory: public
4. Click "Deploy"

### After Deployment

Your app will be available at:
- Main app: `https://your-project-name.vercel.app/`
- Admin dashboard: `https://your-project-name.vercel.app/admin.html`

### API Endpoints

The following API endpoints will be automatically available:
- `/api/validate-user` - Validates computing ID
- `/api/emergency-alert` - Records location check-in
- `/api/alerts` - Returns all check-ins (currently returns empty due to serverless limitations)

### Important Notes

⚠️ **Data Persistence**: The current setup uses in-memory storage, which means:
- Check-in data will be lost when the serverless function restarts (cold start)
- For production use, you should add a database (see "Adding a Database" below)

### Adding a Database (Recommended for Production)

For persistent storage, I recommend using Vercel KV (Redis) or Vercel Postgres:

1. **Vercel KV (Redis)** - Easiest option
   - Go to your project in Vercel dashboard
   - Navigate to "Storage" tab
   - Create a new KV Database
   - Update the API functions to use KV instead of in-memory arrays

2. **Vercel Postgres** - For relational data
   - Similar setup through Vercel dashboard
   - Create tables for users and check-ins

### Custom Domain

To use a custom domain (e.g., safecheck.batten.virginia.edu):
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update your DNS records as instructed

### Environment Variables

If you need to add environment variables:
1. Go to project settings in Vercel
2. Navigate to "Environment Variables"
3. Add any needed variables
4. Redeploy for changes to take effect

### Local Testing

To test the Vercel setup locally before deploying:
```bash
cd vercel-deployment
vercel dev
```

This will start a local development server that mimics Vercel's environment.

## Support

For issues with Vercel deployment, see: https://vercel.com/docs

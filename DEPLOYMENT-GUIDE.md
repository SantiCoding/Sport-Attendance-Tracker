# Tennis Tracker - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Tennis Tracker ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tennis-tracker.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your `tennis-tracker` repository
5. Configure settings (see below)
6. Click "Deploy"

## ⚙️ Environment Variables Setup

**In Vercel Dashboard → Project Settings → Environment Variables, add:**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### How to Get Supabase Keys:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ Database Setup

### Option 1: Use Existing Database
- If you already have data, it will work immediately
- Just make sure your Supabase project is the same

### Option 2: Fresh Database
1. Create new Supabase project
2. Run the SQL from `create-tables.sql` in Supabase SQL Editor
3. Update environment variables with new project keys

## 🔧 Vercel Configuration

### Build Settings (Auto-detected):
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Domain Settings:
- **Custom Domain**: You can add your own domain later
- **Default**: `your-project.vercel.app`

## 📱 PWA Configuration

The app includes PWA features:
- **Service Worker**: `register-sw.ts`
- **Manifest**: Configured in `next.config.mjs`
- **Offline Support**: Ready to use

## 🔐 Authentication Setup

### Current Setup:
- Supabase Auth with email/password
- Ready for Google OAuth (can be added later)

### To Add Google Sign-In Later:
1. Configure Google OAuth in Supabase
2. Update auth components
3. Redeploy (automatic)

## 🎨 Styling Verification

After deployment, verify:
- ✅ Background gradients are visible
- ✅ Glass morphism effects work
- ✅ No scrollbars appear
- ✅ All text is readable
- ✅ Responsive design works

## 🚨 Troubleshooting

### Common Issues:

**1. Build Fails**
- Check environment variables are set
- Verify all dependencies in `package.json`

**2. Database Connection Error**
- Verify Supabase URL and keys
- Check Supabase project is active

**3. Styling Issues**
- Clear browser cache
- Check if CSS is loading properly

**4. Authentication Not Working**
- Verify Supabase Auth is enabled
- Check redirect URLs in Supabase settings

## 📊 Monitoring

### Vercel Analytics:
- Automatic performance monitoring
- Error tracking
- User analytics

### Supabase Monitoring:
- Database performance
- Auth logs
- API usage

## 🔄 Updates & Maintenance

### Making Changes:
1. Edit code locally
2. Push to GitHub
3. Vercel auto-deploys
4. Users get updates instantly

### Rollback:
- Vercel keeps deployment history
- Can rollback to previous version instantly

## 🎯 Post-Deployment Checklist

- [ ] Environment variables set correctly
- [ ] Database tables created
- [ ] Authentication working
- [ ] Styling looks correct
- [ ] All features functional
- [ ] Mobile responsive
- [ ] PWA features working

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify Supabase connection
3. Test locally first
4. Check environment variables

---

**Your Tennis Tracker will be live at: `https://your-project.vercel.app`** 🎾

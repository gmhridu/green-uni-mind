# Cloudflare Pages Deployment Guide

## Prerequisites
1. Cloudflare account (free tier available)
2. GitHub repository with your frontend code
3. Wrangler CLI installed: `npm install -g wrangler`

## Step 1: Prepare Your Repository

1. **Push your frontend code to GitHub**
   ```bash
   cd client
   git add .
   git commit -m "Prepare frontend for Cloudflare Pages deployment"
   git push origin main
   ```

## Step 2: Deploy via Cloudflare Dashboard

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to "Pages" in the sidebar

2. **Create New Project**
   - Click "Create a project"
   - Choose "Connect to Git"
   - Select your GitHub repository
   - Choose the `client` folder as the root directory

3. **Build Configuration**
   ```
   Framework preset: None (or Vite)
   Build command: npm run build:pages
   Build output directory: dist
   Root directory: client
   ```

4. **Environment Variables**
   Add these in the Cloudflare Pages dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
   VITE_NODE_ENV=production
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_REDIRECT_URI=https://your-site.pages.dev/oauth/callback/google
   VITE_FACEBOOK_CLIENT_ID=your_facebook_client_id
   VITE_FACEBOOK_REDIRECT_URI=https://your-site.pages.dev/oauth/callback/facebook
   VITE_APPLE_CLIENT_ID=your_apple_client_id
   VITE_APPLE_REDIRECT_URI=https://your-site.pages.dev/oauth/callback/apple
   ```

## Step 3: Deploy via Wrangler CLI (Alternative)

1. **Login to Wrangler**
   ```bash
   wrangler login
   ```

2. **Deploy**
   ```bash
   cd client
   npm run pages:deploy
   ```

## Step 4: Custom Domain (Optional)

1. In Cloudflare Pages dashboard, go to your project
2. Click "Custom domains" tab
3. Add your domain (e.g., app.yourdomain.com)
4. Update DNS records as instructed

## Step 5: Update Backend CORS

Update your backend to allow requests from your Cloudflare Pages domain:

```javascript
// In your backend CORS configuration
const allowedOrigins = [
  'https://your-site.pages.dev',
  'https://app.yourdomain.com', // if using custom domain
  'http://localhost:8080' // for development
];
```

## Benefits of Cloudflare Pages

✅ **Free hosting** with generous limits
✅ **Global CDN** - Fast loading worldwide
✅ **Automatic HTTPS** with SSL certificates
✅ **Git integration** - Auto-deploy on push
✅ **Preview deployments** for pull requests
✅ **Edge functions** for serverless logic
✅ **Analytics** and performance monitoring

## Performance Optimizations Included

- Asset caching with long-term cache headers
- Gzip/Brotli compression
- HTTP/2 and HTTP/3 support
- Image optimization
- Code splitting and lazy loading
- Security headers

## Monitoring and Analytics

1. **Cloudflare Analytics**: Built-in traffic and performance metrics
2. **Web Vitals**: Core Web Vitals monitoring
3. **Real User Monitoring**: Actual user experience data

## Troubleshooting

**Build Fails:**
- Check environment variables are set correctly
- Ensure all dependencies are in package.json
- Check build logs in Cloudflare dashboard

**Routing Issues:**
- Verify `_redirects` file is copied to dist folder
- Check SPA routing configuration

**API Calls Fail:**
- Verify VITE_API_BASE_URL is correct
- Check CORS configuration on backend
- Ensure backend is accessible from Cloudflare's edge locations

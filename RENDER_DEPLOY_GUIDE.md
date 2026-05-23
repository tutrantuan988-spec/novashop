# Render Deployment Guide for NovaShop

## Prerequisites
- GitHub repo: tutrantuan988-spec/novashop
- Branch: commerce-core-refactor
- render.yaml đã được push lên repo

## Step 1: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select repository: tutrantuan988-spec/novashop
4. Select branch: commerce-core-refactor
5. Render will automatically detect and use render.yaml configuration:
   - Build command: `npm install && npm run build`
   - Start command: `node server/index.js`
   - Health check: `/api/health`
6. Click "Create Web Service"

## Step 2: Configure Environment Variables

After creating the service, go to the "Environment" tab and add these variables:

### Core URLs
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render will override this)
- `VITE_API_URL` = (leave empty for same-origin)
- `CLIENT_URL` = `https://[your-service-name].onrender.com` (update after deployment)
- `PUBLIC_API_URL` = `https://[your-service-name].onrender.com` (update after deployment)

### Clerk Authentication
- `VITE_CLERK_PUBLISHABLE_KEY` = Your Clerk publishable key (pk_live_...)
- `CLERK_SECRET_KEY` = Your Clerk secret key (sk_live_...)

### Firebase
- `VITE_FIREBASE_API_KEY` = Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` = Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` = Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` = Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` = Your Firebase app ID
- `FIREBASE_SERVICE_ACCOUNT_JSON` = Paste the entire JSON content of your service account file

### Stripe Payment
- `VITE_STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key (pk_live_...)
- `STRIPE_SECRET_KEY` = Your Stripe secret key (sk_live_...)
- `STRIPE_WEBHOOK_SECRET` = Your Stripe webhook secret (whsec_...)

### Email (Resend)
- `RESEND_API_KEY` = Your Resend API key (re_...)
- `EMAIL_FROM` = `TRỌNG ĐỊNH STORE <tutrantuan988@gmail.com>`

### Shop Information
- `VITE_SHOP_NAME` = `TRỌNG ĐỊNH STORE`
- `VITE_SHOP_PHONE` = `0369712958`
- `VITE_SHOP_EMAIL` = `tutrantuan988@gmail.com`
- `VITE_SHOP_ADDRESS` = `Hà Nội, Việt Nam`
- `VITE_SHOP_FACEBOOK` = Your Facebook URL
- `VITE_SHOP_INSTAGRAM` = Your Instagram URL
- `VITE_SHOP_TIKTOK` = `@nclonf`

### Admin
- `VITE_ADMIN_EMAILS` = `tutrantuan988@gmail.com`
- `ADMIN_API_TOKEN` = Generate a random string (at least 32 characters)
- `ADMIN_NOTIFICATION_EMAIL` = `tutrantuan988@gmail.com`
- `GUEST_TOKEN_SECRET` = Generate a random string
- `ABANDONED_COUPON_CODE` = `COMEBACK5`

### Optional Services (leave empty if not using)
- `VITE_CLOUDINARY_CLOUD_NAME` = Your Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET` = Your Cloudinary upload preset
- `VITE_SENTRY_DSN` = Your Sentry DSN
- `VITE_SENTRY_TRACES_SAMPLE_RATE` = `0.05`

### VNPay (if using VNPay)
- `VNP_TMN_CODE` = Your VNPay TMN code
- `VNP_HASH_SECRET` = Your VNPay hash secret
- `VNP_URL` = `https://pay.vnpay.vn/vpcpay.html`

### MoMo (if using MoMo)
- `MOMO_PARTNER_CODE` = Your MoMo partner code
- `MOMO_ACCESS_KEY` = Your MoMo access key
- `MOMO_SECRET_KEY` = Your MoMo secret key
- `MOMO_ENDPOINT` = Your MoMo endpoint

### MCP Servers (if using)
- `GITHUB_TOKEN` = Your GitHub token
- `UPSTASH_REDIS_REST_URL` = Your Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` = Your Upstash Redis token

### PostgreSQL (if using new commerce core)
- `DATABASE_URL` = Your PostgreSQL connection string
- `DATABASE_POOL_MIN` = `2`
- `DATABASE_POOL_MAX` = `10`
- `USE_POSTGRES_PRODUCTS` = `false`
- `USE_POSTGRES_READS` = `false`
- `USE_POSTGRES_CATEGORIES` = `false`

### Redis Cache (if using)
- `REDIS_URL` = Your Redis connection string
- `REDIS_CACHE_TTL_PRODUCTS` = `3600`
- `REDIS_CACHE_TTL_CATEGORIES` = `86400`
- `REDIS_CACHE_TTL_INVENTORY` = `300`

## Step 3: Deploy

1. After configuring environment variables, Render will automatically start deployment
2. Monitor deployment in the "Logs" tab
3. Wait for "Deploy succeeded" message
4. Copy your service URL: `https://[your-service-name].onrender.com`
5. Update `CLIENT_URL` and `PUBLIC_API_URL` environment variables with the actual URL
6. Trigger a new deploy to apply the URL changes

## Step 4: Verify Deployment

1. Visit your service URL
2. Check that the homepage loads correctly
3. Test navigation menu - Hello Kitty stickers should appear in color (not black)
4. Test API health: `https://[your-service-name].onrender.com/api/health`
5. Expected response: `{"status":"healthy"}`

## Troubleshooting

### Build Fails
- Check logs for specific error messages
- Ensure all dependencies are in package.json
- Verify build command: `npm install && npm run build`

### Service Not Starting
- Check that `server/index.js` exists
- Verify start command: `node server/index.js`
- Check that PORT is correctly set

### Environment Variables Not Working
- Ensure variable names match exactly (case-sensitive)
- Check that sensitive values are not hardcoded in code
- Verify Firebase service account JSON is valid

### Hello Kitty Stickers Appear Black
- Clear browser cache (Ctrl+Shift+R)
- Verify SVG files exist in `public/images/kitty/`
- Check CSS variables in styles.css point to correct paths

## Free Tier Limits

Render Free Tier:
- 750 hours/month (enough for one service)
- 512 MB RAM
- 0.1 CPU
- Automatic sleep after 15 minutes of inactivity
- Wake up on first request (may take 30-60 seconds)

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure Stripe webhook endpoint on Render
3. Test payment flow with test cards
4. Monitor logs and performance
5. Set up error tracking (Sentry) if needed

# Cloud Deployment Guide

This project can run on free cloud services with this setup:

- Frontend: Vercel
- Backend API: Render Web Service
- Database: Aiven MySQL Free Tier
- Image storage: Cloudinary Free Plan

## 1. Create Cloudinary

Create a Cloudinary account and copy these values from the dashboard:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

The backend uses Cloudinary automatically when all three variables are present.
Without them, uploads are saved to `server/uploads` for local development.

## 2. Create Aiven MySQL

Create a free MySQL service in Aiven. Copy the connection values:

- host
- port
- database name
- username
- password
- CA certificate, if SSL is required

## 3. Deploy Backend To Render

Create a Render Web Service from the GitHub repository.

Use these settings:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Runtime: Node

Set these environment variables:

```env
NODE_ENV=production
PORT=10000
SESSION_SECRET=replace_with_a_long_random_secret
CLIENT_URL=https://your-frontend.vercel.app
CLIENT_URLS=https://your-frontend.vercel.app

DB_HOST=your-aiven-host
DB_PORT=your-aiven-port
DB_USER=your-aiven-user
DB_PASSWORD=your-aiven-password
DB_NAME=your-aiven-database
DB_SSL=true
DB_SSL_CA=your-aiven-ca-certificate
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=saba-chips-store
MAX_UPLOAD_BYTES=5242880
ALLOWED_UPLOAD_MIME_TYPES=image/jpeg,image/png,image/webp

JSON_BODY_LIMIT=1mb
URLENCODED_BODY_LIMIT=1mb

GCASH_ACCOUNT_NAME=your-gcash-account-name
GCASH_NUMBER=your-gcash-number

GROQ_API_KEY=optional
MAILTRAP_HOST=live.smtp.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=api
MAILTRAP_PASS=optional
MAIL_FROM=no-reply@sabachips.com
```

After the first successful backend deploy, copy the Render URL. It will look like:

```text
https://your-service-name.onrender.com
```

## 4. Deploy Frontend To Vercel

Create a Vercel project from the GitHub repository.

Use these settings:

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

Set these environment variables:

```env
VITE_API_BASE_URL=https://your-service-name.onrender.com
VITE_SERVER_ORIGIN=https://your-service-name.onrender.com
```

After Vercel deploys, copy the Vercel URL and update the backend Render env vars:

```env
CLIENT_URL=https://your-frontend.vercel.app
CLIENT_URLS=https://your-frontend.vercel.app
```

Redeploy the backend after changing those values.

Do not leave `VITE_API_BASE_URL` empty on Vercel unless you also configure an API proxy. The included `client/vercel.json` only rewrites frontend SPA routes to `index.html`; it does not proxy `/api` requests to Render.

## 5. Production Safety Checks

Before real users use the app:

- Confirm Render health checks use `/api/health`.
- Confirm `NODE_ENV=production`; otherwise cookies, env validation, and persistent rate limits will not use production behavior.
- Confirm `SESSION_SECRET` is at least 32 random characters.
- Confirm Aiven automatic backups are enabled and test one restore into a temporary database.
- Confirm `DB_SSL=true` and `DB_SSL_CA` contains the full Aiven CA certificate with line breaks preserved.
- Confirm Cloudinary credentials are present. In production, the server intentionally fails startup if Cloudinary is missing.
- Confirm Cloudinary upload presets or account settings do not allow unsigned public uploads for this app.
- Confirm only JPEG, PNG, and WebP images upload successfully; SVG and other file types should fail.
- Configure Render log retention or connect a logging/error-monitoring service such as Sentry, Logtail, or Better Stack.
- Rotate any secret that was ever pasted into a chat, screenshot, commit, or public issue.

## 6. Live Smoke Test

Test these features after deployment:

- Register and login
- Admin login
- Add product with image
- Edit product image
- Add to cart
- Checkout with Cash on Delivery
- Checkout with GCash proof image
- Admin payment verification
- Cancellation request
- Refund pending and refunded flow
- Chat text and image messages
- Product review with image
- Admin reports and exports

## 7. Free-Tier Notes

Render free web services can spin down after inactivity, so the first request may take about a minute.
Do not depend on Render local files for uploaded images. This project uses Cloudinary in production to keep uploaded images persistent.
Sessions and rate-limit buckets are stored in Aiven MySQL, so Render restarts should no longer sign users out immediately.

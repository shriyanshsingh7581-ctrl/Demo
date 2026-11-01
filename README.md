# Eden Roses Makeover — By Subba Lakshmi

Official Luxury Customer Booking Website & Partner Admin App for **Eden Roses Makeover — By Subba Lakshmi** (`https://www.edenroses.in/`).

## Business Information
- **Business Name**: Eden Roses Unisex Salon
- **Makeup Brand**: Eden Roses Makeover
- **Professional Artist**: Subba Lakshmi
- **Primary Studio Location**: No.11, 1st Floor, 4th Cross, Kaggadasapura Main Road, C V Raman Nagar (Nagavarapalya), Bengaluru, Karnataka 560093
- **Official Phone Numbers**: `+91 7019135530` | `+91 9606076647`

---

## Routes & Access
- **`/`**: Luxury Customer Booking Website (Services, Bridal Packages, Original Portfolio Gallery, Interactive Monthly Slot Calendar, 3-Step Booking Form, Instant Callback Request).
- **`/admin`**: Partner Admin App (PIN Login: **`1234`** or **`7777`**) with real-time Firebase synchronization, 30-Day Order Status Cards, `User Details` live customer & callback directory, Wallet, Earnings, and Business Settings.
- **`/admin/calendar`**: Partner Interactive Monthly Booking Calendar.
- **`/admin/job/:bookingId`**: Full Job Management & Execution Screen (`Wo Id`, Google Maps Navigation, Add/Edit Items, Reschedule with conflict check, Payment Summary editor, Team assignment, Service Flow Guide, Selfie Upload).

---

## Vercel Deployment Guide

This repository is pre-configured for **1-Click Vercel Deployment** via:
- `vercel.json` (Vite framework preset, `npm run build` -> `dist`, SPA route rewrites for `/`, `/admin`, `/admin/calendar`, `/admin/job/:bookingId`, and immutable caching for `/assets/*`).
- `.vercelignore` (excludes local build/log artifacts).
- `public/robots.txt` & `public/sitemap.xml` (SEO indexing for customer routes while keeping `/admin` private from search crawlers).
- `firebase-applet-config.json` (pre-configured with your provisioned Firebase Cloud Firestore database so real-time sync works immediately on Vercel without extra setup).

### Option 1: Deploy via GitHub + Vercel Dashboard (Recommended)
1. Push or export this project to your GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel will automatically detect **Vite** from `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. *(Optional)* In **Environment Variables**, you can leave defaults (since `firebase-applet-config.json` is included) or add any custom variables from `.env.example`.
5. Click **Deploy**.
6. **Important for Firebase on your Vercel domain**:
   - Open [Firebase Console → Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/gen-lang-client-0188221542/authentication/settings) and add your `.vercel.app` domain (and `edenroses.in` if using a custom domain).

### Option 2: Deploy via Vercel CLI
```bash
npm install
npx vercel
# For production deployment:
npx vercel --prod
```

---

## Local Development
```bash
npm install
npm run dev
npm run build
```

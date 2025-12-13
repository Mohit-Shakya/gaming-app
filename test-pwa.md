# Quick PWA Testing Guide

## Test Locally (Before Icon Generation)

### 1. Start Development Server

```bash
npm run dev
```

### 2. Check Service Worker Registration

Open browser console (F12) and check for:
```
Service Worker registered: ServiceWorkerRegistration
```

### 3. Test Manifest

Visit in Chrome:
```
http://localhost:3000/manifest.json
```

Should see JSON with app details.

### 4. Check PWA Criteria

Chrome DevTools → Lighthouse → Run audit → Progressive Web App

Should show:
- ✅ Registers a service worker
- ✅ Web app manifest meets requirements
- ⚠️ Does not provide a valid icon (until you add icons)

### 5. Test Offline Mode

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload page → should show offline page
4. Uncheck "Offline" → app works again

## Deploy and Test on Devices

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, note the URL
```

### Test on Android

1. Open Chrome on Android phone
2. Visit your Vercel URL: `https://your-app.vercel.app`
3. Wait 3 seconds → install prompt appears
4. Tap "Install App"
5. Check home screen → BookMyGame icon appears
6. Open app → runs fullscreen

### Test on iPhone

1. Open Safari on iPhone
2. Visit your Vercel URL
3. Custom iOS prompt shows instructions
4. Tap Share → "Add to Home Screen"
5. Open app from home screen

## Checklist Before Going Live

- [ ] Generate all app icons (see PWA_SETUP_GUIDE.md)
- [ ] Generate iOS splash screens
- [ ] Test install on Android
- [ ] Test install on iOS
- [ ] Test offline functionality
- [ ] Test on slow 3G connection
- [ ] Verify lighthouse score > 90
- [ ] Update manifest with production URL

## Common Issues

**Service Worker Not Found**
- Check `/public/sw.js` exists
- Restart dev server

**Manifest Errors**
- Validate JSON syntax
- Check all required fields present

**Install Prompt Not Showing**
- Wait 3 seconds
- Check browser console for errors
- Android: must have HTTPS (or localhost)

**Icons Not Loading**
- Generate icons first (see guide)
- Check paths in manifest.json match actual files

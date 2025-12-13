# PWA Setup Guide - BookMyGame

## Overview
Your BookMyGame app now has full Progressive Web App (PWA) support for both **Android** and **iOS**!

## ✅ What's Been Added

### 1. PWA Manifest (`/public/manifest.json`)
- App name, description, and colors
- Icon definitions for all sizes
- Display mode: `standalone` (fullscreen app experience)
- Theme color: `#ff073a` (brand red)
- Background color: `#08080c` (dark)
- App shortcuts (Find Cafés, My Bookings, Profile)
- Share target API support

### 2. Service Worker (`/public/sw.js`)
- **Offline Support** - Cache essential pages
- **Runtime Caching** - Cache visited pages
- **Background Sync** - Sync bookings when back online
- **Push Notifications** - Booking confirmations
- **Install Prompts** - Smart install timing

### 3. PWA Installer Component (`/src/components/PWAInstaller.tsx`)
- **Android/Desktop**: Native install prompt
- **iOS**: Custom instructions for "Add to Home Screen"
- **Smart Timing**: Shows after 3 seconds
- **Dismissible**: Remembers dismissal for 7 days
- **Auto-Hide**: Hides when already installed

### 4. Offline Page (`/src/app/offline/page.tsx`)
- Beautiful offline fallback page
- Shows available offline features
- Retry button
- User-friendly messaging

### 5. Meta Tags in Layout
- iOS-specific meta tags
- Splash screen links
- Theme colors
- Apple web app capable
- Viewport configuration

## 📱 Required Assets

You need to create the following image assets:

### App Icons

Create these icon files in `/public/icons/`:

| File Name | Size | Purpose |
|-----------|------|---------|
| `icon-72x72.png` | 72×72px | Android small |
| `icon-96x96.png` | 96×96px | Android medium |
| `icon-128x128.png` | 128×128px | Android large |
| `icon-144x144.png` | 144×144px | Windows tile |
| `icon-152x152.png` | 152×152px | iOS non-retina |
| `icon-192x192.png` | 192×192px | Android home screen |
| `icon-384x384.png` | 384×384px | Android larger |
| `icon-512x512.png` | 512×512px | Android splash |
| `apple-touch-icon.png` | 180×180px | iOS home screen |
| `safari-pinned-tab.svg` | Any | Safari pinned tab |

### iOS Splash Screens

Create these splash images in `/public/splash/`:

| File Name | Size | Device |
|-----------|------|--------|
| `apple-splash-2048-2732.jpg` | 2048×2732px | iPad Pro 12.9" |
| `apple-splash-1668-2388.jpg` | 1668×2388px | iPad Pro 11" |
| `apple-splash-1536-2048.jpg` | 1536×2048px | iPad (9.7"/10.2") |
| `apple-splash-1242-2688.jpg` | 1242×2688px | iPhone 11 Pro Max |
| `apple-splash-1125-2436.jpg` | 1125×2436px | iPhone X/11 Pro |
| `apple-splash-750-1334.jpg` | 750×1334px | iPhone 8 |

### Shortcut Icons (Optional)

Create these in `/public/icons/` for app shortcuts:

- `shortcut-search.png` (96×96px)
- `shortcut-bookings.png` (96×96px)
- `shortcut-profile.png` (96×96px)

## 🎨 How to Generate Icons

### Option 1: Use Online Tools (Recommended)

1. **PWA Asset Generator**
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload your logo (1024×1024px recommended)
   - Download all generated assets
   - Place in `/public/icons/` and `/public/splash/`

2. **RealFaviconGenerator**
   - Visit: https://realfavicongenerator.net/
   - Upload logo
   - Configure for all platforms
   - Download package

### Option 2: Use Command Line

Install `pwa-asset-generator`:

```bash
npm install -g pwa-asset-generator
```

Generate icons and splash screens:

```bash
# Navigate to your project
cd /Users/mohit/gaming-app

# Create icon directory
mkdir -p public/icons public/splash

# Generate all assets from a source image (1024x1024px recommended)
pwa-asset-generator public/logo.png public/icons --icon-only
pwa-asset-generator public/logo.png public/splash --splash-only --background "#08080c"
```

### Option 3: Manual Creation

Use design tools like:
- **Figma** - Create artboards at each size
- **Photoshop** - Batch resize
- **GIMP** - Free alternative

**Design Tips:**
- Use your logo/brand icon
- Keep it simple (icons are small)
- Use brand colors (#ff073a red, #00f0ff cyan)
- Dark background (#08080c)
- Add subtle glow/shadow for depth
- Test at all sizes

## 🚀 Testing PWA Installation

### Android (Chrome/Edge)

1. **Deploy to Production/Staging**
   - PWA requires HTTPS (localhost is exempt)
   - Deploy to Vercel/Netlify

2. **Open in Chrome on Android**
   ```
   https://your-domain.com
   ```

3. **Install Prompt**
   - Chrome will show "Add to Home Screen"
   - Or tap menu → "Install app"

4. **Verify Installation**
   - Check home screen for icon
   - Open app (should be fullscreen)
   - Test offline mode (airplane mode)

### iOS (Safari)

1. **Open in Safari on iPhone/iPad**
   ```
   https://your-domain.com
   ```

2. **Follow Custom Prompt**
   - Our custom prompt shows instructions
   - Or manually: Tap Share → "Add to Home Screen"

3. **Verify Installation**
   - App icon appears on home screen
   - Opens fullscreen without Safari UI
   - Splash screen shows on launch

### Desktop (Chrome/Edge)

1. **Open in Browser**
   ```
   https://your-domain.com
   ```

2. **Install**
   - Install icon appears in address bar
   - Or Settings → "Install BookMyGame"

3. **Verify**
   - App opens in standalone window
   - Available in app launcher

## 📋 Testing Checklist

### Basic Functionality
- [ ] Manifest loads without errors
- [ ] Service worker registers successfully
- [ ] App icons display correctly
- [ ] Install prompt appears (Android/Desktop)
- [ ] iOS instructions show on iOS devices
- [ ] Theme color matches brand

### Installation
- [ ] **Android**: Can install via prompt
- [ ] **iOS**: Can add to home screen
- [ ] **Desktop**: Can install as app
- [ ] App opens in standalone mode
- [ ] Splash screen shows on iOS
- [ ] App icon looks good on home screen

### Offline Support
- [ ] Pages cache correctly
- [ ] Offline page shows when no internet
- [ ] Service worker updates properly
- [ ] Previously visited pages work offline

### Advanced Features
- [ ] App shortcuts work (Android)
- [ ] Push notifications (if enabled)
- [ ] Background sync (if enabled)
- [ ] Share target API works

## 🔧 Customization

### Change Theme Color

Edit `/public/manifest.json`:
```json
{
  "theme_color": "#your-color",
  "background_color": "#your-color"
}
```

Edit `/src/app/layout.tsx`:
```typescript
themeColor: [
  { media: "(prefers-color-scheme: dark)", color: "#your-color" }
]
```

### Add More Shortcuts

Edit `/public/manifest.json`:
```json
{
  "shortcuts": [
    {
      "name": "Your Shortcut",
      "url": "/your-path",
      "icons": [{ "src": "/icons/shortcut.png", "sizes": "96x96" }]
    }
  ]
}
```

### Customize Install Prompt

Edit `/src/components/PWAInstaller.tsx`:
- Change timing (line 36): `setTimeout(() => {...}, 3000)`
- Change dismissal period (line 55): `daysSinceDismissal < 7`
- Customize UI/messaging

### Enable Push Notifications

1. Get VAPID keys
2. Update service worker with subscription logic
3. Add backend to send notifications
4. Request permission in PWAInstaller

## 📊 Analytics

Track PWA metrics:

### Install Rate
```javascript
// Add to PWAInstaller
if (outcome === 'accepted') {
  // Track with your analytics
  analytics.track('PWA Installed');
}
```

### Usage Metrics
```javascript
// Detect if running as PWA
const isPWA = window.matchMedia('(display-mode: standalone)').matches;
analytics.track('Session Start', { isPWA });
```

## 🐛 Troubleshooting

### Manifest Not Loading
- Check file is at `/public/manifest.json`
- Verify JSON is valid
- Check Content-Type is `application/json`
- Clear browser cache

### Service Worker Not Registering
- Must use HTTPS (or localhost)
- Check console for errors
- Verify `/public/sw.js` exists
- Try unregister and re-register

### Icons Not Showing
- Check file paths match manifest
- Verify icon files exist
- Must be PNG format (except SVG for Safari)
- Check sizes are exact

### Install Prompt Not Showing
- Must meet PWA criteria (HTTPS, manifest, service worker)
- User may have dismissed previously
- Chrome only shows after engagement signals
- Check `beforeinstallprompt` event fires

### iOS Not Working
- Safari has limited PWA support
- Some features require native app
- Must add manually via Share menu
- Test on actual device (not simulator)

## 🎯 Next Steps

1. **Generate Icons** using one of the methods above
2. **Deploy to Production** (Vercel/Netlify)
3. **Test on Real Devices** (Android + iOS)
4. **Monitor Installation Rate**
5. **Collect User Feedback**
6. **Consider Advanced Features**:
   - Push notifications for booking reminders
   - Background sync for offline bookings
   - Periodic background sync for updates

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Manifest Generator](https://www.pwabuilder.com/)
- [Icon Generator](https://realfavicongenerator.net/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [iOS PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

**Status**: ✅ PWA Core Complete
**Required**: Generate app icons and splash screens
**Next**: Deploy and test on real devices

# PWA Icons

This directory should contain the PWA icons for both **BookMyGame** (booking app) and **BMG Owner** (owner dashboard).

## Required Icons

### BookMyGame (Booking App)
| File | Size | Required |
|------|------|----------|
| `icon-72x72.png` | 72×72px | Optional |
| `icon-96x96.png` | 96×96px | Optional |
| `icon-128x128.png` | 128×128px | Optional |
| `icon-144x144.png` | 144×144px | Optional |
| `icon-152x152.png` | 152×152px | Optional |
| `icon-192x192.png` | 192×192px | **Yes** |
| `icon-384x384.png` | 384×384px | Optional |
| `icon-512x512.png` | 512×512px | **Yes** |
| `shortcut-status.png` | 96×96px | Optional |
| `shortcut-book.png` | 96×96px | Optional |
| `shortcut-bookings.png` | 96×96px | Optional |

### BMG Owner (Owner Dashboard)
| File | Size | Required |
|------|------|----------|
| `owner-icon-72x72.png` | 72×72px | Optional |
| `owner-icon-96x96.png` | 96×96px | Optional |
| `owner-icon-128x128.png` | 128×128px | Optional |
| `owner-icon-144x144.png` | 144×144px | Optional |
| `owner-icon-152x152.png` | 152×152px | Optional |
| `owner-icon-192x192.png` | 192×192px | **Yes** |
| `owner-icon-384x384.png` | 384×384px | Optional |
| `owner-icon-512x512.png` | 512×512px | **Yes** |
| `owner-shortcut-status.png` | 96×96px | Optional |
| `owner-shortcut-bookings.png` | 96×96px | Optional |
| `owner-shortcut-reports.png` | 96×96px | Optional |

## Quick Generate

Use [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) or run:

```bash
npm install -g pwa-asset-generator
pwa-asset-generator your-logo.png ./public/icons --icon-only
```

## Design Tips
- **Booking App**: Use brand red (#ff0033) with gaming theme
- **Owner App**: Use professional blue (#3b82f6) with dashboard theme
- Keep icons simple - they appear small on home screens

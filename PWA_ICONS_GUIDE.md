# PWA Icons Setup Guide

Your app is now configured as a Progressive Web App (PWA)! To complete the setup, you need to add icon files.

## Required Icon Files

Place these files in the `public/` directory:

### For PWA (Android/Chrome)
- **icon-192.png** - 192x192px - Used on home screen and app drawer
- **icon-512.png** - 512x512px - Used for splash screen and high-res displays

### For iOS (Apple devices)
- **apple-icon-180.png** - 180x180px - Used on iPhone home screen

## Icon Requirements

### Design Guidelines
- **Square images** with equal width and height
- **PNG format** with transparent or solid background
- **Simple, recognizable design** that works at small sizes
- **Safe zone**: Keep important content within center 80% (outer 10% may be masked)

### Maskable Icons
The manifest specifies `purpose: "any maskable"` which means:
- Icons should work on platforms that apply masks (rounded corners, circles, etc.)
- Place your core logo/symbol in the center 80% of the canvas
- Fill the entire canvas (no transparent edges)

## Quick Generation Options

### Option 1: Use an Icon Generator
- **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
- Upload a single 512x512 image and it generates all sizes

### Option 2: Use Figma/Design Tool
- Create 512x512 canvas
- Design your icon
- Export at 192x192, 512x512, and 180x180

### Option 3: Simple Placeholder (for testing)
You can create simple colored squares with text using any image editor:
- 192x192: "H&H" or "Hours" text on colored background
- 512x512: Same design, higher resolution
- 180x180: Apple version

## How to Test

### On iPhone:
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Your icon should appear
5. Tap the home screen icon - app opens in full-screen standalone mode!

### On Android/Chrome:
1. Open the app in Chrome
2. You may see an "Install app" prompt automatically
3. Or tap menu → "Add to Home Screen"
4. App installs with your icon

## Current Configuration

The app is configured with:
- ✅ Web App Manifest (`app/manifest.ts`)
- ✅ Apple meta tags for iOS support
- ✅ Theme colors (light: white, dark: black)
- ✅ Standalone display mode (no browser UI)
- ✅ Portrait orientation
- ✅ Safe area viewport (for notched devices)

Once you add the icon files, the PWA setup will be complete!

## Status Bar Style (iOS)

Currently set to `"default"` (black text on light background).

Other options:
- `"black"` - Black text on light background
- `"black-translucent"` - White text with semi-transparent background

You can change this in `app/layout.tsx` if needed.

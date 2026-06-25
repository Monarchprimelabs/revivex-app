# ReviveX Asset TODOs

The uploaded ReviveX design system screenshot is a visual reference only.
Do not crop it into production App Store artwork.

Before wiring icon/splash references in `app.json`, add clean production assets:

- `assets/icon.png`
  - 1024x1024 PNG
  - Final App Store icon artwork
  - Should use the ReviveX/RX mark on a premium dark background
- `assets/adaptive-icon.png`
  - Android adaptive foreground PNG
  - Should work on dark adaptive background `#0F1114`
- `assets/splash-icon.png` or `assets/splash.png`
  - Splash/loading logo PNG
  - Prefer centered ReviveX/RX mark with transparent or dark-safe background
- Transparent RX logo PNG
  - Needed if the app renders a logo mark inside onboarding, splash, or brand headers

Current status:

- Clean logo/icon PNG files are not present in this project.
- `app.json` intentionally does not reference missing icon files.
- Existing app functionality remains Expo Go compatible.

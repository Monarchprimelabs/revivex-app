# ReviveX Assets

Generated 2026-07-05 (Phase 23) from the owner's uploaded RX brand assets
(Concept 2, monogram-driven identity). Brand palette: `#0F1114`, `#1A1D21`,
`#6B7177`, `#F5F5F5`, `#00B4B3`, `#C6FF00`.

- `assets/icon.png`
  - 1024x1024 iOS app icon: RX mark at 76% width on `#111111`, full bleed.
- `assets/adaptive-icon.png`
  - 1024x1024 Android adaptive foreground: RX mark at 52% width (inside the
    66% safe zone) on `#111111`; adaptive background color `#111111`.
- `assets/splash-icon.png`
  - 1024x1024 splash logo: RX mark at 60% width on `#111111`; splash
    `backgroundColor` `#111111` makes it blend into a full dark screen.

All three are referenced from `app.json` (icon, android.adaptiveIcon, splash).

## Known limitation

These were produced by cropping and LANCZOS-upscaling a 156px icon tile from
a brand-board screenshot. They look sharp at home-screen/splash sizes, but a
designer-exported 1024px master (ideally SVG or layered source) should replace
`icon.png` before App Store submission. Keep the same filenames when swapping
in final artwork — no code changes needed.

Still wanted eventually:

- Transparent RX logo PNG for in-app brand headers/onboarding.
- Designer 1024px masters of icon and splash artwork.

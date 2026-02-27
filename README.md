# Iki Bowl

iOS-first breathing PWA (no backend). Sessions are pre-recorded tracks played via HTML `<audio>`.

## Modes and durations

- `Buteyko (N-N)` where `N = 4..7`
- `Box (4-4-4-4)`
- `Dr. Weil (4-7-8)`
- Durations: `5`, `10`, `20` minutes

## Local run

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run check:branding
npm run check:assets
npm run build
npm run preview
```

## Audio

- Active set: `18` files in `public/audio`
Naming:
- Equal: `even-44/55/66/77-{5|10|20}m.mp3`
- Box: `box-4444-{5|10|20}m.mp3`
- Relax: `relax-478-{5|10|20}m.mp3`

## Deploy

GitHub Pages via `.github/workflows/deploy-pages.yml`:

- push to `main`
- `Settings -> Pages -> Source: GitHub Actions`

## Caching and updates

- App shell (`index.html`, manifest, icons) is versioned per release and updated with a network-first strategy.
- If offline, navigation falls back to the cached app shell.
- Audio cache is versioned separately, so regular app deploys do not force full audio re-downloads.

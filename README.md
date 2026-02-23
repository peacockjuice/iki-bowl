# Iki Gong

Static iOS-first breathing PWA (no backend). Each session is one pre-generated audio track played via HTML `<audio>`.

## Modes and durations

- `Equal (N-N)` where `N = 4..7`
- `Box 4-4-4-4`
- `4-7-8`
- Durations: `5, 10, 20` minutes
- No in-app volume control. Use device volume buttons.

## Local run

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm run preview
```

## Audio pipeline

Source samples used by generator:

- inhale: `/Users/vpavlin/PycharmProjects/breeth/bowls_3_1.mp3`
- hold: `/Users/vpavlin/PycharmProjects/breeth/bowls_3_2.mp3`
- exhale: `/Users/vpavlin/PycharmProjects/breeth/bowls_3_3.mp3`

Generate active set:

```bash
npm run generate:audio
```

Run asset gates:

```bash
npm run check:branding
npm run check:assets
```

`check:assets` validates:

- required active set exists (`18` tracks)
- durations are correct
- active-set size gate (warn `>220MB`, fail `>260MB`)

Naming (active set):

- Equal: `even-44/55/66/77-{5|10|20}m.mp3`
- Box: `box-4444-{5|10|20}m.mp3`
- 4-7-8: `relax-478-{5|10|20}m.mp3`

Legacy files (`15/25/30`, `even-88`) are intentionally kept but excluded from active validation.

## Deploy (GitHub Pages)

Workflow: `.github/workflows/deploy-pages.yml`

- push to `main`
- repo `Settings -> Pages -> Source: GitHub Actions`
- workflow validates assets, builds, deploys `dist`

## iOS QA minimum

- install from Safari to Home Screen
- run `Equal 7-7, 10m`
- lock screen playback for at least 10 minutes
- verify Pause / Resume / Restart / Stop
- verify offline playback for previously cached active track

## Known limitations

- iOS background behavior varies by device/iOS/settings
- offline works only for cached tracks
- audio uses constrained bitrate (`~40 kbps mono`) to control repository size

## Visual direction (brandbook)

- quiet, minimal interface with no visual noise
- no gradients or glass effects
- no pure white `#FFFFFF` or pure black `#000000`
- single sans-serif type family with regular/medium weights
- color system based on muted earth tones (sage/clay palette)

## Contributor rules

See `rules.md`.

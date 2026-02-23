# Breeth MVP (iOS-first PWA)

Breeth is a static audio-first breathing app. Each breathing session is played as one pre-generated audio file via HTML `<audio>` to maximize lock-screen playback reliability on iPhone.

## Tech stack

- Vite + vanilla TypeScript
- PWA manifest + service worker
- No backend

## Implemented MVP scope

- Mode types:
  - `Equal (N-N)` with `N=4..8`
  - `Box 4-4-4-4`
  - `4-7-8`
- Durations: `5, 10, 15, 20, 25, 30` minutes
- Controls: Start / Pause / Resume / Restart / Stop
- Countdown from `<audio>.currentTime` and `<audio>.duration`
- Offline playback for cached tracks
- Local persistence for mode/duration/volume + Equal slider value

## Run locally

```bash
npm install
npm run dev
```

Build preview:

```bash
npm run build
npm run preview
```

## Audio generation and validation

Generate source sounds and full track set:

```bash
npm run generate:audio
```

Validation suite:

```bash
npm run check:audio:set
npm run check:audio
npm run check:audio:size
```

Or run all gates at once:

```bash
npm run check:assets
```

### Naming convention

- Equal: `even-44-5m.mp3` ... `even-88-30m.mp3`
- Box: `box-4444-5m.mp3` ... `box-4444-30m.mp3`
- 4-7-8: `relax-478-5m.mp3` ... `relax-478-30m.mp3`

Total expected session tracks: `42`.

Source sounds:

- `public/audio/source/gong_inhale.mp3`
- `public/audio/source/gong_exhale.mp3`
- `public/audio/source/tick_soft.mp3`

## GitHub Pages deployment

Recommended path is GitHub Actions via `/Users/vpavlin/PycharmProjects/breeth/.github/workflows/deploy-pages.yml`.

1. Push the project to GitHub (`main` branch).
2. In repository settings, open `Pages` and set source to `GitHub Actions`.
3. Workflow validates audio assets, builds with repo base-path, and publishes `dist`.

## PWA notes

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`
- Cache strategy:
  - App shell: cache-first
  - Audio: cache-first with lazy cache on first use

## Audio size gate

Asset growth is controlled with checks:

- Warning above `220 MB`
- Fail above `260 MB`

Thresholds apply to expected `42` session tracks.

## Tested iPhone/iOS

- Pending manual verification on physical device before release.

## Known limitations

- iOS lock-screen/background media behavior varies by device, iOS version, and system settings (including Low Power Mode).
- Offline playback is guaranteed only for tracks that were previously cached.
- Audio encoding is tuned for size constraints (`~40 kbps mono`) to keep session-track set near practical limits.

## QA checklist

- Equal mode:
  - Validate `N=4..8` mapping across all durations.
  - Verify slider value persistence after reload.
- Regression on existing modes:
  - Box: tick only in hold phases.
  - 4-7-8: tick only in 7-second hold.
- Verify Start/Pause/Resume/Restart/Stop/completion state transitions.
- Verify PWA install and standalone launch on iPhone.
- Verify lock-screen playback in iPhone PWA for at least 10 minutes.

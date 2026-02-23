# Breeth MVP (iOS-first PWA)

Breeth is a static audio-first breathing app. Each breathing session is played as one pre-generated audio file via HTML `<audio>` to maximize lock-screen playback reliability on iPhone.

## Tech stack

- Vite + vanilla TypeScript
- PWA manifest + service worker
- No backend

## Implemented MVP scope

- Modes: `4-4`, `Box 4-4-4-4`, `4-7-8`
- Durations: `5, 10, 15, 20, 25, 30` minutes
- Controls: Start / Pause / Resume / Stop
- Countdown from `<audio>.currentTime` and `<audio>.duration`
- Offline playback for cached tracks
- Local persistence for mode/duration/volume

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

## Audio generation

Generate 3 source sounds + 18 session tracks:

```bash
npm run generate:audio
```

Validate all generated track durations:

```bash
npm run check:audio
```

Generated files:

- `public/audio/even-44-5m.mp3` ... `public/audio/even-44-30m.mp3`
- `public/audio/box-4444-5m.mp3` ... `public/audio/box-4444-30m.mp3`
- `public/audio/relax-478-5m.mp3` ... `public/audio/relax-478-30m.mp3`
- `public/audio/source/gong_inhale.mp3`
- `public/audio/source/gong_exhale.mp3`
- `public/audio/source/tick_soft.mp3`

## GitHub Pages deployment

Recommended path is GitHub Actions via `/Users/vpavlin/PycharmProjects/breeth/.github/workflows/deploy-pages.yml`.

1. Push the project to a GitHub repository (default branch: `main`).
2. In repository settings, open `Pages` and set source to `GitHub Actions`.
3. Push to `main` (or run the workflow manually from Actions tab).
4. Workflow builds with `BASE_PATH=/<repo-name>/` and publishes `dist` automatically.

## PWA notes

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`
- Cache strategy:
  - App shell: cache-first
  - Audio: cache-first with lazy cache on first use

## Tested iPhone/iOS

- Pending manual verification on physical device before release.

## Known limitations

- iOS lock-screen/background media behavior varies by device, iOS version, and system settings (including Low Power Mode).
- Offline playback is guaranteed only for tracks that were previously cached.
- Audio encoding is tuned for size constraints (`~40 kbps mono`) to keep total MVP asset size near 100 MB.

## QA checklist

- Validate all mode/duration combinations map to correct file.
- Verify tick rules by mode:
  - no tick in 4-4
  - ticks only in hold phases in Box and 4-7-8
- Verify Start/Pause/Resume/Stop/completion state transitions.
- Verify PWA install and standalone launch on iPhone.
- Verify lock-screen playback in iPhone PWA for at least 10 minutes.

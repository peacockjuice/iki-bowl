# MVP Plan: Iki Gong

## Goal
Build an iOS-first static PWA without backend where each breathing session is a single pre-generated audio track for reliable lock-screen playback.

## Fixed decisions
1. Stack: Vite + vanilla TypeScript.
2. Audio: 18 pre-generated MP3 tracks + 3 source sounds generated in-project.
3. Offline: app shell precache, audio lazy cache on first use.
4. Deploy target: GitHub Pages (Project Pages).
5. iPhone KPI: at least 10 minutes continuous lock-screen playback in PWA on one tested device.
6. No in-app master volume control; session volume is fixed to audio element max and adjusted by device volume.

## PRD constraints
1. Modes only: 4-4, Box 4-4-4-4, 4-7-8.
2. Durations only: 5/10/20 minutes.
3. Hold phases use assigned hold sample for full hold duration (no per-second tick events).
4. Core playback via HTML `<audio>` only; no JS timer-based breathing engine.
5. Explicit state machine: idle/loading/playing/paused/completed/error.

## Delivery checklist
1. Deterministic filename mapping for all 18 mode-duration combinations.
2. Start/Pause/Resume/Stop + completion screen and error recovery.
3. Countdown from audio currentTime/duration with foreground resync.
4. PWA installability + offline playback for cached tracks.
5. Audio generation script + duration validation script + README docs.

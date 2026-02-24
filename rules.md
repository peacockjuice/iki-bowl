# Iki Gong Engineering Rules

This file defines implementation invariants for contributors. Follow these rules to avoid regressions.

## 1. Core product invariants

1. Audio-first engine is mandatory.
- One breathing session = one pre-generated audio file.
- Do not implement phase timing with JS timers (`setInterval`, `setTimeout`) as the source of truth.

2. `<audio>` is the runtime source of truth.
- Countdown must derive from `audio.currentTime` and `audio.duration`.
- UI countdown target is selected duration (`5/10/20`) for all modes.
- After target time, UI stays at `00:00` while tail audio continues until `ended`.
- UI can pause rendering in background, but must resync on foreground.

3. Explicit player state machine must remain intact.
- Allowed states: `idle`, `loading`, `playing`, `paused`, `completed`, `error`.
- Do not bypass transitions ad-hoc in UI handlers.

## 2. Mode model and UX invariants

1. Supported mode types:
- `equal` (with `N-N`, `N=4..7`)
- `box4444`
- `relax478`

2. Equal slider behavior:
- Slider `N` is visible only when `modeType=equal`.
- Slider values are strictly `4,5,6,7`.

3. Duration options are fixed:
- `5, 10, 20` minutes.

## 3. Audio asset contract

1. Active required session tracks: `18`.
- Equal: `4` rhythm values x `3` durations = `12`.
- Box: `3`.
- Relax: `3`.

2. Deterministic filename mapping is mandatory.
- Equal: `even-44/55/66/77-<duration>m.mp3`.
- Box: `box-4444-<duration>m.mp3`.
- 4-7-8: `relax-478-<duration>m.mp3`.

3. Source-of-truth for all active tracks:
- `public/audio/records`

4. Generation policy:
- `generate:audio` is copy-only from `public/audio/records` by deterministic filename mapping.
- No synthesis fallback is allowed.
- Script must fail if any required record source file is missing.

5. Legacy policy:
- Legacy active-track extras in top-level `public/audio` are not allowed.
- `check:audio:set` must fail on any extra top-level `*.mp3`.

## 4. Storage and migration rules

1. Current storage keys:
- `selectedModeType`
- `equalSeconds`
- `selectedDuration`

2. Backward compatibility is required.
- Keep migration from legacy `selectedMode` values (`even44`, `box4444`, `relax478`).

3. Normalization rules:
- `equalSeconds` must be clamped to `4..7`.
- `selectedDuration` must be normalized to nearest of `{5,10,20}` with deterministic tie: `15 -> 20`.
- Remove legacy `masterVolume` key during settings load.

## 5. Branding and visual rules

1. Product name must remain `Iki Gong` in user-facing surfaces.
- Update UI, document title, PWA manifest, and media metadata together.

2. Brandbook constraints are mandatory.
- No gradients, no glassmorphism, no heavy shadows.
- Never use pure white `#FFFFFF` or pure black `#000000`.
- Use one sans-serif type family with max two weights (regular/medium).
- Respect spacing/radius/button-size ranges from `brandbook.txt`.

## 6. PWA/service-worker safety rules

1. Dev mode must not rely on service worker.
- Keep SW registration disabled/unregistered in development.

2. Audio fetch with `Range` headers is special.
- Do not `Cache.put` partial `206` responses.
- Preserve range-aware strategy and cache warming behavior.

3. If SW behavior changes, bump cache version.
- Update `CACHE_VERSION` in `public/sw.js`.

## 7. Quality gates before merge

Run all checks before commit/push:

```bash
npm run generate:audio
npm run check:branding
npm run check:assets
npm run build
```

`check:assets` includes:
- active set presence check
- duration validation (`target..target+35s` for all active tracks)
- size gate (warn > 520MB, fail > 600MB)

## 8. Deployment rules

1. GitHub Pages deploy is handled by workflow:
- `.github/workflows/deploy-pages.yml`

2. Do not break workflow assumptions:
- `npm install` must succeed in CI
- `npm run check:assets` must pass in CI
- `npm run build` must pass with `BASE_PATH=/<repo>/`

## 9. Change policy

1. If changing mode model, filenames, storage keys, or branding:
- Update `README.md`
- Update PRD active overrides
- Keep migration path documented

2. If changing audio specs:
- Regenerate audio assets
- Re-run `check:assets`
- Confirm size gate impact

3. If source files in `public/audio/records` are updated:
- run `npm run generate:audio`
- ensure `public/audio` contains only the 18 active top-level tracks

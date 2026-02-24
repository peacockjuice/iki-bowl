import './styles.css';

import { AudioSessionPlayer } from './player/audioSessionPlayer';
import type { PlayerStateChangeDetail, TimeUpdateDetail, TrackStatusDetail } from './player/types';
import { registerServiceWorker } from './pwa/registerSw';
import { loadSettings, saveSettings } from './storage/settings';
import { renderApp } from './ui/template';
import {
  DURATIONS,
  EQUAL_SECONDS,
  MODE_TYPES,
  getModeLabel,
  type DurationMin,
  type EqualSeconds,
  type ModeType,
} from './utils/constants';
import { formatMmSs } from './utils/time';
import { resolveTrackFilename } from './utils/trackMapping';

registerServiceWorker();

const appRoot = document.querySelector<HTMLElement>('#app');
if (!appRoot) {
  throw new Error('Missing #app root');
}

const ui = renderApp(appRoot);
const settings = loadSettings();
const player = new AudioSessionPlayer();

let selectedModeType: ModeType = settings.modeType;
let selectedEqualSeconds: EqualSeconds = settings.equalSeconds;
let selectedDuration: DurationMin = settings.durationMin;
let selectedTrackSrc = '';
let rafId = 0;
let lastPhaseLabel: PhaseLabel = 'Begin';
type PhaseLabel = 'Begin' | 'Inhale' | 'Hold' | 'HoldOut' | 'Exhale' | 'Pause' | 'Complete';
const MODE_VALUES: readonly ModeType[] = ['box4444', 'equal', 'relax478'];
const DURATION_VALUES = [...DURATIONS] as DurationMin[];

function updateThumb(container: HTMLElement, noTransition = false): void {
  const activeBtn = container.querySelector<HTMLElement>('.segment.active');
  const thumb = container.querySelector<HTMLElement>('.segmented-thumb');
  if (!activeBtn || !thumb) return;
  if (noTransition) thumb.style.transition = 'none';
  thumb.style.width = `${activeBtn.offsetWidth}px`;
  thumb.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
  if (noTransition) requestAnimationFrame(() => { thumb.style.transition = ''; });
}

function setEqualFieldVisibility(): void {
  const show = selectedModeType === 'equal';
  ui.equalField.classList.toggle('hidden', !show);
  if (show) updateThumb(ui.equalSegmented, true);
}

function setModeDescription(): void {
  ui.modeDescription.textContent = MODE_TYPES[selectedModeType].description;
}

function getDurationIndex(duration: DurationMin): number {
  const index = DURATION_VALUES.indexOf(duration);
  return index >= 0 ? index : 0;
}

function getDurationFromIndex(indexRaw: number): DurationMin {
  const clamped = Math.max(0, Math.min(DURATION_VALUES.length - 1, Math.round(indexRaw)));
  return DURATION_VALUES[clamped];
}

function getModeIndex(modeType: ModeType): number {
  const index = MODE_VALUES.indexOf(modeType);
  return index >= 0 ? index : 0;
}

function getModeFromIndex(indexRaw: number): ModeType {
  const clamped = Math.max(0, Math.min(MODE_VALUES.length - 1, Math.round(indexRaw)));
  return MODE_VALUES[clamped];
}

function setSegmentedActive(container: HTMLElement, value: string): void {
  container.querySelectorAll('.segment').forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.value === value);
  });
  updateThumb(container);
}

function getTrackSrc(modeType: ModeType, equalSeconds: EqualSeconds, durationMin: DurationMin): string {
  const filename = resolveTrackFilename({ modeType, equalSeconds, durationMin });
  return new URL(`audio/${filename}`, new URL(import.meta.env.BASE_URL, window.location.origin)).toString();
}

function updateRemaining(remainingSec: number): void {
  ui.remainingValue.textContent = formatMmSs(remainingSec);
}

function getDisplayRemainingSec(currentTimeSec: number, fallbackRemainingSec: number): number {
  const targetSec = selectedDuration * 60;
  if (!Number.isFinite(targetSec)) {
    return Math.max(0, fallbackRemainingSec);
  }
  return Math.max(0, targetSec - currentTimeSec);
}

function getReadyDisplayRemainingSec(durationSec: number): number {
  const targetSec = selectedDuration * 60;
  if (!Number.isFinite(targetSec)) {
    return durationSec;
  }
  return targetSec;
}

function stopCountdownLoop(): void {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function runCountdownLoop(): void {
  stopCountdownLoop();
  const loop = () => {
    const snapshot = player.getSnapshot();
    updateRemaining(getDisplayRemainingSec(snapshot.currentTimeSec, snapshot.remainingSec));
    if (player.getState() === 'playing') {
      rafId = requestAnimationFrame(loop);
    }
  };
  rafId = requestAnimationFrame(loop);
}

function setScreenMode(showSession: boolean): void {
  ui.homeSection.classList.toggle('hidden', showSession);
  ui.sessionSection.classList.toggle('hidden', !showSession);
}

function clearMessages(): void {
  ui.errorMessage.textContent = '';
  ui.interruptionMessage.textContent = '';
}

function getPhaseRemainingSeconds(label: PhaseLabel, currentTimeSec: number): number {
  if (selectedModeType === 'equal') {
    const N = selectedEqualSeconds;
    const offset = currentTimeSec % (N * 2);
    return label === 'Inhale' ? N - offset : N * 2 - offset;
  }
  if (selectedModeType === 'box4444') {
    const offset = currentTimeSec % 16;
    if (label === 'Inhale') return 4 - offset;
    if (label === 'Hold') return 8 - offset;
    if (label === 'Exhale') return 12 - offset;
    return 16 - offset; // HoldOut
  }
  // relax478
  const offset = currentTimeSec % 19;
  if (label === 'Inhale') return 4 - offset;
  if (label === 'Hold') return 11 - offset;
  return 19 - offset; // Exhale
}

function setPhaseLabel(label: PhaseLabel, currentTimeSec?: number): void {
  lastPhaseLabel = label;

  const textByLabel: Record<PhaseLabel, string> = {
    Begin: 'Begin',
    Inhale: 'Inhale',
    Hold: 'Hold',
    HoldOut: 'Hold',
    Exhale: 'Exhale',
    Pause: 'Pause',
    Complete: 'Complete',
  };
  ui.phaseLabel.textContent = textByLabel[label];

  if ((label === 'Inhale' || label === 'Exhale') && currentTimeSec !== undefined) {
    const ms = Math.round(Math.max(getPhaseRemainingSeconds(label, currentTimeSec), 0.1) * 1000);
    ui.breathCircle.style.setProperty('--motion-breath', `${ms}ms`);
    ui.breathCircle.style.setProperty('--breath-easing', 'ease-in-out');
  } else if (label === 'Hold' || label === 'HoldOut') {
    ui.breathCircle.style.setProperty('--motion-breath', '300ms');
    ui.breathCircle.style.removeProperty('--breath-easing');
  } else {
    ui.breathCircle.style.removeProperty('--motion-breath');
    ui.breathCircle.style.removeProperty('--breath-easing');
  }

  const classByLabel: Record<PhaseLabel, string> = {
    Begin: 'phase-begin',
    Inhale: 'phase-inhale',
    Hold: 'phase-hold',
    HoldOut: 'phase-hold-out',
    Exhale: 'phase-exhale',
    Pause: 'phase-pause',
    Complete: 'phase-complete',
  };
  ui.breathCircle.className = `breath-circle ${classByLabel[label]}`;
}

function updatePauseResumeButton(state: 'playing' | 'paused' | 'other'): void {
  if (state === 'playing') {
    ui.pauseResumeButton.textContent = 'Pause';
    ui.pauseResumeButton.disabled = false;
    return;
  }
  if (state === 'paused') {
    ui.pauseResumeButton.textContent = 'Resume';
    ui.pauseResumeButton.disabled = false;
    return;
  }
  ui.pauseResumeButton.textContent = 'Pause';
  ui.pauseResumeButton.disabled = true;
}

function setStartAgainVisible(visible: boolean): void {
  ui.startAgainButton.classList.toggle('hidden', !visible);
}

function getCurrentPhaseLabel(currentTimeSec: number): PhaseLabel {
  if (currentTimeSec < 0) {
    return 'Begin';
  }

  if (selectedModeType === 'equal') {
    const cycleSec = selectedEqualSeconds * 2;
    const offsetSec = currentTimeSec % cycleSec;
    return offsetSec < selectedEqualSeconds ? 'Inhale' : 'Exhale';
  }

  if (selectedModeType === 'box4444') {
    const offsetSec = currentTimeSec % 16;
    if (offsetSec < 4) {
      return 'Inhale';
    }
    if (offsetSec < 8) {
      return 'Hold';
    }
    if (offsetSec < 12) {
      return 'Exhale';
    }
    return 'HoldOut';
  }

  const offsetSec = currentTimeSec % 19;
  if (offsetSec < 4) {
    return 'Inhale';
  }
  if (offsetSec < 11) {
    return 'Hold';
  }
  return 'Exhale';
}

async function isTrackCached(src: string): Promise<boolean> {
  if (!('caches' in window)) {
    return player.isTrackReadyFor(src);
  }

  try {
    const cached = await caches.match(src);
    return Boolean(cached);
  } catch {
    return false;
  }
}

function setMediaSessionMetadata(): void {
  if (!('mediaSession' in navigator)) {
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: `Iki Bowl ${getModeLabel(selectedModeType, selectedEqualSeconds)}`,
    artist: 'Iki Bowl',
    album: `${selectedDuration} min session`,
  });
}

function configureMediaSessionActions(): void {
  if (!('mediaSession' in navigator)) {
    return;
  }

  const setAction = (action: MediaSessionAction, handler: () => void): void => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // Browser may not support all actions.
    }
  };

  setAction('play', () => {
    void player.resume();
  });
  setAction('pause', () => {
    player.pause();
  });
  setAction('stop', () => {
    player.stop();
    setScreenMode(false);
    stopCountdownLoop();
  });
}

function preloadSelectedTrack(): void {
  clearMessages();
  selectedTrackSrc = getTrackSrc(selectedModeType, selectedEqualSeconds, selectedDuration);
  player.preload(selectedTrackSrc);
  ui.preloadStatus.textContent = 'Preparing selected session...';
  ui.startButton.disabled = true;
  setEqualFieldVisibility();
  setModeDescription();
  setMediaSessionMetadata();
}

configureMediaSessionActions();

setSegmentedActive(ui.modeSegmented, String(getModeIndex(selectedModeType)));
setSegmentedActive(ui.equalSegmented, String(selectedEqualSeconds));
setSegmentedActive(ui.durationSegmented, String(getDurationIndex(selectedDuration)));
document.fonts.ready.then(() => {
  requestAnimationFrame(() => {
    [ui.modeSegmented, ui.equalSegmented, ui.durationSegmented].forEach((seg) => {
      updateThumb(seg, true);
      seg.querySelector<HTMLElement>('.segmented-thumb')!.style.opacity = '1';
    });
  });
});
updatePauseResumeButton('other');
updateRemaining(0);
setEqualFieldVisibility();
setModeDescription();
setPhaseLabel('Begin');
setStartAgainVisible(false);

ui.modeSegmented.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.segment') as HTMLElement | null;
  if (!btn?.dataset.value) return;
  setSegmentedActive(ui.modeSegmented, btn.dataset.value);
  selectedModeType = getModeFromIndex(Number(btn.dataset.value));
  saveSettings({ modeType: selectedModeType });
  preloadSelectedTrack();
});

ui.equalSegmented.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.segment') as HTMLElement | null;
  if (!btn?.dataset.value) return;
  const value = Number(btn.dataset.value);
  if (!(EQUAL_SECONDS as readonly number[]).includes(value)) return;
  selectedEqualSeconds = value as EqualSeconds;
  setSegmentedActive(ui.equalSegmented, btn.dataset.value);
  saveSettings({ equalSeconds: selectedEqualSeconds });
  preloadSelectedTrack();
});

ui.durationSegmented.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.segment') as HTMLElement | null;
  if (!btn?.dataset.value) return;
  setSegmentedActive(ui.durationSegmented, btn.dataset.value);
  selectedDuration = getDurationFromIndex(Number(btn.dataset.value));
  saveSettings({ durationMin: selectedDuration });
  preloadSelectedTrack();
});

async function startSelectedSession(): Promise<void> {
  clearMessages();

  if (!navigator.onLine) {
    const cached = await isTrackCached(selectedTrackSrc);
    if (!cached && !player.isTrackReadyFor(selectedTrackSrc)) {
      ui.errorMessage.textContent = 'This session is not available offline yet. Connect once to download it.';
      return;
    }
  }

  setScreenMode(true);
  saveSettings({ lastUsedAt: new Date().toISOString() });
  await player.start(selectedTrackSrc);
}

ui.startButton.addEventListener('click', () => {
  void startSelectedSession();
});

ui.pauseResumeButton.addEventListener('click', () => {
  if (player.getState() === 'playing') {
    player.pause();
    return;
  }
  if (player.getState() === 'paused') {
    void player.resume();
  }
});

ui.stopButton.addEventListener('click', () => {
  player.stop();
  stopCountdownLoop();
  setScreenMode(false);
  setPhaseLabel('Begin');
  setStartAgainVisible(false);
});

ui.startAgainButton.addEventListener('click', () => {
  clearMessages();
  setStartAgainVisible(false);
  if (player.getState() === 'completed' || player.getState() === 'error') {
    void player.restart();
    return;
  }
  void startSelectedSession();
});

player.addEventListener('trackstatus', (event) => {
  const detail = (event as CustomEvent<TrackStatusDetail>).detail;
  if (detail.src !== selectedTrackSrc) {
    return;
  }

  if (detail.loading) {
    ui.preloadStatus.textContent = 'Preparing selected session...';
    ui.startButton.disabled = true;
    return;
  }

  if (detail.ready) {
    ui.preloadStatus.textContent = 'Session ready.';
    ui.startButton.disabled = false;
    if (typeof detail.durationSec === 'number') {
      updateRemaining(getReadyDisplayRemainingSec(detail.durationSec));
    }
    return;
  }

  if (detail.errorMessage) {
    ui.preloadStatus.textContent = detail.errorMessage;
    ui.startButton.disabled = true;
    if (!navigator.onLine) {
      ui.errorMessage.textContent = 'This session is not available offline yet. Connect once to download it.';
    }
  }
});

player.addEventListener('timeupdate', (event) => {
  const detail = (event as CustomEvent<TimeUpdateDetail>).detail;
  updateRemaining(getDisplayRemainingSec(detail.currentTimeSec, detail.remainingSec));
  if (player.getState() === 'playing') {
    const newLabel = getCurrentPhaseLabel(detail.currentTimeSec);
    if (newLabel !== lastPhaseLabel) {
      setPhaseLabel(newLabel, detail.currentTimeSec);
    }
  }
});

player.addEventListener('statechange', (event) => {
  const detail = (event as CustomEvent<PlayerStateChangeDetail>).detail;

  if (detail.state === 'loading') {
    updatePauseResumeButton('other');
    setStartAgainVisible(false);
    setPhaseLabel('Begin');
    ui.interruptionMessage.textContent = 'Loading selected session...';
    return;
  }

  if (detail.state === 'playing') {
    clearMessages();
    updatePauseResumeButton('playing');
    setStartAgainVisible(false);
    const snapshot = player.getSnapshot();
    setPhaseLabel(getCurrentPhaseLabel(snapshot.currentTimeSec), snapshot.currentTimeSec);
    runCountdownLoop();
    return;
  }

  if (detail.state === 'paused') {
    updatePauseResumeButton('paused');
    stopCountdownLoop();
    setPhaseLabel('Pause');
    ui.interruptionMessage.textContent = detail.interrupted
      ? 'Playback was interrupted by the system or another media source.'
      : '';
    return;
  }

  if (detail.state === 'completed') {
    updatePauseResumeButton('other');
    stopCountdownLoop();
    updateRemaining(0);
    setPhaseLabel('Complete');
    ui.interruptionMessage.textContent = 'Complete.';
    setStartAgainVisible(true);
    return;
  }

  if (detail.state === 'error') {
    updatePauseResumeButton('other');
    stopCountdownLoop();
    setPhaseLabel('Pause');
    ui.errorMessage.textContent =
      detail.message ?? 'Could not load session audio. Check connection and try again.';
    setStartAgainVisible(true);
    setScreenMode(true);
    return;
  }

  if (detail.state === 'idle') {
    updatePauseResumeButton('other');
    stopCountdownLoop();
    setPhaseLabel('Begin');
    setStartAgainVisible(false);
    return;
  }
});

document.addEventListener('visibilitychange', () => {
  const snapshot = player.getSnapshot();
  updateRemaining(getDisplayRemainingSec(snapshot.currentTimeSec, snapshot.remainingSec));
  if (player.getState() === 'playing') {
    setPhaseLabel(getCurrentPhaseLabel(snapshot.currentTimeSec), snapshot.currentTimeSec);
  }
});

preloadSelectedTrack();

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
type PhaseLabel = 'Begin' | 'Inhale' | 'Hold' | 'Exhale' | 'Pause' | 'Complete';
const MODE_VALUES: readonly ModeType[] = ['box4444', 'equal', 'relax478'];
const DURATION_VALUES = [...DURATIONS] as DurationMin[];

function setEqualFieldVisibility(): void {
  ui.equalField.classList.toggle('hidden', selectedModeType !== 'equal');
}

function setModeDescription(): void {
  ui.modeDescription.textContent = MODE_TYPES[selectedModeType].description;
}

function setModeValue(): void {
  ui.modeValue.textContent = MODE_TYPES[selectedModeType].label;
}

function setEqualValue(): void {
  ui.equalValue.textContent = `${selectedEqualSeconds}-${selectedEqualSeconds}`;
}

function setDurationValue(): void {
  ui.durationValue.textContent = `${selectedDuration} min`;
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

function updateModeRangeProgress(): void {
  const min = Number(ui.modeInput.min);
  const max = Number(ui.modeInput.max);
  const value = Number(ui.modeInput.value);
  const range = Math.max(1, max - min);
  const percent = ((value - min) / range) * 100;
  ui.modeInput.style.setProperty('--range-progress', `${Math.max(0, Math.min(100, percent))}%`);
}

function updateEqualRangeProgress(): void {
  const min = Number(ui.equalInput.min);
  const max = Number(ui.equalInput.max);
  const value = Number(ui.equalInput.value);
  const range = Math.max(1, max - min);
  const percent = ((value - min) / range) * 100;
  ui.equalInput.style.setProperty('--range-progress', `${Math.max(0, Math.min(100, percent))}%`);
}

function updateDurationRangeProgress(): void {
  const min = Number(ui.durationInput.min);
  const max = Number(ui.durationInput.max);
  const value = Number(ui.durationInput.value);
  const range = Math.max(1, max - min);
  const percent = ((value - min) / range) * 100;
  ui.durationInput.style.setProperty('--range-progress', `${Math.max(0, Math.min(100, percent))}%`);
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

function setPhaseLabel(label: PhaseLabel): void {
  ui.phaseLabel.textContent = label;

  const classByLabel: Record<PhaseLabel, string> = {
    Begin: 'phase-begin',
    Inhale: 'phase-inhale',
    Hold: 'phase-hold',
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
    ui.pauseResumeButton.textContent = 'Begin';
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
    return 'Hold';
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
    title: `Iki Gong ${getModeLabel(selectedModeType, selectedEqualSeconds)}`,
    artist: 'Iki Gong',
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
  setModeValue();
  setModeDescription();
  setEqualValue();
  setDurationValue();
  setMediaSessionMetadata();
}

function configureRangeInputs(): void {
  ui.modeInput.min = '0';
  ui.modeInput.max = String(MODE_VALUES.length - 1);
  ui.modeInput.step = '1';
  ui.durationInput.min = '0';
  ui.durationInput.max = String(DURATION_VALUES.length - 1);
  ui.durationInput.step = '1';
}

configureRangeInputs();
configureMediaSessionActions();

ui.modeInput.value = String(getModeIndex(selectedModeType));
ui.equalInput.value = String(selectedEqualSeconds);
ui.durationInput.value = String(getDurationIndex(selectedDuration));
updatePauseResumeButton('other');
updateRemaining(0);
setEqualFieldVisibility();
setModeValue();
setModeDescription();
updateModeRangeProgress();
setEqualValue();
updateEqualRangeProgress();
setDurationValue();
updateDurationRangeProgress();
setPhaseLabel('Begin');
setStartAgainVisible(false);

ui.modeInput.addEventListener('input', () => {
  selectedModeType = getModeFromIndex(Number(ui.modeInput.value));
  ui.modeInput.value = String(getModeIndex(selectedModeType));
  updateModeRangeProgress();
  saveSettings({ modeType: selectedModeType });
  preloadSelectedTrack();
});

ui.equalInput.addEventListener('input', () => {
  const value = Number(ui.equalInput.value);
  if (!(EQUAL_SECONDS as readonly number[]).includes(value)) {
    return;
  }

  selectedEqualSeconds = value as EqualSeconds;
  saveSettings({ equalSeconds: selectedEqualSeconds });
  updateEqualRangeProgress();
  preloadSelectedTrack();
});

ui.durationInput.addEventListener('input', () => {
  selectedDuration = getDurationFromIndex(Number(ui.durationInput.value));
  ui.durationInput.value = String(getDurationIndex(selectedDuration));
  setDurationValue();
  updateDurationRangeProgress();
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
    setPhaseLabel(getCurrentPhaseLabel(detail.currentTimeSec));
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
    setPhaseLabel(getCurrentPhaseLabel(player.getSnapshot().currentTimeSec));
    runCountdownLoop();
    return;
  }

  if (detail.state === 'paused') {
    updatePauseResumeButton('paused');
    stopCountdownLoop();
    setPhaseLabel('Pause');
    ui.interruptionMessage.textContent = detail.interrupted
      ? 'Playback was interrupted by the system or another media source.'
      : 'Paused.';
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
    setPhaseLabel(getCurrentPhaseLabel(snapshot.currentTimeSec));
  }
});

preloadSelectedTrack();

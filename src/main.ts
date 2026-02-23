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

function setEqualFieldVisibility(): void {
  ui.equalField.classList.toggle('hidden', selectedModeType !== 'equal');
}

function setEqualValue(): void {
  ui.equalValue.textContent = `${selectedEqualSeconds}-${selectedEqualSeconds}`;
}

function setSessionLabels(): void {
  ui.sessionMode.textContent = getModeLabel(selectedModeType, selectedEqualSeconds);
  ui.sessionDuration.textContent = `${selectedDuration} min`;
}

function getTrackSrc(modeType: ModeType, equalSeconds: EqualSeconds, durationMin: DurationMin): string {
  const filename = resolveTrackFilename({ modeType, equalSeconds, durationMin });
  return new URL(`audio/${filename}`, new URL(import.meta.env.BASE_URL, window.location.origin)).toString();
}

function updateRemaining(remainingSec: number): void {
  ui.remainingValue.textContent = formatMmSs(remainingSec);
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
    updateRemaining(snapshot.remainingSec);
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

function updateRestartButtonEnabled(enabled: boolean): void {
  ui.restartButton.disabled = !enabled;
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
    title: `Breeth ${getModeLabel(selectedModeType, selectedEqualSeconds)}`,
    artist: 'Breeth',
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
  setEqualValue();
  setSessionLabels();
  setMediaSessionMetadata();
}

function fillOptions(): void {
  Object.values(MODE_TYPES).forEach((modeType) => {
    const option = document.createElement('option');
    option.value = modeType.key;
    option.textContent = modeType.label;
    ui.modeSelect.append(option);
  });

  DURATIONS.forEach((duration) => {
    const option = document.createElement('option');
    option.value = String(duration);
    option.textContent = `${duration} min`;
    ui.durationSelect.append(option);
  });
}

fillOptions();
configureMediaSessionActions();

ui.modeSelect.value = selectedModeType;
ui.equalInput.value = String(selectedEqualSeconds);
ui.durationSelect.value = String(selectedDuration);
ui.volumeInput.value = String(settings.volumePercent);
ui.volumeValue.textContent = `${settings.volumePercent}%`;

player.setVolumeFromPercent(settings.volumePercent);
updatePauseResumeButton('other');
updateRestartButtonEnabled(false);
updateRemaining(0);
setEqualFieldVisibility();
setEqualValue();
setSessionLabels();

ui.modeSelect.addEventListener('change', () => {
  const candidate = ui.modeSelect.value;
  if (!(candidate in MODE_TYPES)) {
    return;
  }

  selectedModeType = candidate as ModeType;
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
  preloadSelectedTrack();
});

ui.durationSelect.addEventListener('change', () => {
  selectedDuration = Number(ui.durationSelect.value) as DurationMin;
  saveSettings({ durationMin: selectedDuration });
  preloadSelectedTrack();
});

ui.volumeInput.addEventListener('input', () => {
  const volumePercent = Number(ui.volumeInput.value);
  ui.volumeValue.textContent = `${volumePercent}%`;
  player.setVolumeFromPercent(volumePercent);
  saveSettings({ volumePercent });
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

ui.restartButton.addEventListener('click', () => {
  clearMessages();
  ui.completionActions.classList.add('hidden');
  void player.restart();
});

ui.stopButton.addEventListener('click', () => {
  player.stop();
  stopCountdownLoop();
  setScreenMode(false);
});

ui.startAgainButton.addEventListener('click', () => {
  clearMessages();
  ui.completionActions.classList.add('hidden');
  if (player.getState() === 'completed') {
    void player.restart();
    return;
  }
  void startSelectedSession();
});

ui.backButton.addEventListener('click', () => {
  player.stop();
  stopCountdownLoop();
  setScreenMode(false);
  ui.completionActions.classList.add('hidden');
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
      updateRemaining(detail.durationSec);
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
  updateRemaining(detail.remainingSec);
});

player.addEventListener('statechange', (event) => {
  const detail = (event as CustomEvent<PlayerStateChangeDetail>).detail;

  ui.playbackState.textContent = detail.state[0].toUpperCase() + detail.state.slice(1);
  ui.completionActions.classList.add('hidden');

  if (detail.state === 'loading') {
    updatePauseResumeButton('other');
    updateRestartButtonEnabled(false);
    ui.interruptionMessage.textContent = 'Loading selected session...';
    return;
  }

  if (detail.state === 'playing') {
    clearMessages();
    updatePauseResumeButton('playing');
    updateRestartButtonEnabled(true);
    runCountdownLoop();
    return;
  }

  if (detail.state === 'paused') {
    updatePauseResumeButton('paused');
    updateRestartButtonEnabled(true);
    stopCountdownLoop();
    ui.interruptionMessage.textContent = detail.interrupted
      ? 'Playback was interrupted by the system or another media source.'
      : 'Playback paused.';
    ui.playbackState.textContent = detail.interrupted ? 'Interrupted' : 'Paused';
    return;
  }

  if (detail.state === 'completed') {
    updatePauseResumeButton('other');
    updateRestartButtonEnabled(true);
    stopCountdownLoop();
    ui.interruptionMessage.textContent = 'Session complete.';
    ui.completionActions.classList.remove('hidden');
    return;
  }

  if (detail.state === 'error') {
    updatePauseResumeButton('other');
    updateRestartButtonEnabled(true);
    stopCountdownLoop();
    ui.errorMessage.textContent =
      detail.message ?? 'Could not load session audio. Check connection and try again.';
    ui.completionActions.classList.remove('hidden');
    setScreenMode(true);
    return;
  }

  if (detail.state === 'idle') {
    updatePauseResumeButton('other');
    updateRestartButtonEnabled(false);
    stopCountdownLoop();
    ui.playbackState.textContent = 'Idle';
    return;
  }
});

document.addEventListener('visibilitychange', () => {
  const snapshot = player.getSnapshot();
  updateRemaining(snapshot.remainingSec);
});

preloadSelectedTrack();

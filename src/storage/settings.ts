import { DEFAULT_SETTINGS, DURATIONS, MODES, type DurationMin, type Mode } from '../utils/constants';

const STORAGE_KEYS = {
  mode: 'selectedMode',
  durationMin: 'selectedDuration',
  volumePercent: 'masterVolume',
  installHintDismissed: 'installHintDismissed',
  lastUsedAt: 'lastUsedAt',
} as const;

export interface AppSettings {
  mode: Mode;
  durationMin: DurationMin;
  volumePercent: number;
  installHintDismissed?: boolean;
  lastUsedAt?: string;
}

function isMode(input: string): input is Mode {
  return input in MODES;
}

function isDuration(input: number): input is DurationMin {
  return (DURATIONS as readonly number[]).includes(input);
}

export function loadSettings(): AppSettings {
  const modeRaw = localStorage.getItem(STORAGE_KEYS.mode) ?? DEFAULT_SETTINGS.mode;
  const durationRaw = Number(localStorage.getItem(STORAGE_KEYS.durationMin) ?? DEFAULT_SETTINGS.durationMin);
  const volumeRaw = Number(localStorage.getItem(STORAGE_KEYS.volumePercent) ?? DEFAULT_SETTINGS.volumePercent);

  return {
    mode: isMode(modeRaw) ? modeRaw : DEFAULT_SETTINGS.mode,
    durationMin: isDuration(durationRaw) ? durationRaw : DEFAULT_SETTINGS.durationMin,
    volumePercent: Number.isFinite(volumeRaw) ? Math.min(100, Math.max(0, volumeRaw)) : DEFAULT_SETTINGS.volumePercent,
    installHintDismissed: localStorage.getItem(STORAGE_KEYS.installHintDismissed) === 'true',
    lastUsedAt: localStorage.getItem(STORAGE_KEYS.lastUsedAt) ?? undefined,
  };
}

export function saveSettings(partial: Partial<AppSettings>): void {
  if (partial.mode) {
    localStorage.setItem(STORAGE_KEYS.mode, partial.mode);
  }
  if (typeof partial.durationMin === 'number') {
    localStorage.setItem(STORAGE_KEYS.durationMin, String(partial.durationMin));
  }
  if (typeof partial.volumePercent === 'number') {
    localStorage.setItem(STORAGE_KEYS.volumePercent, String(Math.min(100, Math.max(0, partial.volumePercent))));
  }
  if (typeof partial.installHintDismissed === 'boolean') {
    localStorage.setItem(STORAGE_KEYS.installHintDismissed, String(partial.installHintDismissed));
  }
  if (partial.lastUsedAt) {
    localStorage.setItem(STORAGE_KEYS.lastUsedAt, partial.lastUsedAt);
  }
}

import {
  DEFAULT_SETTINGS,
  DURATIONS,
  EQUAL_SECONDS,
  MODE_TYPES,
  type DurationMin,
  type EqualSeconds,
  type ModeType,
} from '../utils/constants';

const STORAGE_KEYS = {
  modeType: 'selectedModeType',
  equalSeconds: 'equalSeconds',
  durationMin: 'selectedDuration',
  volumePercent: 'masterVolume',
  installHintDismissed: 'installHintDismissed',
  lastUsedAt: 'lastUsedAt',
} as const;

const LEGACY_KEYS = {
  mode: 'selectedMode',
} as const;

export interface AppSettings {
  modeType: ModeType;
  equalSeconds: EqualSeconds;
  durationMin: DurationMin;
  volumePercent: number;
  installHintDismissed?: boolean;
  lastUsedAt?: string;
}

function isModeType(input: string): input is ModeType {
  return input in MODE_TYPES;
}

function isDuration(input: number): input is DurationMin {
  return (DURATIONS as readonly number[]).includes(input);
}

function isEqualSeconds(input: number): input is EqualSeconds {
  return (EQUAL_SECONDS as readonly number[]).includes(input);
}

function mapLegacyMode(mode: string | null): { modeType: ModeType; equalSeconds: EqualSeconds } | null {
  if (!mode) {
    return null;
  }

  if (mode === 'even44') {
    return { modeType: 'equal', equalSeconds: 4 };
  }

  if (mode === 'box4444') {
    return { modeType: 'box4444', equalSeconds: DEFAULT_SETTINGS.equalSeconds };
  }

  if (mode === 'relax478') {
    return { modeType: 'relax478', equalSeconds: DEFAULT_SETTINGS.equalSeconds };
  }

  return null;
}

export function loadSettings(): AppSettings {
  const modeTypeRaw = localStorage.getItem(STORAGE_KEYS.modeType);
  const equalRaw = Number(localStorage.getItem(STORAGE_KEYS.equalSeconds) ?? DEFAULT_SETTINGS.equalSeconds);
  const durationRaw = Number(localStorage.getItem(STORAGE_KEYS.durationMin) ?? DEFAULT_SETTINGS.durationMin);
  const volumeRaw = Number(localStorage.getItem(STORAGE_KEYS.volumePercent) ?? DEFAULT_SETTINGS.volumePercent);
  const legacyModeRaw = localStorage.getItem(LEGACY_KEYS.mode);
  const modeTypeCandidate = modeTypeRaw ?? '';

  let modeType: ModeType = isModeType(modeTypeCandidate) ? modeTypeCandidate : DEFAULT_SETTINGS.modeType;
  let equalSeconds: EqualSeconds = isEqualSeconds(equalRaw) ? equalRaw : DEFAULT_SETTINGS.equalSeconds;

  // One-time migration from previous mode model.
  if (!modeTypeRaw && legacyModeRaw) {
    const legacyMapped = mapLegacyMode(legacyModeRaw);
    if (legacyMapped) {
      modeType = legacyMapped.modeType;
      equalSeconds = legacyMapped.equalSeconds;
      localStorage.setItem(STORAGE_KEYS.modeType, modeType);
      localStorage.setItem(STORAGE_KEYS.equalSeconds, String(equalSeconds));
    }
  }

  return {
    modeType,
    equalSeconds,
    durationMin: isDuration(durationRaw) ? durationRaw : DEFAULT_SETTINGS.durationMin,
    volumePercent: Number.isFinite(volumeRaw) ? Math.min(100, Math.max(0, volumeRaw)) : DEFAULT_SETTINGS.volumePercent,
    installHintDismissed: localStorage.getItem(STORAGE_KEYS.installHintDismissed) === 'true',
    lastUsedAt: localStorage.getItem(STORAGE_KEYS.lastUsedAt) ?? undefined,
  };
}

export function saveSettings(partial: Partial<AppSettings>): void {
  if (partial.modeType) {
    localStorage.setItem(STORAGE_KEYS.modeType, partial.modeType);
  }
  if (typeof partial.equalSeconds === 'number') {
    localStorage.setItem(STORAGE_KEYS.equalSeconds, String(partial.equalSeconds));
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

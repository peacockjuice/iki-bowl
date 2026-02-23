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
  installHintDismissed?: boolean;
  lastUsedAt?: string;
}

function isModeType(input: string): input is ModeType {
  return input in MODE_TYPES;
}

function normalizeEqualSeconds(input: number): EqualSeconds {
  if (!Number.isFinite(input)) {
    return DEFAULT_SETTINGS.equalSeconds;
  }

  const rounded = Math.round(input);
  const min = EQUAL_SECONDS[0];
  const max = EQUAL_SECONDS[EQUAL_SECONDS.length - 1];
  if (rounded <= min) {
    return min;
  }
  if (rounded >= max) {
    return max;
  }
  return rounded as EqualSeconds;
}

function normalizeDuration(input: number): DurationMin {
  if (!Number.isFinite(input)) {
    return DEFAULT_SETTINGS.durationMin;
  }

  let best: DurationMin = DURATIONS[0];
  let bestDiff = Math.abs(input - best);
  for (const candidate of DURATIONS.slice(1)) {
    const diff = Math.abs(input - candidate);
    if (diff < bestDiff || (diff === bestDiff && candidate > best)) {
      best = candidate;
      bestDiff = diff;
    }
  }

  return best;
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
  const legacyModeRaw = localStorage.getItem(LEGACY_KEYS.mode);
  const modeTypeCandidate = modeTypeRaw ?? '';

  let modeType: ModeType = isModeType(modeTypeCandidate) ? modeTypeCandidate : DEFAULT_SETTINGS.modeType;
  let equalSeconds: EqualSeconds = normalizeEqualSeconds(equalRaw);

  // One-time migration from previous mode model.
  if (!modeTypeRaw && legacyModeRaw) {
    const legacyMapped = mapLegacyMode(legacyModeRaw);
    if (legacyMapped) {
      modeType = legacyMapped.modeType;
      equalSeconds = legacyMapped.equalSeconds;
    }
  }

  const durationMin = normalizeDuration(durationRaw);

  // Persist normalized values to keep storage consistent across app upgrades.
  localStorage.setItem(STORAGE_KEYS.modeType, modeType);
  localStorage.setItem(STORAGE_KEYS.equalSeconds, String(equalSeconds));
  localStorage.setItem(STORAGE_KEYS.durationMin, String(durationMin));
  localStorage.removeItem('masterVolume');

  return {
    modeType,
    equalSeconds,
    durationMin,
    installHintDismissed: localStorage.getItem(STORAGE_KEYS.installHintDismissed) === 'true',
    lastUsedAt: localStorage.getItem(STORAGE_KEYS.lastUsedAt) ?? undefined,
  };
}

export function saveSettings(partial: Partial<AppSettings>): void {
  if (partial.modeType) {
    localStorage.setItem(STORAGE_KEYS.modeType, partial.modeType);
  }
  if (typeof partial.equalSeconds === 'number') {
    localStorage.setItem(STORAGE_KEYS.equalSeconds, String(normalizeEqualSeconds(partial.equalSeconds)));
  }
  if (typeof partial.durationMin === 'number') {
    localStorage.setItem(STORAGE_KEYS.durationMin, String(normalizeDuration(partial.durationMin)));
  }
  if (typeof partial.installHintDismissed === 'boolean') {
    localStorage.setItem(STORAGE_KEYS.installHintDismissed, String(partial.installHintDismissed));
  }
  if (partial.lastUsedAt) {
    localStorage.setItem(STORAGE_KEYS.lastUsedAt, partial.lastUsedAt);
  }
}

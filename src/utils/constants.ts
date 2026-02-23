export const MODE_TYPES = {
  equal: {
    key: 'equal',
    label: 'Equal (N-N)',
  },
  box4444: {
    key: 'box4444',
    label: 'Box 4-4-4-4',
  },
  relax478: {
    key: 'relax478',
    label: '4-7-8',
  },
} as const;

export const EQUAL_SECONDS = [4, 5, 6, 7, 8] as const;
export const DURATIONS = [5, 10, 15, 20, 25, 30] as const;

export type ModeType = keyof typeof MODE_TYPES;
export type EqualSeconds = (typeof EQUAL_SECONDS)[number];
export type DurationMin = (typeof DURATIONS)[number];

export const DEFAULT_SETTINGS = {
  modeType: 'equal' as ModeType,
  equalSeconds: 4 as EqualSeconds,
  durationMin: 10 as DurationMin,
  volumePercent: 80,
};

export function getModeLabel(modeType: ModeType, equalSeconds: EqualSeconds): string {
  if (modeType === 'equal') {
    return `${equalSeconds}-${equalSeconds}`;
  }
  return MODE_TYPES[modeType].label;
}

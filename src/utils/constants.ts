export const MODE_TYPES = {
  equal: {
    key: 'equal',
    label: 'Buteyko (N-N)',
    description:
      'Retrains breathing volume downward; may reduce asthma reliever use in some people.',
  },
  box4444: {
    key: 'box4444',
    label: 'Box (4-4-4-4)',
    description:
      'Paced breathing with holds; helps quickly reduce stress and steady breathing rhythm.',
  },
  relax478: {
    key: 'relax478',
    label: 'Dr. Weil (4-7-8)',
    description:
      'Long exhale plus a pause; used to promote relaxation and help with sleep onset.',
  },
} as const;

export const EQUAL_SECONDS = [4, 5, 6, 7] as const;
export const DURATIONS = [5, 10, 20] as const;

export type ModeType = keyof typeof MODE_TYPES;
export type EqualSeconds = (typeof EQUAL_SECONDS)[number];
export type DurationMin = (typeof DURATIONS)[number];

export const DEFAULT_SETTINGS = {
  modeType: 'equal' as ModeType,
  equalSeconds: 6 as EqualSeconds,
  durationMin: 10 as DurationMin,
};

export function getModeLabel(modeType: ModeType, equalSeconds: EqualSeconds): string {
  if (modeType === 'equal') {
    return `${equalSeconds}-${equalSeconds}`;
  }
  return MODE_TYPES[modeType].label;
}

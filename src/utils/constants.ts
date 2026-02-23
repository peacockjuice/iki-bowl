export const MODES = {
  even44: {
    key: 'even44',
    label: '4-4',
    prefix: 'even-44',
  },
  box4444: {
    key: 'box4444',
    label: 'Box 4-4-4-4',
    prefix: 'box-4444',
  },
  relax478: {
    key: 'relax478',
    label: '4-7-8',
    prefix: 'relax-478',
  },
} as const;

export const DURATIONS = [5, 10, 15, 20, 25, 30] as const;

export type Mode = keyof typeof MODES;
export type DurationMin = (typeof DURATIONS)[number];

export const DEFAULT_SETTINGS = {
  mode: 'even44' as Mode,
  durationMin: 10 as DurationMin,
  volumePercent: 80,
};

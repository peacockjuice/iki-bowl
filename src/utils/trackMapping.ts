import type { DurationMin, EqualSeconds, ModeType } from './constants';

export interface TrackSelection {
  modeType: ModeType;
  equalSeconds: EqualSeconds;
  durationMin: DurationMin;
}

export function resolveTrackFilename(selection: TrackSelection): string {
  const { modeType, equalSeconds, durationMin } = selection;

  if (modeType === 'equal') {
    return `even-${equalSeconds}${equalSeconds}-${durationMin}m.mp3`;
  }

  if (modeType === 'box4444') {
    return `box-4444-${durationMin}m.mp3`;
  }

  return `relax-478-${durationMin}m.mp3`;
}

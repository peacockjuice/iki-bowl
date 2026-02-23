import type { DurationMin, Mode } from './constants';
import { MODES } from './constants';

export function resolveTrackFilename(mode: Mode, durationMin: DurationMin): string {
  return `${MODES[mode].prefix}-${durationMin}m.mp3`;
}

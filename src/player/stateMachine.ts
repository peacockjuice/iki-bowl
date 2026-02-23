import type { PlayerState } from './types';

const ALLOWED_TRANSITIONS: Record<PlayerState, ReadonlySet<PlayerState>> = {
  idle: new Set(['loading']),
  loading: new Set(['playing', 'error', 'idle']),
  playing: new Set(['paused', 'completed', 'idle', 'error']),
  paused: new Set(['playing', 'idle', 'error']),
  completed: new Set(['idle', 'loading']),
  error: new Set(['idle', 'loading']),
};

export function canTransition(from: PlayerState, to: PlayerState): boolean {
  return ALLOWED_TRANSITIONS[from].has(to);
}

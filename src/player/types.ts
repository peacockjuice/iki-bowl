export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';

export interface PlayerStateChangeDetail {
  state: PlayerState;
  message?: string;
  interrupted?: boolean;
}

export interface TrackStatusDetail {
  src: string;
  ready: boolean;
  loading: boolean;
  durationSec?: number;
  errorMessage?: string;
}

export interface TimeUpdateDetail {
  currentTimeSec: number;
  durationSec: number;
  remainingSec: number;
}

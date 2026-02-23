import { canTransition } from './stateMachine';
import type { PlayerState, PlayerStateChangeDetail, TimeUpdateDetail, TrackStatusDetail } from './types';

export class AudioSessionPlayer extends EventTarget {
  private readonly audio: HTMLAudioElement;
  private state: PlayerState = 'idle';
  private trackReady = false;
  private currentTrackSrc = '';
  private expectedPause = false;
  private pendingStart = false;
  private stopping = false;

  constructor() {
    super();
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.loop = false;
    this.audio.controls = false;
    this.audio.volume = 1;

    this.audio.addEventListener('loadedmetadata', this.handleTrackReady);
    this.audio.addEventListener('canplay', this.handleTrackReady);
    this.audio.addEventListener('play', this.handlePlay);
    this.audio.addEventListener('pause', this.handlePause);
    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('error', this.handleError);
  }

  getState(): PlayerState {
    return this.state;
  }

  getSnapshot(): TimeUpdateDetail {
    const durationSec = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
    const currentTimeSec = this.audio.currentTime;
    return {
      currentTimeSec,
      durationSec,
      remainingSec: Math.max(0, durationSec - currentTimeSec),
    };
  }

  isTrackReadyFor(src: string): boolean {
    return this.trackReady && src === this.currentTrackSrc;
  }

  preload(src: string): void {
    if (src === this.currentTrackSrc && this.trackReady) {
      this.emitTrackStatus({
        src,
        ready: true,
        loading: false,
        durationSec: this.audio.duration,
      });
      return;
    }

    this.currentTrackSrc = src;
    this.trackReady = false;
    this.pendingStart = false;

    this.audio.src = src;
    this.audio.load();

    this.emitTrackStatus({
      src,
      ready: false,
      loading: true,
    });
  }

  async start(src: string): Promise<void> {
    if (src !== this.currentTrackSrc) {
      this.preload(src);
    }

    this.transition('loading');

    if (!this.trackReady) {
      this.pendingStart = true;
      return;
    }

    await this.playInternal();
  }

  async resume(): Promise<void> {
    if (this.state !== 'paused') {
      return;
    }
    await this.playInternal();
  }

  pause(): void {
    if (this.state !== 'playing') {
      return;
    }
    this.expectedPause = true;
    this.audio.pause();
  }

  stop(): void {
    if (!['playing', 'paused', 'loading', 'completed', 'error'].includes(this.state)) {
      return;
    }

    this.stopping = true;
    this.pendingStart = false;
    this.expectedPause = true;

    if (!this.audio.paused) {
      this.audio.pause();
    }
    this.audio.currentTime = 0;

    this.transition('idle');
    this.stopping = false;
  }

  restart(): Promise<void> {
    this.audio.currentTime = 0;
    this.transition('loading');
    return this.playInternal();
  }

  private readonly handleTrackReady = (): void => {
    this.trackReady = true;
    this.emitTrackStatus({
      src: this.currentTrackSrc,
      ready: true,
      loading: false,
      durationSec: this.audio.duration,
    });

    if (this.pendingStart) {
      this.pendingStart = false;
      void this.playInternal();
    }
  };

  private readonly handlePlay = (): void => {
    this.transition('playing');
  };

  private readonly handlePause = (): void => {
    if (this.audio.ended || this.stopping) {
      this.expectedPause = false;
      return;
    }

    if (this.state === 'playing') {
      const interrupted = !this.expectedPause;
      this.transition('paused', undefined, interrupted);
    }
    this.expectedPause = false;
  };

  private readonly handleEnded = (): void => {
    this.transition('completed');
  };

  private readonly handleTimeUpdate = (): void => {
    const snapshot = this.getSnapshot();
    this.dispatchEvent(new CustomEvent<TimeUpdateDetail>('timeupdate', { detail: snapshot }));
  };

  private readonly handleError = (): void => {
    this.pendingStart = false;
    this.emitTrackStatus({
      src: this.currentTrackSrc,
      ready: false,
      loading: false,
      errorMessage: 'Could not load session audio. Check connection and try again.',
    });
    this.transition('error', 'Could not load session audio. Check connection and try again.');
  };

  private async playInternal(): Promise<void> {
    try {
      await this.audio.play();
    } catch (error) {
      const isBlocked = error instanceof DOMException && error.name === 'NotAllowedError';
      const message = isBlocked
        ? 'Audio playback was blocked. Tap Start again.'
        : 'Could not start playback. Please try again.';
      this.transition('error', message);
    }
  }

  private transition(next: PlayerState, message?: string, interrupted?: boolean): void {
    if (next === this.state) {
      return;
    }

    if (!canTransition(this.state, next)) {
      return;
    }

    this.state = next;
    const detail: PlayerStateChangeDetail = { state: next, message, interrupted };
    this.dispatchEvent(new CustomEvent<PlayerStateChangeDetail>('statechange', { detail }));
  }

  private emitTrackStatus(detail: TrackStatusDetail): void {
    this.dispatchEvent(new CustomEvent<TrackStatusDetail>('trackstatus', { detail }));
  }
}

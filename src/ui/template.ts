export interface UiRefs {
  modeInput: HTMLInputElement;
  modeValue: HTMLElement;
  modeDescription: HTMLElement;
  equalField: HTMLElement;
  equalInput: HTMLInputElement;
  equalValue: HTMLElement;
  durationInput: HTMLInputElement;
  durationValue: HTMLElement;
  preloadStatus: HTMLElement;
  startButton: HTMLButtonElement;
  homeSection: HTMLElement;
  sessionSection: HTMLElement;
  phaseLabel: HTMLElement;
  breathCircle: HTMLElement;
  remainingValue: HTMLElement;
  interruptionMessage: HTMLElement;
  errorMessage: HTMLElement;
  pauseResumeButton: HTMLButtonElement;
  stopButton: HTMLButtonElement;
  startAgainButton: HTMLButtonElement;
}

function query<T extends Element>(container: ParentNode, selector: string): T {
  const node = container.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Missing UI node: ${selector}`);
  }
  return node;
}

export function renderApp(root: HTMLElement): UiRefs {
  root.innerHTML = `
    <main class="app">
      <section id="homeSection" class="card screen-card">
        <h1>Iki Gong</h1>
        <p class="subtitle">Quiet breathing sessions for iPhone lock-screen use.</p>

        <div class="field">
          <label class="label" for="modeInput">
            <strong>Breathing mode</strong> : <span id="modeValue">Buteyko (N-N)</span>
          </label>
          <p id="modeDescription" class="mode-description"></p>
          <input id="modeInput" type="range" min="0" max="2" step="1" value="1" />
          <div class="range-labels" aria-hidden="true">
            <span class="range-label-item">Box<br />(4-4-4-4)</span>
            <span class="range-label-item">Buteyko<br />(N-N)</span>
            <span class="range-label-item">Dr. Weil<br />(4-7-8)</span>
          </div>
        </div>

        <div id="equalField" class="field">
          <label class="label" for="equalInput">
            <strong>Buteyko rhytm</strong> : <span id="equalValue">4-4</span>
          </label>
          <input id="equalInput" type="range" min="4" max="7" step="1" value="4" />
        </div>

        <div class="field">
          <label class="label" for="durationInput">
            <strong>Session duration</strong> : <span id="durationValue">10 min</span>
          </label>
          <input id="durationInput" type="range" min="0" max="2" step="1" value="1" />
        </div>

        <button id="startButton" disabled>Begin</button>
        <p id="preloadStatus" class="state">Preparing selected session...</p>
      </section>

      <section id="sessionSection" class="card screen-card session-screen hidden">
        <div id="breathCircle" class="breath-circle phase-begin">
          <p id="phaseLabel" class="phase-label">Begin</p>
        </div>
        <p id="remainingValue" class="remaining-value">00:00</p>
        <p id="interruptionMessage" class="muted"></p>
        <p id="errorMessage" class="error"></p>

        <div class="row">
          <button id="pauseResumeButton" class="secondary">Pause</button>
          <button id="stopButton" class="ghost">End</button>
        </div>

        <button id="startAgainButton" class="hidden" style="margin-top: 12px;">Begin again</button>
      </section>
    </main>
  `;

  return {
    modeInput: query<HTMLInputElement>(root, '#modeInput'),
    modeValue: query<HTMLElement>(root, '#modeValue'),
    modeDescription: query<HTMLElement>(root, '#modeDescription'),
    equalField: query<HTMLElement>(root, '#equalField'),
    equalInput: query<HTMLInputElement>(root, '#equalInput'),
    equalValue: query<HTMLElement>(root, '#equalValue'),
    durationInput: query<HTMLInputElement>(root, '#durationInput'),
    durationValue: query<HTMLElement>(root, '#durationValue'),
    preloadStatus: query<HTMLElement>(root, '#preloadStatus'),
    startButton: query<HTMLButtonElement>(root, '#startButton'),
    homeSection: query<HTMLElement>(root, '#homeSection'),
    sessionSection: query<HTMLElement>(root, '#sessionSection'),
    phaseLabel: query<HTMLElement>(root, '#phaseLabel'),
    breathCircle: query<HTMLElement>(root, '#breathCircle'),
    remainingValue: query<HTMLElement>(root, '#remainingValue'),
    interruptionMessage: query<HTMLElement>(root, '#interruptionMessage'),
    errorMessage: query<HTMLElement>(root, '#errorMessage'),
    pauseResumeButton: query<HTMLButtonElement>(root, '#pauseResumeButton'),
    stopButton: query<HTMLButtonElement>(root, '#stopButton'),
    startAgainButton: query<HTMLButtonElement>(root, '#startAgainButton'),
  };
}

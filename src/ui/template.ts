export interface UiRefs {
  modeSelect: HTMLSelectElement;
  equalField: HTMLElement;
  equalInput: HTMLInputElement;
  equalValue: HTMLElement;
  durationSelect: HTMLSelectElement;
  preloadStatus: HTMLElement;
  startButton: HTMLButtonElement;
  homeSection: HTMLElement;
  sessionSection: HTMLElement;
  sessionMode: HTMLElement;
  sessionDuration: HTMLElement;
  remainingValue: HTMLElement;
  playbackState: HTMLElement;
  interruptionMessage: HTMLElement;
  errorMessage: HTMLElement;
  pauseResumeButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  stopButton: HTMLButtonElement;
  startAgainButton: HTMLButtonElement;
  backButton: HTMLButtonElement;
  completionActions: HTMLElement;
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
      <section class="card">
        <h1>Iki Gong</h1>
        <p class="subtitle">Quiet breathing sessions for iPhone lock-screen use.</p>
      </section>

      <section id="homeSection" class="card">
        <div class="field">
          <label class="label" for="modeSelect">Breathing mode</label>
          <select id="modeSelect"></select>
        </div>

        <div id="equalField" class="field">
          <label class="label" for="equalInput">
            Equal rhythm N-N (<span id="equalValue">4-4</span>)
          </label>
          <input id="equalInput" type="range" min="4" max="7" step="1" value="4" />
        </div>

        <div class="field">
          <label class="label" for="durationSelect">Session duration</label>
          <select id="durationSelect"></select>
        </div>

        <button id="startButton" disabled>Start session</button>
        <p id="preloadStatus" class="state">Preparing selected session...</p>
      </section>

      <section class="card guide">
        <h2>iPhone quick guidance</h2>
        <ul>
          <li>Turn sound on before starting.</li>
          <li>Add the app to Home Screen for best background behavior.</li>
          <li>Start from Home Screen, then lock your screen.</li>
          <li>Background playback varies by iPhone model, iOS version, and system settings.</li>
        </ul>
      </section>

      <section id="sessionSection" class="card hidden">
        <h2>Session</h2>

        <div class="metrics">
          <div class="metric">
            <div class="title">Mode</div>
            <div id="sessionMode" class="value">-</div>
          </div>
          <div class="metric">
            <div class="title">Duration</div>
            <div id="sessionDuration" class="value">-</div>
          </div>
          <div class="metric">
            <div class="title">Remaining</div>
            <div id="remainingValue" class="value">00:00</div>
          </div>
          <div class="metric">
            <div class="title">Playback state</div>
            <div id="playbackState" class="value">Idle</div>
          </div>
        </div>

        <p id="interruptionMessage" class="muted"></p>
        <p id="errorMessage" class="error"></p>

        <div class="row">
          <button id="pauseResumeButton" class="secondary">Pause</button>
          <button id="restartButton" class="secondary">Restart</button>
          <button id="stopButton" class="ghost">Stop</button>
        </div>

        <div id="completionActions" class="row hidden" style="margin-top: 10px;">
          <button id="startAgainButton">Start again</button>
          <button id="backButton" class="ghost">Back</button>
        </div>
      </section>
    </main>
  `;

  return {
    modeSelect: query<HTMLSelectElement>(root, '#modeSelect'),
    equalField: query<HTMLElement>(root, '#equalField'),
    equalInput: query<HTMLInputElement>(root, '#equalInput'),
    equalValue: query<HTMLElement>(root, '#equalValue'),
    durationSelect: query<HTMLSelectElement>(root, '#durationSelect'),
    preloadStatus: query<HTMLElement>(root, '#preloadStatus'),
    startButton: query<HTMLButtonElement>(root, '#startButton'),
    homeSection: query<HTMLElement>(root, '#homeSection'),
    sessionSection: query<HTMLElement>(root, '#sessionSection'),
    sessionMode: query<HTMLElement>(root, '#sessionMode'),
    sessionDuration: query<HTMLElement>(root, '#sessionDuration'),
    remainingValue: query<HTMLElement>(root, '#remainingValue'),
    playbackState: query<HTMLElement>(root, '#playbackState'),
    interruptionMessage: query<HTMLElement>(root, '#interruptionMessage'),
    errorMessage: query<HTMLElement>(root, '#errorMessage'),
    pauseResumeButton: query<HTMLButtonElement>(root, '#pauseResumeButton'),
    restartButton: query<HTMLButtonElement>(root, '#restartButton'),
    stopButton: query<HTMLButtonElement>(root, '#stopButton'),
    startAgainButton: query<HTMLButtonElement>(root, '#startAgainButton'),
    backButton: query<HTMLButtonElement>(root, '#backButton'),
    completionActions: query<HTMLElement>(root, '#completionActions'),
  };
}

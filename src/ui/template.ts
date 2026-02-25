export interface UiRefs {
  modeSegmented: HTMLElement;
  modeDescription: HTMLElement;
  equalField: HTMLElement;
  equalSegmented: HTMLElement;
  durationSegmented: HTMLElement;
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
      <div class="app-header">
        <h1>Iki Bowl</h1>
        <p class="subtitle">Quiet breathing sessions for iPhone lock-screen use.</p>
      </div>
      <section id="homeSection" class="card screen-card">
        <div class="field">
          <p class="label">Breathing mode</p>
          <p id="modeDescription" class="mode-description"></p>
          <div class="segmented" id="modeSegmented" role="group" aria-label="Breathing mode">
            <span class="segmented-thumb" aria-hidden="true"></span>
            <button class="segment" data-value="0">Box<br />(4-4-4-4)</button>
            <button class="segment" data-value="1">Buteyko<br />(N-N)</button>
            <button class="segment" data-value="2">Dr. Weil<br />(4-7-8)</button>
          </div>
        </div>

        <div class="field">
          <p class="label">Session duration</p>
          <div class="segmented" id="durationSegmented" role="group" aria-label="Session duration">
            <span class="segmented-thumb" aria-hidden="true"></span>
            <button class="segment" data-value="0">5 min</button>
            <button class="segment" data-value="1">10 min</button>
            <button class="segment" data-value="2">20 min</button>
          </div>
        </div>

        <div id="equalField" class="field">
          <p class="label">Buteyko rhythm</p>
          <div class="segmented" id="equalSegmented" role="group" aria-label="Buteyko rhythm">
            <span class="segmented-thumb" aria-hidden="true"></span>
            <button class="segment" data-value="4">4–4</button>
            <button class="segment" data-value="5">5–5</button>
            <button class="segment" data-value="6">6–6</button>
            <button class="segment" data-value="7">7–7</button>
          </div>
        </div>

        <button id="startButton" disabled>
          <span class="btn-main">Begin</span>
          <span id="preloadStatus" class="btn-status">Preparing selected session...</span>
        </button>
      </section>

      <section id="sessionSection" class="card screen-card session-screen hidden">
        <div class="session-center">
          <div id="breathCircle" class="breath-circle phase-begin">
            <p id="phaseLabel" class="phase-label">Begin</p>
          </div>
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
    modeSegmented: query<HTMLElement>(root, '#modeSegmented'),
    modeDescription: query<HTMLElement>(root, '#modeDescription'),
    equalField: query<HTMLElement>(root, '#equalField'),
    equalSegmented: query<HTMLElement>(root, '#equalSegmented'),
    durationSegmented: query<HTMLElement>(root, '#durationSegmented'),
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

import { createGame } from "./game.js";
import { createInput } from "./input.js";
import { render } from "./render.js";
import { DEFAULT_PARAMETERS } from "./config.js";

const OPTIONS_KEY = "vineguard.options";
const CONTROL_ACTIONS = ["left", "right", "jump", "down"];
const SCORE_TABS = ["overall", "1", "2", "3", "4"];
const PARAMETER_LABELS = {
  stolenLimit: "Stolen limit",
  startingGrapes: "Starting grapes",
  maxGrapes: "Max grapes",
  maxFoxes: "Max foxes",
  grapeStartInterval: "Grape start sec",
  grapeMinInterval: "Grape min sec",
  grapeIntervalRampPerMinute: "Grape ramp/min",
  foxStartInterval: "Fox start sec",
  foxMinInterval: "Fox min sec",
  foxIntervalRampPerMinute: "Fox ramp/min",
  juicePerPumpMl: "Juice per pump ml",
  juicePerGrapeMl: "Juice per grape ml",
  foxSpeedStart: "Fox speed start",
  foxSpeedRampPerMinute: "Fox speed ramp/min",
};

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
context.imageSmoothingEnabled = false;

const options = loadOptions();
const input = createInput(options.controls);
const game = createGame(input, options);
let lastTime = performance.now();

setupOptions(input, game, options);
setupTitleActions(game);
setupHighScoreEntry(game);
setupGameOverActions(game);
setupScoreTabs(game);

function frame(now) {
  const delta = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  game.update(delta);
  render(context, game.state);
  syncOverlays(game);
  requestAnimationFrame(frame);
}

window.__vineguard = game;
requestAnimationFrame(frame);

function loadOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPTIONS_KEY) || "null");
    return {
      controls: Array.isArray(saved?.controls) ? saved.controls : null,
      parameters: saved?.parameters && typeof saved.parameters === "object" ? saved.parameters : null,
    };
  } catch {
    return { controls: null, parameters: null };
  }
}

function saveOptions(input, parameters = game.state.parameters) {
  try {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify({
      controls: input.getControlSets(),
      parameters,
    }));
  } catch {
    // The game remains playable if option persistence is unavailable.
  }
}

function setupOptions(input, game, options) {
  const toggle = document.querySelector("#options-toggle");
  const panel = document.querySelector("#options-panel");
  const closeButton = document.querySelector("#options-close");
  const resetControls = document.querySelector("#reset-controls");
  const controlsGrid = document.querySelector("#controls-grid");
  const parametersGrid = document.querySelector("#parameters-grid");
  const resetParameters = document.querySelector("#reset-parameters");
  const resetHighScores = document.querySelector("#reset-high-scores");
  let waiting = null;

  if (!toggle || !panel || !closeButton || !resetControls || !controlsGrid || !parametersGrid || !resetParameters || !resetHighScores) {
    return;
  }

  renderControlButtons();
  renderParameterInputs();

  toggle.addEventListener("click", () => {
    setPanelOpen(panel.hidden);
  });

  closeButton.addEventListener("click", () => {
    setPanelOpen(false);
  });

  resetControls.addEventListener("click", () => {
    input.resetControls();
    waiting = null;
    renderControlButtons();
    saveOptions(input);
  });

  resetParameters.addEventListener("click", () => {
    game.debug.resetParameters();
    renderParameterInputs();
    saveOptions(input);
  });

  resetHighScores.addEventListener("click", () => {
    game.debug.resetHighScores();
  });

  document.addEventListener("keydown", (event) => {
    if (!waiting) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    input.setControl(waiting.controlIndex, waiting.action, event.code);
    waiting = null;
    renderControlButtons();
    saveOptions(input);
  }, true);

  function setPanelOpen(isOpen) {
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  function renderControlButtons() {
    const controls = input.getControlSets();
    controlsGrid.replaceChildren();

    for (let controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
      const row = document.createElement("div");
      row.className = "control-row";

      const label = document.createElement("strong");
      label.textContent = `P${controlIndex + 1}`;
      row.append(label);

      for (const action of CONTROL_ACTIONS) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "control-bind";
        button.textContent = waiting?.controlIndex === controlIndex && waiting.action === action
          ? "Press key"
          : `${actionName(action)} ${keyName(controls[controlIndex][action])}`;
        button.addEventListener("click", () => {
          waiting = { controlIndex, action };
          renderControlButtons();
        });
        row.append(button);
      }

      controlsGrid.append(row);
    }
  }

  function renderParameterInputs() {
    parametersGrid.replaceChildren();

    for (const key of Object.keys(DEFAULT_PARAMETERS)) {
      const label = document.createElement("label");
      label.className = "parameter-row";

      const span = document.createElement("span");
      span.textContent = PARAMETER_LABELS[key] || key;

      const inputElement = document.createElement("input");
      inputElement.type = "number";
      inputElement.step = key.includes("Interval") || key.includes("Ramp") ? "0.05" : "1";
      inputElement.value = String(game.state.parameters[key]);
      inputElement.addEventListener("change", () => {
        game.debug.setParameters({
          ...game.state.parameters,
          [key]: Number(inputElement.value),
        });
        renderParameterInputs();
        saveOptions(input);
      });

      label.append(span, inputElement);
      parametersGrid.append(label);
    }
  }
}

function setupTitleActions(game) {
  const startRun = document.querySelector("#start-run");
  if (!startRun) {
    return;
  }

  startRun.addEventListener("click", () => {
    game.debug.startRun();
  });
}

function setupHighScoreEntry(game) {
  const panel = document.querySelector("#high-score-panel");
  const nameInput = document.querySelector("#high-score-name");
  if (!panel || !nameInput) {
    return;
  }

  nameInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });

  nameInput.addEventListener("keyup", (event) => {
    event.stopPropagation();
  });

  panel.addEventListener("submit", (event) => {
    event.preventDefault();
    game.debug.submitHighScore(nameInput.value);
  });
}

function setupGameOverActions(game) {
  const continueButton = document.querySelector("#continue-title");
  if (!continueButton) {
    return;
  }

  continueButton.addEventListener("click", () => {
    game.debug.continueToTitle();
  });
}

function setupScoreTabs(game) {
  canvas.addEventListener("click", (event) => {
    if (game.state.screen !== "title") {
      return;
    }

    const point = canvasPoint(event);
    const tab = scoreTabAtPoint(point.x, point.y);
    if (tab) {
      game.debug.setHighScoreTab(tab);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (game.state.screen !== "title") {
      return;
    }

    const tab = scoreTabForKey(event.code);
    if (!tab) {
      return;
    }

    event.preventDefault();
    game.debug.setHighScoreTab(tab);
  });
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function scoreTabAtPoint(x, y) {
  if (y < 296 || y > 314) {
    return null;
  }

  for (let index = 0; index < SCORE_TABS.length; index += 1) {
    const tabX = 476 + index * 42;
    if (x >= tabX && x <= tabX + 38) {
      return SCORE_TABS[index];
    }
  }

  return null;
}

function syncOverlays(game) {
  const titleActions = document.querySelector("#title-actions");
  const startRun = document.querySelector("#start-run");
  const highScorePanel = document.querySelector("#high-score-panel");
  const highScoreName = document.querySelector("#high-score-name");
  const gameOverActions = document.querySelector("#game-over-actions");

  if (titleActions && startRun) {
    const onTitle = game.state.screen === "title";
    titleActions.hidden = !onTitle;
    startRun.disabled = game.state.players.length === 0;
    startRun.textContent = game.state.players.length === 0
      ? "Start Run"
      : `Start Run w/ ${game.state.players.length} Player${game.state.players.length === 1 ? "" : "s"}`;
  }

  if (highScorePanel && highScoreName) {
    const shouldShow = game.state.screen === "gameOver" && Boolean(game.state.pendingHighScore);
    if (highScorePanel.hidden && shouldShow) {
      highScoreName.value = game.state.pendingHighScore.name;
      highScoreName.focus();
      highScoreName.select();
    }
    highScorePanel.hidden = !shouldShow;
  }

  if (gameOverActions) {
    gameOverActions.hidden = game.state.screen !== "gameOver" || Boolean(game.state.pendingHighScore);
  }
}

function scoreTabForKey(code) {
  const digit = code.startsWith("Digit") ? code.slice(5) : null;
  if (digit && SCORE_TABS.includes(digit)) {
    return digit;
  }

  if (code === "KeyO") {
    return "overall";
  }

  return null;
}

function actionName(action) {
  return action === "jump" ? "Jump" : action[0].toUpperCase();
}

function keyName(code) {
  if (code.startsWith("Key")) {
    return code.slice(3);
  }

  const labels = {
    ArrowLeft: "Left",
    ArrowRight: "Right",
    ArrowUp: "Up",
    ArrowDown: "Down",
    Semicolon: ";",
    Quote: "'",
    Space: "Space",
  };

  return labels[code] || code.replace("Digit", "");
}
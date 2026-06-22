import { createGame } from "./game.js";
import { createInput } from "./input.js";
import { render } from "./render.js";

const OPTIONS_KEY = "vineguard.options";
const CONTROL_ACTIONS = ["left", "right", "jump", "down"];

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
context.imageSmoothingEnabled = false;

const options = loadOptions();
const input = createInput(options.controls);
const game = createGame(input, options);
let lastTime = performance.now();

setupOptions(input, game, options);

function frame(now) {
  const delta = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  game.update(delta);
  render(context, game.state);
  requestAnimationFrame(frame);
}

window.__vineguard = game;
requestAnimationFrame(frame);

function loadOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPTIONS_KEY) || "null");
    return {
      skipTutorial: Boolean(saved?.skipTutorial),
      controls: Array.isArray(saved?.controls) ? saved.controls : null,
    };
  } catch {
    return { skipTutorial: false, controls: null };
  }
}

function saveOptions(input, skipTutorial) {
  try {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify({
      skipTutorial,
      controls: input.getControlSets(),
    }));
  } catch {
    // The game remains playable if option persistence is unavailable.
  }
}

function setupOptions(input, game, options) {
  const toggle = document.querySelector("#options-toggle");
  const panel = document.querySelector("#options-panel");
  const skipTutorial = document.querySelector("#skip-tutorial");
  const resetControls = document.querySelector("#reset-controls");
  const controlsGrid = document.querySelector("#controls-grid");
  let waiting = null;

  if (!toggle || !panel || !skipTutorial || !resetControls || !controlsGrid) {
    return;
  }

  skipTutorial.checked = Boolean(options.skipTutorial);
  renderControlButtons();

  toggle.addEventListener("click", () => {
    const isOpen = panel.hidden;
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  skipTutorial.addEventListener("change", () => {
    game.debug.setSkipTutorial(skipTutorial.checked);
    saveOptions(input, skipTutorial.checked);
  });

  resetControls.addEventListener("click", () => {
    input.resetControls();
    waiting = null;
    renderControlButtons();
    saveOptions(input, skipTutorial.checked);
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
    saveOptions(input, skipTutorial.checked);
  }, true);

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
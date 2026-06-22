import { CONTROL_SETS } from "./config.js";

const CONTROL_ACTIONS = ["left", "right", "jump", "down"];

export function createInput(savedControls = null) {
  let controlSets = normalizeControlSets(savedControls);
  const down = new Set();
  const pressed = new Set();
  const joinedControlSets = new Set();
  const joinQueue = [];

  function findControlSet(code) {
    return controlSets.findIndex((controls) => CONTROL_ACTIONS.some((action) => controls[action] === code));
  }

  window.addEventListener("keydown", (event) => {
    const controlIndex = findControlSet(event.code);

    if (controlIndex !== -1) {
      event.preventDefault();

      if (!joinedControlSets.has(controlIndex)) {
        joinedControlSets.add(controlIndex);
        joinQueue.push(controlIndex);
      }
    }

    if (!down.has(event.code)) {
      pressed.add(event.code);
    }

    down.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    down.delete(event.code);
  });

  return {
    isDown(code) {
      return down.has(code);
    },
    wasPressed(code) {
      return pressed.has(code);
    },
    consumeJoins() {
      return joinQueue.splice(0, joinQueue.length);
    },
    clearPressed() {
      pressed.clear();
    },
    getControlSet(index) {
      return controlSets[index];
    },
    getControlSets() {
      return cloneControlSets(controlSets);
    },
    setControl(controlIndex, action, code) {
      if (!controlSets[controlIndex] || !CONTROL_ACTIONS.includes(action)) {
        return false;
      }

      controlSets[controlIndex] = {
        ...controlSets[controlIndex],
        [action]: code,
      };
      down.delete(code);
      pressed.delete(code);
      return true;
    },
    resetControls() {
      controlSets = cloneControlSets(CONTROL_SETS);
      down.clear();
      pressed.clear();
      return cloneControlSets(controlSets);
    },
  };
}

function normalizeControlSets(savedControls) {
  if (!Array.isArray(savedControls)) {
    return cloneControlSets(CONTROL_SETS);
  }

  return CONTROL_SETS.map((defaults, index) => {
    const saved = savedControls[index] || {};
    return {
      name: defaults.name,
      left: typeof saved.left === "string" ? saved.left : defaults.left,
      right: typeof saved.right === "string" ? saved.right : defaults.right,
      jump: typeof saved.jump === "string" ? saved.jump : defaults.jump,
      down: typeof saved.down === "string" ? saved.down : defaults.down,
    };
  });
}

function cloneControlSets(controlSets) {
  return controlSets.map((controls) => ({ ...controls }));
}
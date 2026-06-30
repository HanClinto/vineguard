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
    if (isTypingTarget(event.target) || isTypingTarget(document.activeElement)) {
      return;
    }

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
    if (isTypingTarget(event.target) || isTypingTarget(document.activeElement)) {
      return;
    }

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

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function normalizeControlSets(savedControls) {
  if (!Array.isArray(savedControls)) {
    return cloneControlSets(CONTROL_SETS);
  }

  return CONTROL_SETS.map((defaults, index) => {
    const saved = savedControls[index] || {};
    const migrated = index === 3
      && saved.left === "KeyP"
      && saved.right === "Semicolon"
      && saved.jump === "Quote"
      && saved.down === "KeyL"
        ? {}
        : saved;
    return {
      name: defaults.name,
      left: typeof migrated.left === "string" ? migrated.left : defaults.left,
      right: typeof migrated.right === "string" ? migrated.right : defaults.right,
      jump: typeof migrated.jump === "string" ? migrated.jump : defaults.jump,
      down: typeof migrated.down === "string" ? migrated.down : defaults.down,
    };
  });
}

function cloneControlSets(controlSets) {
  return controlSets.map((controls) => ({ ...controls }));
}
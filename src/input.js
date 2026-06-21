import { CONTROL_SETS } from "./config.js";

export function createInput() {
  const down = new Set();
  const pressed = new Set();
  const joinedControlSets = new Set();
  const joinQueue = [];

  function findControlSet(code) {
    return CONTROL_SETS.findIndex((controls) => Object.values(controls).includes(code));
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
  };
}
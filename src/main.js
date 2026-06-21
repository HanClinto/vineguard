import { createGame } from "./game.js";
import { createInput } from "./input.js";
import { render } from "./render.js";

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
context.imageSmoothingEnabled = false;

const input = createInput();
const game = createGame(input);
let lastTime = performance.now();

function frame(now) {
  const delta = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  game.update(delta);
  render(context, game.state);
  requestAnimationFrame(frame);
}

window.__vineguard = game;
requestAnimationFrame(frame);
export const WORLD = {
  width: 960,
  height: 540,
  floorY: 492,
  gravity: 1900,
};

export const PLAYER_COLORS = ["#e64b4b", "#4f8cff", "#f2c84b", "#58c878"];

export const CONTROL_SETS = [
  {
    name: "Arrows",
    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
    down: "ArrowDown",
  },
  {
    name: "WASD",
    left: "KeyA",
    right: "KeyD",
    jump: "KeyW",
    down: "KeyS",
  },
  {
    name: "YGHJ",
    left: "KeyG",
    right: "KeyJ",
    jump: "KeyY",
    down: "KeyH",
  },
  {
    name: "PL;'",
    left: "KeyP",
    right: "Semicolon",
    jump: "Quote",
    down: "KeyL",
  },
];

export const PLATFORMS = [
  { x: 0, y: WORLD.floorY, width: WORLD.width, height: 48 },
  { x: 80, y: 390, width: 190, height: 18 },
  { x: 690, y: 390, width: 190, height: 18 },
  { x: 330, y: 322, width: 300, height: 18 },
  { x: 120, y: 240, width: 160, height: 18 },
  { x: 680, y: 240, width: 160, height: 18 },
];

export const GRAPE_SITES = [
  { x: 130, y: 358 },
  { x: 230, y: 358 },
  { x: 725, y: 358 },
  { x: 825, y: 358 },
  { x: 390, y: 290 },
  { x: 570, y: 290 },
  { x: 170, y: 208 },
  { x: 780, y: 208 },
];

export const PRESS = {
  vat: { x: 448, y: 406, width: 64, height: 56 },
  leftPump: { x: 340, baseY: 438, width: 82, height: 16 },
  rightPump: { x: 538, baseY: 438, width: 82, height: 16 },
  requiredStrokes: 8,
};
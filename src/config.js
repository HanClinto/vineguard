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
    left: "KeyL",
    right: "Quote",
    jump: "KeyP",
    down: "Semicolon",
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

export const VERSES = [
  {
    text: "Catch the foxes for us, the little foxes that spoil the vineyards, for our vineyards are in blossom.",
    reference: "Song of Solomon 2:15",
  },
  {
    text: "A sower went out to sow. And as he sowed, some seeds fell along the path, and the birds came and devoured them.",
    reference: "Matthew 13:3-4",
  },
  {
    text: "And they went out into the field and gathered the grapes from their vineyards and trod them and held a festival...",
    reference: "Judges 9:27a",
  },
  {
    text: "Let us go out early to the vineyards and see whether the vines have budded, whether the grape blossoms have opened...",
    reference: "Song of Solomon 7:12",
  },
  {
    text: "They shall build houses and inhabit them; they shall plant vineyards and eat their fruit.",
    reference: "Isaiah 65:21",
  },
];

export const DEFAULT_PARAMETERS = {
  stolenLimit: 4,
  startingGrapes: 1,
  maxGrapes: 18,
  maxFoxes: 9,
  grapeStartInterval: 6.5,
  grapeMinInterval: 1.25,
  grapeIntervalRampPerMinute: 1.8,
  foxStartInterval: 8.5,
  foxMinInterval: 1.45,
  foxIntervalRampPerMinute: 3.0,
  juicePerPumpMl: 100,
  juicePerGrapeMl: 800,
  foxSpeedStart: 100,
  foxSpeedRampPerMinute: 16,
};

export const DEFAULT_HIGH_SCORES = [
  { name: "Daniel", scoreMl: 900, players: 1, seconds: 55, stolen: 10 },
  { name: "Jael", scoreMl: 800, players: 1, seconds: 50, stolen: 10 },
  { name: "Ruth", scoreMl: 700, players: 1, seconds: 45, stolen: 10 },
  { name: "David & Jonathan", scoreMl: 1600, players: 2, seconds: 70, stolen: 10 },
  { name: "Boanerges", scoreMl: 1500, players: 2, seconds: 68, stolen: 10 },
  { name: "Paul & Barnabas", scoreMl: 1400, players: 2, seconds: 65, stolen: 10 },
  { name: "Shadrach & Meshach & Abednego", scoreMl: 2100, players: 3, seconds: 85, stolen: 10 },
  { name: "Josheb & Eleazar & Shammah", scoreMl: 1950, players: 3, seconds: 82, stolen: 10 },
  { name: "Caspar & Melchior & Balthasar", scoreMl: 1800, players: 3, seconds: 78, stolen: 10 },
  { name: "Matthew & Mark & Luke & John", scoreMl: 2600, players: 4, seconds: 95, stolen: 10 },
  { name: "Job & Eliphaz & Bildad & Zophar", scoreMl: 2450, players: 4, seconds: 92, stolen: 10 },
  { name: "Samarian Lepers", scoreMl: 2300, players: 4, seconds: 88, stolen: 10 },
];

export const GRAPE_SPAWN = {
  marginX: 86,
  minY: 168,
  maxY: 426,
  pressMarginX: 170,
  pressMarginY: 104,
};

export const PRESS = {
  vat: { x: 448, y: 406, width: 64, height: 56 },
  leftPump: { x: 340, baseY: 438, width: 82, height: 16 },
  rightPump: { x: 538, baseY: 438, width: 82, height: 16 },
  requiredStrokes: 8,
};
import { CONTROL_SETS, GRAPE_SITES, PLATFORMS, PLAYER_COLORS, PRESS, WORLD } from "./config.js";

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 34;
const FOX_WIDTH = 34;
const FOX_HEIGHT = 18;
const GRAPE_STAGGER_SECONDS = 1.55;
const BEST_RUN_KEY = "vineguard.bestRun";

export function createGame(input, options = {}) {
  const state = {
    screen: "title",
    phase: 1,
    juice: 0,
    juiceGoal: 3,
    message: "Press any listed control to join",
    players: [],
    grapes: GRAPE_SITES.map(createGrape),
    foxes: [],
    particles: [],
    winepress: {
      loaded: null,
      strokes: 0,
      leftOffset: 0,
      rightOffset: 0,
      lastPumpSide: null,
      highlightVat: false,
      highlightPumps: false,
    },
    foxSpawnTimer: 4,
    roundOverTimer: 0,
    tutorial: createTutorialState(),
    transition: null,
    options: {
      skipTutorial: Boolean(options.skipTutorial),
    },
    run: createRunState(),
    bestRun: loadBestRun(),
    controls: input.getControlSets(),
  };

  function update(delta) {
    state.controls = input.getControlSets();

    for (const controlIndex of input.consumeJoins()) {
      joinPlayer(controlIndex);
    }

    if (state.players.length > 0 && state.screen === "title") {
      startRound();
    }

    if (state.screen === "roundWon") {
      state.roundOverTimer -= delta;
      if (state.roundOverTimer <= 0) {
        state.phase += 1;
        startRound();
      }
      updateParticles(delta);
      input.clearPressed();
      return;
    }

    if (state.screen === "gameOver") {
      if (input.wasPressed("KeyR")) {
        state.phase = 1;
        state.run = createRunState();
        startRound();
      }
      updateParticles(delta);
      input.clearPressed();
      return;
    }

    if (state.screen !== "playing") {
      input.clearPressed();
      return;
    }

    updatePlayers(delta);
    updateGrapes(delta);
    updateFoxes(delta);
    updateParticles(delta);
    checkRoundState();
    input.clearPressed();
  }

  function joinPlayer(controlIndex) {
    if (state.players.some((player) => player.controlIndex === controlIndex)) {
      return;
    }

    if (state.players.length >= PLAYER_COLORS.length) {
      return;
    }

    const playerNumber = state.players.length;
    const controls = controlFor(controlIndex);
    state.players.push({
      id: playerNumber + 1,
      controlIndex,
      controlName: controls.name,
      x: 420 + playerNumber * 34,
      y: WORLD.floorY - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      color: PLAYER_COLORS[playerNumber],
      facing: 1,
      animationTime: 0,
      onGround: false,
      groundPlatform: null,
      dropTimer: 0,
      wasAirborne: true,
      carrying: null,
      stats: {
        delivered: 0,
        foxesScared: 0,
        pumpStrokes: 0,
      },
    });
    state.run.playerCount = Math.max(state.run.playerCount, state.players.length);
  }

  function startRound() {
    state.screen = "playing";
    state.juice = 0;
    state.message = isTutorialRound() ? "Tutorial" : `Phase ${state.phase}`;
    state.transition = null;
    state.tutorial = createTutorialState();
    state.tutorial.active = isTutorialRound();
    state.grapes = isTutorialRound()
      ? [createGrape(GRAPE_SITES[2], 0)]
      : GRAPE_SITES.slice(0, grapeCountForPhase(state.phase)).map(createGrape);
    state.foxes = [];
    state.particles = [];
    state.foxSpawnTimer = isTutorialRound() ? 999 : foxDelayForPhase(state.phase);
    state.juiceGoal = goalForPhase(state.phase);
    state.winepress.loaded = null;
    state.winepress.strokes = 0;
    state.winepress.leftOffset = 0;
    state.winepress.rightOffset = 0;
    state.winepress.lastPumpSide = null;

    for (const player of state.players) {
      player.carrying = null;
      player.x = 420 + (player.id - 1) * 34;
      player.y = WORLD.floorY - PLAYER_HEIGHT;
      player.vx = 0;
      player.vy = 0;
      player.facing = 1;
      player.animationTime = 0;
      player.onGround = false;
      player.groundPlatform = null;
      player.dropTimer = 0;
    }
  }

  function createGrape(site, index) {
    return {
      id: index + 1,
      x: site.x,
      y: site.y,
      stage: "blossom",
      growth: -index * GRAPE_STAGGER_SECONDS,
      stolenBy: null,
      onGround: false,
      gone: false,
      sparkle: 0,
    };
  }

  function createTutorialState() {
    return {
      active: false,
      moved: false,
      touchedGrapeEarly: false,
      scaredFox: false,
      scarePraiseTimer: 0,
      harvested: false,
      deposited: false,
      pumped: false,
      foxSpawned: false,
      text: "Press any listed controls to join.",
    };
  }

  function isTutorialRound() {
    return isTutorialPhase(state.phase);
  }

  function updatePlayers(delta) {
    state.winepress.highlightVat = false;
    state.winepress.highlightPumps = state.winepress.loaded !== null;
    updateTutorialTimers(delta);

    for (const player of state.players) {
      const controls = controlFor(player.controlIndex);
      const move = Number(input.isDown(controls.right)) - Number(input.isDown(controls.left));
      player.vx = move * 220;
      player.animationTime += delta;

      if (move !== 0) {
        player.facing = move;
        if (state.tutorial.active) {
          state.tutorial.moved = true;
        }
      }

      if (player.dropTimer > 0) {
        player.dropTimer = Math.max(0, player.dropTimer - delta);
      }

      if (input.wasPressed(controls.down) && player.onGround && isDropThroughPlatform(player.groundPlatform)) {
        player.dropTimer = 0.22;
        player.onGround = false;
        player.groundPlatform = null;
        player.wasAirborne = true;
        player.y += 5;
      }

      if (input.wasPressed(controls.jump) && player.onGround) {
        player.vy = -650;
        player.onGround = false;
        player.wasAirborne = true;
        if (state.tutorial.active) {
          state.tutorial.moved = true;
        }
      }

      const previousY = player.y;
      player.vy += WORLD.gravity * delta;
      player.x += player.vx * delta;
      player.y += player.vy * delta;
      player.x = clamp(player.x, 8, WORLD.width - player.width - 8);

      resolvePlatformCollisions(player, previousY);
      recoverPlayerIfOutOfBounds(player);
      tryHarvestOrDeposit(player);
      scareFoxes(player);
    }
  }

  function updateTutorialTimers(delta) {
    if (!state.tutorial.active) {
      return;
    }

    state.tutorial.scarePraiseTimer = Math.max(0, state.tutorial.scarePraiseTimer - delta);
  }

  function resolvePlatformCollisions(player, previousY) {
    player.onGround = false;
    player.groundPlatform = null;

    for (const platform of getAllPlatforms()) {
      if (player.dropTimer > 0 && isDropThroughPlatform(platform)) {
        continue;
      }

      const previousBottom = previousY + player.height;
      const bottom = player.y + player.height;
      const overlapsX = player.x + player.width > platform.x && player.x < platform.x + platform.width;

      if (player.vy >= 0 && overlapsX && previousBottom <= platform.y && bottom >= platform.y) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.onGround = true;
        player.groundPlatform = platform;

        if (platform.pump && player.wasAirborne) {
          pump(platform.side, player);
        }
      }
    }

    if (player.onGround) {
      player.wasAirborne = false;
    } else if (Math.abs(player.vy) > 20) {
      player.wasAirborne = true;
    }
  }

  function recoverPlayerIfOutOfBounds(player) {
    if (player.y < WORLD.height + 120) {
      return;
    }

    player.y = WORLD.floorY - player.height;
    player.vy = 0;
    player.onGround = true;
    player.groundPlatform = PLATFORMS[0];
  }

  function getAllPlatforms() {
    return [
      ...PLATFORMS,
      pumpPlatform("left"),
      pumpPlatform("right"),
    ];
  }

  function pumpPlatform(side) {
    const source = side === "left" ? PRESS.leftPump : PRESS.rightPump;
    const offset = side === "left" ? state.winepress.leftOffset : state.winepress.rightOffset;
    return {
      x: source.x,
      y: source.baseY + offset,
      width: source.width,
      height: source.height,
      pump: true,
      side,
    };
  }

  function isDropThroughPlatform(platform) {
    return Boolean(platform) && platform.y < WORLD.floorY;
  }

  function pump(side, player) {
    if (!state.winepress.loaded) {
      return;
    }

    if (state.winepress.lastPumpSide === side) {
      return;
    }

    if (side === "left") {
      state.winepress.leftOffset = 34;
      state.winepress.rightOffset = -24;
    } else {
      state.winepress.rightOffset = 34;
      state.winepress.leftOffset = -24;
    }

    state.winepress.lastPumpSide = side;
    state.winepress.strokes += 1;
    player.stats.pumpStrokes += 1;
    if (state.tutorial.active) {
      state.tutorial.pumped = true;
    }
    burst(PRESS.vat.x + PRESS.vat.width / 2, PRESS.vat.y, "#c43b74", 8);

    if (state.winepress.strokes >= PRESS.requiredStrokes) {
      state.juice += 1;
      state.run.totalJuice += 1;
      state.winepress.loaded = null;
      state.winepress.strokes = 0;
      burst(PRESS.vat.x + PRESS.vat.width / 2, PRESS.vat.y - 8, "#7a2e70", 18);
    }
  }

  function tryHarvestOrDeposit(player) {
    if (player.carrying) {
      if (state.winepress.loaded === null && overlaps(player, PRESS.vat)) {
        state.winepress.loaded = player.carrying;
        state.winepress.strokes = 0;
        player.carrying = null;
        player.stats.delivered += 1;
        if (state.tutorial.active) {
          state.tutorial.deposited = true;
        }
        burst(PRESS.vat.x + PRESS.vat.width / 2, PRESS.vat.y, "#8f3fa2", 12);
      } else if (state.winepress.loaded === null) {
        state.winepress.highlightVat = true;
      }
      return;
    }

    for (const grape of state.grapes) {
      if (state.tutorial.active && grape.stage !== "ripe" && !grape.gone && grape.stolenBy === null && distance(player, grape) < 34) {
        state.tutorial.touchedGrapeEarly = true;
      }

      if (grape.stage === "ripe" && !grape.gone && grape.stolenBy === null && distance(player, grape) < 34) {
        player.carrying = grape;
        grape.gone = true;
        grape.onGround = false;
        if (state.tutorial.active) {
          state.tutorial.harvested = true;
        }
        burst(grape.x, grape.y, "#c463c7", 10);
        return;
      }
    }
  }

  function updateGrapes(delta) {
    for (const grape of state.grapes) {
      if (grape.gone || grape.stolenBy !== null || grape.onGround) {
        continue;
      }

      grape.growth += delta;
      grape.sparkle += delta;

      const previousStage = grape.stage;
      if (grape.growth > 8) {
        grape.stage = "ripe";
      } else if (grape.growth > 3.5) {
        grape.stage = "unripe";
      }

      if (previousStage !== "ripe" && grape.stage === "ripe") {
        burst(grape.x, grape.y - 8, "#f7e06e", 16);
      }
    }
  }

  function updateFoxes(delta) {
    if (state.tutorial.active) {
      updateTutorialFox();
    } else {
      state.foxSpawnTimer -= delta;
      if (state.foxSpawnTimer <= 0) {
        spawnFox();
        state.foxSpawnTimer = Math.max(1.1, foxDelayForPhase(state.phase) - 0.2 + Math.random() * 1.2);
      }
    }

    for (const fox of state.foxes) {
      fox.animationTime += delta;

      if (fox.state === "fleeing") {
        fox.x += fox.escapeDirection * fox.speed * 1.35 * delta;
        fox.facing = fox.escapeDirection;
      } else if (fox.carrying) {
        fox.x += fox.escapeDirection * fox.speed * delta;
        fox.facing = fox.escapeDirection;
        fox.carrying.x = fox.x + FOX_WIDTH / 2;
        fox.carrying.y = fox.y - 8;
      } else if (fox.target) {
        if (!canFoxSteal(fox.target)) {
          retargetOrFlee(fox);
          continue;
        }

        const direction = Math.sign(fox.target.x - centerX(fox)) || 1;
        fox.x += direction * fox.speed * delta;
        fox.facing = direction;

        if (foxCanReachGrape(fox, fox.target) && canFoxSteal(fox.target)) {
          fox.carrying = fox.target;
          fox.target.stolenBy = fox;
          fox.target.onGround = false;
          fox.escapeDirection = fox.x < WORLD.width / 2 ? -1 : 1;
          burst(fox.target.x, fox.target.y, "#d46a43", 8);
        }
      }
    }

    for (const fox of state.foxes) {
      if (fox.carrying && (fox.x < -60 || fox.x > WORLD.width + 60)) {
        fox.carrying.gone = true;
        fox.carrying.stolenBy = null;
      }
    }

    state.foxes = state.foxes.filter((fox) => fox.x > -90 && fox.x < WORLD.width + 90);
  }

  function updateTutorialFox() {
    const grape = state.grapes[0];
    if (!state.tutorial.foxSpawned && grape && grape.stage === "unripe" && canFoxSteal(grape)) {
      spawnFox(grape, true);
      state.tutorial.foxSpawned = true;
    }
  }

  function spawnFox(preferredTarget = null, forcedFromLeft = null) {
    const candidates = preferredTarget && canFoxSteal(preferredTarget)
      ? [preferredTarget]
      : state.grapes.filter((grape) => canFoxSteal(grape));
    if (candidates.length === 0) {
      return;
    }

    const fromLeft = forcedFromLeft ?? Math.random() < 0.5;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    state.foxes.push({
      x: fromLeft ? -FOX_WIDTH : WORLD.width + FOX_WIDTH,
      y: foxLaneY(target),
      width: FOX_WIDTH,
      height: FOX_HEIGHT,
      target,
      carrying: null,
      escapeDirection: fromLeft ? -1 : 1,
      speed: 95 + state.phase * 12,
      state: "seeking",
      facing: fromLeft ? 1 : -1,
      animationTime: 0,
    });
  }

  function retargetOrFlee(fox) {
    const candidates = state.grapes.filter((grape) => canFoxSteal(grape));
    if (candidates.length > 0) {
      fox.target = closestGrape(fox, candidates);
      fox.y = foxLaneY(fox.target);
      return;
    }

    fox.target = null;
    fox.state = "fleeing";
    fox.escapeDirection = centerX(fox) < WORLD.width / 2 ? -1 : 1;
  }

  function closestGrape(fox, grapes) {
    let closest = grapes[0];
    let closestDistance = distance(fox, closest);
    for (const grape of grapes.slice(1)) {
      const grapeDistance = distance(fox, grape);
      if (grapeDistance < closestDistance) {
        closest = grape;
        closestDistance = grapeDistance;
      }
    }
    return closest;
  }

  function canFoxSteal(grape) {
    return !grape.gone && grape.stolenBy === null && (grape.stage === "unripe" || grape.stage === "ripe");
  }

  function foxCanReachGrape(fox, grape) {
    return Math.abs(centerX(fox) - grape.x) <= 24 && Math.abs(centerY(fox) - grape.y) <= 34;
  }

  function foxLaneY(grape) {
    return clamp(grape.y + 14, 110, WORLD.floorY - FOX_HEIGHT);
  }

  function scareFoxes(player) {
    for (const fox of state.foxes) {
      if (fox.state === "fleeing") {
        continue;
      }

      if (distance(player, fox) > 58) {
        continue;
      }

      if (fox.carrying) {
        const grape = fox.carrying;
        grape.stolenBy = null;
        grape.x = fox.x + FOX_WIDTH / 2;
        grape.y = fox.y - 4;

        if (grape.stage === "ripe") {
          grape.gone = false;
          grape.onGround = true;
        } else {
          grape.gone = true;
        }

        fox.carrying = null;
      }

      fox.state = "fleeing";
      fox.escapeDirection = fox.x < player.x ? -1 : 1;
      player.stats.foxesScared += 1;
      if (state.tutorial.active) {
        state.tutorial.scaredFox = true;
        state.tutorial.scarePraiseTimer = 2.4;
      }
      burst(fox.x + FOX_WIDTH / 2, fox.y, "#ffd166", 10);
    }
  }

  function updateTutorialText() {
    const controls = state.players[0] ? controlFor(state.players[0].controlIndex) : controlFor(1);
    const grape = state.grapes[0];

    if (state.players.length === 0) {
      state.tutorial.text = "Press any listed controls to join.";
    } else if (!state.tutorial.moved) {
      state.tutorial.text = `Move with ${keyLabel(controls.left)}/${keyLabel(controls.right)}. Jump with ${keyLabel(controls.jump)}.`;
    } else if (state.tutorial.touchedGrapeEarly && grape && grape.stage !== "ripe" && !state.tutorial.foxSpawned) {
      state.tutorial.text = "Those grapes need more time. Wait until they sparkle.";
    } else if (!state.tutorial.scaredFox && state.tutorial.foxSpawned && state.foxes.some((fox) => fox.state !== "fleeing")) {
      state.tutorial.text = "The grapes are ripening, but a fox is coming! Run close to scare it away.";
    } else if (state.tutorial.scarePraiseTimer > 0) {
      state.tutorial.text = "Good job! The fox ran away.";
    } else if (grape && grape.stage !== "ripe" && !state.tutorial.harvested) {
      state.tutorial.text = "Protect the blossom while it grows into ripe grapes.";
    } else if (!state.tutorial.harvested) {
      state.tutorial.text = "The grapes are ripe. Touch them to pick them up.";
    } else if (!state.tutorial.deposited) {
      state.tutorial.text = "Carry the grapes to the glowing winepress vat.";
    } else if (!state.tutorial.pumped) {
      state.tutorial.text = "Jump onto either pump platform to start pressing.";
    } else {
      state.tutorial.text = "Alternate left and right pump landings to fill the juice jar.";
    }
  }

  function keyLabel(code) {
    if (code.startsWith("Key")) {
      return code.slice(3);
    }

    return code.replace("Arrow", "");
  }

  function checkRoundState() {
    if (state.tutorial.active) {
      updateTutorialText();
    }

    if (state.juice >= state.juiceGoal) {
      state.screen = "roundWon";
      state.roundOverTimer = 4.2;
      state.run.bestPhase = Math.max(state.run.bestPhase, state.phase);
      saveBestRun(state.run);
      state.bestRun = loadBestRun();
      state.transition = createRoundTransition();
      state.message = state.transition.title;
      return;
    }

    const usefulGrapes = state.grapes.some((grape) => !grape.gone || grape.stolenBy !== null);
    const carriedGrapes = state.players.some((player) => player.carrying) || state.winepress.loaded;
    if (!usefulGrapes && !carriedGrapes) {
      state.screen = "gameOver";
      saveBestRun(state.run);
      state.bestRun = loadBestRun();
      state.transition = createGameOverTransition();
      state.message = state.transition.title;
    }
  }

  function createRoundTransition() {
    const nextPhase = state.phase + 1;
    return {
      title: `Phase ${state.phase} complete`,
      lines: [
        `Run juice: ${state.run.totalJuice}`,
        `Next: Phase ${nextPhase}`,
        `${grapeCountForPhase(nextPhase)} vines | Goal ${goalForPhase(nextPhase)}`,
        `Fox pace: ${foxPaceLabel(nextPhase)}`,
      ],
    };
  }

  function createGameOverTransition() {
    return {
      title: "Harvest ended",
      lines: [
        `Reached phase ${state.phase}`,
        `Run juice: ${state.run.totalJuice}`,
        `Best: phase ${state.bestRun.phase}, juice ${state.bestRun.juice}`,
        "Press R to restart",
      ],
    };
  }

  function isTutorialPhase(phase) {
    return phase === 1 && !state.options.skipTutorial;
  }

  function grapeCountForPhase(phase) {
    return isTutorialPhase(phase) ? 1 : Math.min(4 + phase, GRAPE_SITES.length);
  }

  function goalForPhase(phase) {
    return isTutorialPhase(phase) ? 1 : Math.min(3 + phase, 10);
  }

  function foxDelayForPhase(phase) {
    return Math.max(1.4, 4.2 - phase * 0.35);
  }

  function foxPaceLabel(phase) {
    if (phase >= 6) {
      return "wild";
    }

    if (phase >= 3) {
      return "quick";
    }

    return "steady";
  }

  function controlFor(controlIndex) {
    return input.getControlSet(controlIndex) || CONTROL_SETS[controlIndex];
  }

  function setSkipTutorial(skipTutorial) {
    state.options.skipTutorial = Boolean(skipTutorial);
  }

  function updateParticles(delta) {
    for (const particle of state.particles) {
      particle.life -= delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 320 * delta;
    }

    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function burst(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0.35 + Math.random() * 0.35,
        color,
      });
    }
  }

  return {
    state,
    update,
    debug: {
      joinPlayer,
      startRound,
      spawnFox,
      pump,
      canFoxSteal,
      setSkipTutorial,
      setGrapeStage(id, stage) {
        const grape = state.grapes.find((item) => item.id === id);
        if (grape) {
          grape.stage = stage;
          grape.growth = stage === "ripe" ? 9 : stage === "unripe" ? 4 : 0;
        }
      },
    },
  };
}

function createRunState() {
  return {
    totalJuice: 0,
    bestPhase: 0,
    playerCount: 0,
  };
}

function loadBestRun() {
  try {
    const saved = JSON.parse(localStorage.getItem(BEST_RUN_KEY) || "null");
    if (!saved || typeof saved !== "object") {
      return { phase: 0, juice: 0, players: 0 };
    }

    return {
      phase: Number(saved.phase) || 0,
      juice: Number(saved.juice) || 0,
      players: Number(saved.players) || 0,
    };
  } catch {
    return { phase: 0, juice: 0, players: 0 };
  }
}

function saveBestRun(run) {
  const current = loadBestRun();
  const candidate = {
    phase: run.bestPhase,
    juice: run.totalJuice,
    players: run.playerCount,
  };

  if (candidate.phase < current.phase || (candidate.phase === current.phase && candidate.juice <= current.juice)) {
    return;
  }

  try {
    localStorage.setItem(BEST_RUN_KEY, JSON.stringify(candidate));
  } catch {
    // The game remains playable if storage is unavailable.
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function distance(a, b) {
  return Math.hypot(centerX(a) - centerX(b), centerY(a) - centerY(b));
}

function centerX(entity) {
  return entity.x + (entity.width || 0) / 2;
}

function centerY(entity) {
  return entity.y + (entity.height || 0) / 2;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function approach(value, target, amount) {
  if (value < target) {
    return Math.min(target, value + amount);
  }
  return Math.max(target, value - amount);
}
import { CONTROL_SETS, GRAPE_SITES, PLATFORMS, PLAYER_COLORS, PRESS, WORLD } from "./config.js";

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 34;
const FOX_WIDTH = 34;
const FOX_HEIGHT = 18;
const GRAPE_STAGGER_SECONDS = 1.55;

export function createGame(input) {
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
  };

  function update(delta) {
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
        state.juiceGoal = Math.min(3 + state.phase, 10);
        startRound();
      }
      updateParticles(delta);
      input.clearPressed();
      return;
    }

    if (state.screen === "gameOver") {
      if (input.wasPressed("KeyR")) {
        state.phase = 1;
        state.juiceGoal = 3;
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

    const playerNumber = state.players.length;
    state.players.push({
      id: playerNumber + 1,
      controlIndex,
      controlName: CONTROL_SETS[controlIndex].name,
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
  }

  function startRound() {
    state.screen = "playing";
    state.juice = 0;
    state.message = `Phase ${state.phase}`;
    state.grapes = GRAPE_SITES.slice(0, Math.min(4 + state.phase, GRAPE_SITES.length)).map(createGrape);
    state.foxes = [];
    state.particles = [];
    state.foxSpawnTimer = Math.max(1.4, 4.2 - state.phase * 0.35);
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

  function updatePlayers(delta) {
    state.winepress.highlightVat = false;
    state.winepress.highlightPumps = state.winepress.loaded !== null;

    for (const player of state.players) {
      const controls = CONTROL_SETS[player.controlIndex];
      const move = Number(input.isDown(controls.right)) - Number(input.isDown(controls.left));
      player.vx = move * 220;
      player.animationTime += delta;

      if (move !== 0) {
        player.facing = move;
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
    burst(PRESS.vat.x + PRESS.vat.width / 2, PRESS.vat.y, "#c43b74", 8);

    if (state.winepress.strokes >= PRESS.requiredStrokes) {
      state.juice += 1;
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
        burst(PRESS.vat.x + PRESS.vat.width / 2, PRESS.vat.y, "#8f3fa2", 12);
      } else if (state.winepress.loaded === null) {
        state.winepress.highlightVat = true;
      }
      return;
    }

    for (const grape of state.grapes) {
      if (grape.stage === "ripe" && !grape.gone && grape.stolenBy === null && distance(player, grape) < 34) {
        player.carrying = grape;
        grape.gone = true;
        grape.onGround = false;
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
    state.foxSpawnTimer -= delta;
    if (state.foxSpawnTimer <= 0) {
      spawnFox();
      state.foxSpawnTimer = Math.max(1.1, 4 - state.phase * 0.3 + Math.random() * 1.2);
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

  function spawnFox() {
    const candidates = state.grapes.filter((grape) => canFoxSteal(grape));
    if (candidates.length === 0) {
      return;
    }

    const fromLeft = Math.random() < 0.5;
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
      burst(fox.x + FOX_WIDTH / 2, fox.y, "#ffd166", 10);
    }
  }

  function checkRoundState() {
    if (state.juice >= state.juiceGoal) {
      state.screen = "roundWon";
      state.roundOverTimer = 2.4;
      state.message = `Phase ${state.phase} complete`;
      return;
    }

    const usefulGrapes = state.grapes.some((grape) => !grape.gone || grape.stolenBy !== null);
    const carriedGrapes = state.players.some((player) => player.carrying) || state.winepress.loaded;
    if (!usefulGrapes && !carriedGrapes) {
      state.screen = "gameOver";
      state.message = "The vineyard was overrun. Press R to restart.";
    }
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
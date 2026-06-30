import { CONTROL_SETS, DEFAULT_HIGH_SCORES, DEFAULT_PARAMETERS, GRAPE_SPAWN, PLATFORMS, PLAYER_COLORS, PRESS, WORLD } from "./config.js";

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 34;
const FOX_WIDTH = 34;
const FOX_HEIGHT = 18;
const PLAYER_RUN_SPEED = 220;
const PLAYER_GROUND_ACCEL = 2500;
const PLAYER_AIR_ACCEL = 1450;
const PLAYER_GROUND_FRICTION = 3000;
const PLAYER_AIR_FRICTION = 720;
const PLAYER_JUMP_SPEED = -650;
const PLAYER_JUMP_CUT_SPEED = -260;
const PLAYER_COYOTE_SECONDS = 0.1;
const PLAYER_JUMP_BUFFER_SECONDS = 0.12;
const PLAYER_ASCEND_GRAVITY = 1550;
const PLAYER_RELEASE_GRAVITY = 2700;
const PLAYER_FALL_GRAVITY = 2250;
const PLAYER_FAST_FALL_GRAVITY = 3300;
const PLAYER_MAX_FALL_SPEED = 880;
const PLAYER_FAST_FALL_SPEED = 1120;
const FOX_SWEAT_INTERVAL = 0.16;
const HIGH_SCORES_KEY = "vineguard.highScores";
const LAST_HIGH_SCORE_NAME_KEY = "vineguard.lastHighScoreName";
const OLD_DEFAULT_HIGH_SCORE_NAMES = new Set([
  "David Jonathan",
  "Paul Barnabas",
  "Fiery Furnace",
  "Magi",
  "Matthew Mark Luke John",
  "Four Lepers",
]);

export function createGame(input, options = {}) {
  const state = {
    screen: "title",
    juice: 0,
    elapsed: 0,
    titleTime: 0,
    message: "Press any listed control to join",
    players: [],
    grapes: [],
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
    grapeSpawnTimer: 1,
    nextGrapeId: 1,
    tutorial: createTutorialState(),
    transition: null,
    parameters: options.parameters ? normalizeParameters(options.parameters) : normalizeParameters({}),
    run: createRunState(),
    round: createRoundStats(),
    highScores: loadHighScores(),
    highScoreTab: "overall",
    pendingHighScore: null,
    controls: input.getControlSets(),
    controlStates: [],
  };

  function update(delta) {
    state.controls = input.getControlSets();
    state.controlStates = state.controls.map(controlStateFor);
    state.titleTime += delta;

    for (const controlIndex of input.consumeJoins()) {
      joinPlayer(controlIndex);
    }

    if (state.screen === "title" && state.players.length > 0 && input.wasPressed("Space")) {
      startRun();
    }

    if (state.screen === "gameOver") {
      updateParticles(delta);
      input.clearPressed();
      return;
    }

    if (state.screen !== "playing") {
      updateParticles(delta);
      input.clearPressed();
      return;
    }

    state.elapsed += delta;
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
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      wasJumpHeld: false,
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

  function controlStateFor(controls) {
    return {
      left: input.isDown(controls.left),
      right: input.isDown(controls.right),
      jump: input.isDown(controls.jump),
      down: input.isDown(controls.down),
    };
  }

  function startRun() {
    if (state.players.length === 0) {
      return;
    }

    state.screen = "playing";
    state.elapsed = 0;
    state.juice = 0;
    state.message = "Protect the vineyard";
    state.transition = null;
    state.tutorial = createTutorialState();
    state.nextGrapeId = 1;
    state.grapes = [];
    state.round = createRoundStats();
    state.run = createRunState();
    state.run.playerCount = state.players.length;
    state.foxes = [];
    state.particles = [];
    state.foxSpawnTimer = currentFoxInterval();
    state.grapeSpawnTimer = currentGrapeInterval();
    state.pendingHighScore = null;
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
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.wasJumpHeld = false;
    }

    for (let index = 0; index < state.parameters.startingGrapes; index += 1) {
      spawnGrape();
    }
  }

  function createGrape(site) {
    return {
      id: state.nextGrapeId++,
      x: site.x,
      y: site.y,
      stage: "blossom",
      growth: 0,
      stolenBy: null,
      onGround: false,
      gone: false,
      sparkle: 0,
      juiceLeftMl: state.parameters.juicePerGrapeMl,
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

  function updatePlayers(delta) {
    state.winepress.highlightVat = false;
    state.winepress.highlightPumps = state.winepress.loaded !== null;
    updateTutorialTimers(delta);

    for (const player of state.players) {
      const controls = controlFor(player.controlIndex);
      const move = Number(input.isDown(controls.right)) - Number(input.isDown(controls.left));
      const jumpHeld = input.isDown(controls.jump);
      const jumpReleased = player.wasJumpHeld && !jumpHeld;
      const downHeld = input.isDown(controls.down);
      const targetVx = move * PLAYER_RUN_SPEED;
      const acceleration = player.onGround ? PLAYER_GROUND_ACCEL : PLAYER_AIR_ACCEL;
      const friction = player.onGround ? PLAYER_GROUND_FRICTION : PLAYER_AIR_FRICTION;
      player.vx = move === 0
        ? approach(player.vx, 0, friction * delta)
        : approach(player.vx, targetVx, acceleration * delta);
      player.animationTime += delta;

      if (player.onGround) {
        player.coyoteTimer = PLAYER_COYOTE_SECONDS;
      } else {
        player.coyoteTimer = Math.max(0, player.coyoteTimer - delta);
      }

      if (input.wasPressed(controls.jump)) {
        player.jumpBufferTimer = PLAYER_JUMP_BUFFER_SECONDS;
      } else {
        player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - delta);
      }

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

      if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
        player.vy = PLAYER_JUMP_SPEED;
        player.onGround = false;
        player.wasAirborne = true;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
        if (state.tutorial.active) {
          state.tutorial.moved = true;
        }
      }

      if (jumpReleased && player.vy < PLAYER_JUMP_CUT_SPEED) {
        player.vy = PLAYER_JUMP_CUT_SPEED;
      }

      const previousY = player.y;
      const maxFallSpeed = downHeld && !player.onGround ? PLAYER_FAST_FALL_SPEED : PLAYER_MAX_FALL_SPEED;
      player.vy = Math.min(player.vy + playerGravity(player, jumpHeld, downHeld) * delta, maxFallSpeed);
      player.x += player.vx * delta;
      player.y += player.vy * delta;
      player.x = clamp(player.x, 8, WORLD.width - player.width - 8);

      const landingSpeed = resolvePlatformCollisions(player, previousY);
      if (landingSpeed > 0) {
        landingDust(player, landingSpeed);
      }
      recoverPlayerIfOutOfBounds(player);
      tryHarvestOrDeposit(player);
      scareFoxes(player);
      player.wasJumpHeld = jumpHeld;
    }
  }

  function playerGravity(player, jumpHeld, downHeld) {
    if (player.vy < 0) {
      return jumpHeld ? PLAYER_ASCEND_GRAVITY : PLAYER_RELEASE_GRAVITY;
    }

    return downHeld ? PLAYER_FAST_FALL_GRAVITY : PLAYER_FALL_GRAVITY;
  }

  function updateTutorialTimers(delta) {
    if (!state.tutorial.active) {
      return;
    }

    state.tutorial.scarePraiseTimer = Math.max(0, state.tutorial.scarePraiseTimer - delta);
  }

  function resolvePlatformCollisions(player, previousY) {
    let landingSpeed = 0;
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
        if (player.wasAirborne) {
          landingSpeed = Math.max(landingSpeed, player.vy);
        }
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

    return landingSpeed;
  }

  function landingDust(player, landingSpeed) {
    const count = landingSpeed > 520 ? 8 : 5;
    for (let index = 0; index < count; index += 1) {
      state.particles.push({
        x: player.x + player.width / 2 + randomBetween(-10, 10),
        y: player.y + player.height - 4,
        vx: randomBetween(-52, 52),
        vy: randomBetween(-72, -18),
        life: randomBetween(0.18, 0.34),
        color: "#d7b47a",
      });
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
      vatPlatform(),
      pumpPlatform("left"),
      pumpPlatform("right"),
    ];
  }

  function vatPlatform() {
    return {
      x: PRESS.vat.x - 4,
      y: PRESS.vat.y,
      width: PRESS.vat.width + 8,
      height: 10,
      vat: true,
    };
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
    state.juice += state.parameters.juicePerPumpMl;
    state.run.totalJuice += state.parameters.juicePerPumpMl;
    state.winepress.loaded.juiceLeftMl = Math.max(0, state.winepress.loaded.juiceLeftMl - state.parameters.juicePerPumpMl);
    if (state.tutorial.active) {
      state.tutorial.pumped = true;
    }
    burst(PRESS.vat.x + PRESS.vat.width / 2, PRESS.vat.y, "#c43b74", 8);

    if (state.winepress.loaded.juiceLeftMl <= 0) {
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
    state.grapeSpawnTimer -= delta;
    if (state.grapeSpawnTimer <= 0) {
      spawnGrape();
      state.grapeSpawnTimer = currentGrapeInterval() * randomBetween(0.75, 1.25);
    }

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

    state.grapes = state.grapes.filter((grape) => !grape.gone || grape.stolenBy !== null || grape.onGround);
  }

  function spawnGrape() {
    const activeGrapes = state.grapes.filter((grape) => !grape.gone || grape.stolenBy !== null || grape.onGround).length;
    if (activeGrapes >= state.parameters.maxGrapes) {
      return;
    }

    const site = randomGrapeSite();
    const grape = createGrape(site);
    state.grapes.push(grape);
    state.round.planted += 1;
    state.run.planted += 1;
    burst(grape.x, grape.y - 8, "#ffd6ee", 6);
  }

  function randomGrapeSite() {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const site = {
        x: randomBetween(GRAPE_SPAWN.marginX, WORLD.width - GRAPE_SPAWN.marginX),
        y: randomBetween(GRAPE_SPAWN.minY, GRAPE_SPAWN.maxY),
      };

      if (!tooCloseToPress(site)) {
        return site;
      }
    }

    return {
      x: randomBetween(GRAPE_SPAWN.marginX, WORLD.width - GRAPE_SPAWN.marginX),
      y: randomBetween(GRAPE_SPAWN.minY, GRAPE_SPAWN.maxY),
    };
  }

  function tooCloseToPress(site) {
    const pressCenterX = PRESS.vat.x + PRESS.vat.width / 2;
    const pressCenterY = PRESS.vat.y + PRESS.vat.height / 2;
    return Math.abs(site.x - pressCenterX) < GRAPE_SPAWN.pressMarginX
      && Math.abs(site.y - pressCenterY) < GRAPE_SPAWN.pressMarginY;
  }

  function updateFoxes(delta) {
    state.foxSpawnTimer -= delta;
    if (state.foxSpawnTimer <= 0) {
      spawnFox();
      state.foxSpawnTimer = currentFoxInterval() * randomBetween(0.75, 1.25);
    }

    for (const fox of state.foxes) {
      fox.animationTime += delta;

      if (fox.state === "fleeing") {
        fox.x += fox.escapeDirection * fox.speed * 1.35 * delta;
        fox.facing = fox.escapeDirection;
        fox.sweatTimer -= delta;
        if (fox.sweatTimer <= 0) {
          sweat(fox.x + FOX_WIDTH / 2, fox.y + 2);
          fox.sweatTimer = FOX_SWEAT_INTERVAL;
        }
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

        fox.targetY = foxLaneY(fox.target);
        fox.y = approach(fox.y, fox.targetY, fox.verticalSpeed * delta);
        const targetDx = fox.target.x - centerX(fox);
        if (Math.abs(targetDx) > 4) {
          const direction = Math.sign(targetDx);
          fox.x += direction * fox.speed * delta;
          fox.facing = direction;
        }

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
        fox.carrying = null;
        fox.target = null;
        fox.state = "fleeing";
        state.round.stolen += 1;
        state.run.stolen += 1;
      }
    }

    state.foxes = state.foxes.filter((fox) => fox.x > -90 && fox.x < WORLD.width + 90);
  }

  function spawnFox(preferredTarget = null, forcedFromLeft = null) {
    if (state.foxes.length >= state.parameters.maxFoxes) {
      return;
    }

    const candidates = preferredTarget && canFoxSteal(preferredTarget)
      ? [preferredTarget]
      : availableFoxTargets();
    if (candidates.length === 0) {
      return;
    }

    const target = preferredTarget && canFoxSteal(preferredTarget)
      ? preferredTarget
      : leastDefendedGrape(candidates);
    const fromLeft = forcedFromLeft ?? target.x < WORLD.width / 2;
    const targetY = foxLaneY(target);
    const entryY = forcedFromLeft === null ? foxEntryY() : targetY;
    const speed = state.parameters.foxSpeedStart + (state.elapsed / 60) * state.parameters.foxSpeedRampPerMinute;
    state.foxes.push({
      x: fromLeft ? -FOX_WIDTH : WORLD.width + FOX_WIDTH,
      y: entryY,
      width: FOX_WIDTH,
      height: FOX_HEIGHT,
      target,
      targetY,
      carrying: null,
      escapeDirection: fromLeft ? -1 : 1,
      speed,
      verticalSpeed: 82 + (state.elapsed / 60) * 4,
      state: "seeking",
      facing: fromLeft ? 1 : -1,
      animationTime: 0,
      sweatTimer: FOX_SWEAT_INTERVAL,
    });
  }

  function retargetOrFlee(fox) {
    const candidates = availableFoxTargets(fox);
    if (candidates.length > 0) {
      fox.target = leastDefendedGrape(candidates);
      fox.targetY = foxLaneY(fox.target);
      return;
    }

    fox.target = null;
    fox.state = "fleeing";
    fox.escapeDirection = centerX(fox) < WORLD.width / 2 ? -1 : 1;
    fox.sweatTimer = 0;
  }

  function availableFoxTargets(ignoredFox = null) {
    const targeted = new Set(
      state.foxes
        .filter((fox) => fox !== ignoredFox && fox.state !== "fleeing" && fox.target && !fox.carrying)
        .map((fox) => fox.target),
    );
    return state.grapes.filter((grape) => canFoxSteal(grape) && !targeted.has(grape));
  }

  function leastDefendedGrape(grapes) {
    let leastDefended = grapes[0];
    let largestNearestPlayerDistance = defendedDistance(leastDefended);

    for (const grape of grapes.slice(1)) {
      const grapeDistance = defendedDistance(grape);
      if (grapeDistance > largestNearestPlayerDistance) {
        leastDefended = grape;
        largestNearestPlayerDistance = grapeDistance;
      }
    }

    return leastDefended;
  }

  function defendedDistance(grape) {
    if (state.players.length === 0) {
      return 0;
    }

    return Math.min(...state.players.map((player) => distance(player, grape)));
  }

  function canFoxSteal(grape) {
    return !grape.gone && grape.stolenBy === null && grape.stage === "ripe";
  }

  function foxCanReachGrape(fox, grape) {
    return Math.abs(centerX(fox) - grape.x) <= 24 && Math.abs(centerY(fox) - grape.y) <= 34;
  }

  function foxLaneY(grape) {
    return clamp(grape.y + 14, 110, WORLD.floorY - FOX_HEIGHT);
  }

  function foxEntryY() {
    return randomBetween(96, WORLD.floorY - FOX_HEIGHT);
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
      fox.sweatTimer = 0;
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
    } else if (state.winepress.loaded && state.winepress.strokes >= PRESS.requiredStrokes / 2) {
      state.tutorial.text = "This is much easier with 2+ people working together.";
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
    if (state.run.stolen >= state.parameters.stolenLimit) {
      state.screen = "gameOver";
      state.pendingHighScore = createHighScoreCandidate();
      state.transition = createGameOverTransition();
      state.message = state.transition.title;
    }
  }

  function createGameOverTransition() {
    return {
      title: "Harvest ended",
      lines: [
        `Score: ${formatMl(state.run.totalJuice)}`,
        `Foxes stole ${state.run.stolen}/${state.parameters.stolenLimit} grapes`,
        `Protected for ${formatTime(state.elapsed)}`,
        "Enter a team name for the local high score.",
        "Press Continue to return to the main screen.",
      ],
    };
  }

  function continueToTitle() {
    state.screen = "title";
    state.message = "Press any listed control to join";
    state.transition = null;
    state.pendingHighScore = null;
    state.grapes = [];
    state.foxes = [];
    state.particles = [];
    state.winepress.loaded = null;
    state.winepress.strokes = 0;
    state.winepress.leftOffset = 0;
    state.winepress.rightOffset = 0;
    state.winepress.lastPumpSide = null;
  }

  function setHighScoreTab(tab) {
    state.highScoreTab = ["overall", "1", "2", "3", "4"].includes(tab) ? tab : "overall";
  }

  function controlFor(controlIndex) {
    return input.getControlSet(controlIndex) || CONTROL_SETS[controlIndex];
  }

  function setParameters(parameters) {
    state.parameters = normalizeParameters(parameters);
  }

  function resetParameters() {
    state.parameters = normalizeParameters({});
  }

  function submitHighScore(name) {
    if (!state.pendingHighScore) {
      return state.highScores;
    }

    const entry = {
      ...state.pendingHighScore,
      name: cleanHighScoreName(name),
    };
    saveLastHighScoreName(entry.name);
    state.highScores = saveHighScore(entry);
    state.pendingHighScore = null;
    continueToTitle();
    return state.highScores;
  }

  function resetHighScores() {
    try {
      localStorage.removeItem(HIGH_SCORES_KEY);
    } catch {
      // The game remains playable if storage is unavailable.
    }

    state.highScores = loadHighScores();
    state.highScoreTab = "overall";
    return state.highScores;
  }

  function createHighScoreCandidate() {
    return {
      name: loadLastHighScoreName(),
      scoreMl: state.run.totalJuice,
      players: state.run.playerCount,
      seconds: Math.round(state.elapsed),
      stolen: state.run.stolen,
      date: new Date().toISOString(),
    };
  }

  function currentGrapeInterval() {
    return Math.max(
      state.parameters.grapeMinInterval,
      state.parameters.grapeStartInterval - (state.elapsed / 60) * state.parameters.grapeIntervalRampPerMinute,
    );
  }

  function currentFoxInterval() {
    return Math.max(
      state.parameters.foxMinInterval,
      state.parameters.foxStartInterval - (state.elapsed / 60) * state.parameters.foxIntervalRampPerMinute,
    );
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

  function sweat(x, y) {
    state.particles.push({
      x: x + randomBetween(-5, 5),
      y,
      vx: randomBetween(-18, 18),
      vy: randomBetween(-118, -74),
      life: randomBetween(0.28, 0.48),
      color: "#9be7ff",
    });
  }

  return {
    state,
    update,
    debug: {
      joinPlayer,
      startRun,
      continueToTitle,
      submitHighScore,
      setHighScoreTab,
      resetHighScores,
      spawnFox,
      spawnGrape,
      pump,
      canFoxSteal,
      setParameters,
      resetParameters,
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
    planted: 0,
    stolen: 0,
    playerCount: 0,
  };
}

function createRoundStats(planted = 0) {
  return {
    planted,
    stolen: 0,
  };
}

function normalizeParameters(parameters) {
  const normalized = { ...DEFAULT_PARAMETERS };

  for (const key of Object.keys(DEFAULT_PARAMETERS)) {
    const value = Number(parameters?.[key]);
    if (Number.isFinite(value)) {
      normalized[key] = value;
    }
  }

  normalized.stolenLimit = Math.max(1, Math.round(normalized.stolenLimit));
  normalized.startingGrapes = Math.max(0, Math.round(normalized.startingGrapes));
  normalized.maxGrapes = Math.max(1, Math.round(normalized.maxGrapes));
  normalized.maxFoxes = Math.max(1, Math.round(normalized.maxFoxes));
  normalized.juicePerPumpMl = Math.max(1, Math.round(normalized.juicePerPumpMl));
  normalized.juicePerGrapeMl = Math.max(normalized.juicePerPumpMl, Math.round(normalized.juicePerGrapeMl));
  normalized.grapeStartInterval = Math.max(0.2, normalized.grapeStartInterval);
  normalized.grapeMinInterval = Math.max(0.2, Math.min(normalized.grapeMinInterval, normalized.grapeStartInterval));
  normalized.foxStartInterval = Math.max(0.2, normalized.foxStartInterval);
  normalized.foxMinInterval = Math.max(0.2, Math.min(normalized.foxMinInterval, normalized.foxStartInterval));
  normalized.grapeIntervalRampPerMinute = Math.max(0, normalized.grapeIntervalRampPerMinute);
  normalized.foxIntervalRampPerMinute = Math.max(0, normalized.foxIntervalRampPerMinute);
  normalized.foxSpeedStart = Math.max(20, normalized.foxSpeedStart);
  normalized.foxSpeedRampPerMinute = Math.max(0, normalized.foxSpeedRampPerMinute);

  return normalized;
}

function loadHighScores() {
  try {
    const rawScores = localStorage.getItem(HIGH_SCORES_KEY);
    const saved = rawScores === null ? [] : JSON.parse(rawScores);
    if (!Array.isArray(saved)) {
      return defaultHighScores();
    }

    return combineHighScores(defaultHighScores(), saved.map(normalizeHighScore).filter(Boolean));
  } catch {
    return defaultHighScores();
  }
}

function defaultHighScores() {
  return DEFAULT_HIGH_SCORES.map((entry, index) => normalizeHighScore({
    ...entry,
    date: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
  })).filter(Boolean).sort(compareHighScores);
}

function combineHighScores(defaultScores, savedScores) {
  const byEntry = new Map();
  for (const score of [...defaultScores, ...savedScores.filter((score) => !OLD_DEFAULT_HIGH_SCORE_NAMES.has(score.name))]) {
    byEntry.set(`${score.name}|${score.players}|${score.scoreMl}`, score);
  }

  return [...byEntry.values()].sort(compareHighScores);
}

function saveHighScore(entry) {
  const scores = combineHighScores(defaultHighScores(), [...loadHighScores(), normalizeHighScore(entry)].filter(Boolean));

  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
  } catch {
    // The game remains playable if storage is unavailable.
  }

  return scores;
}

function normalizeHighScore(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const scoreMl = Math.round(Number(entry.scoreMl));
  if (!Number.isFinite(scoreMl) || scoreMl < 0) {
    return null;
  }

  return {
    name: cleanHighScoreName(entry.name),
    scoreMl,
    players: Math.max(1, Math.round(Number(entry.players) || 1)),
    seconds: Math.max(0, Math.round(Number(entry.seconds) || 0)),
    stolen: Math.max(0, Math.round(Number(entry.stolen) || 0)),
    date: typeof entry.date === "string" ? entry.date : new Date().toISOString(),
  };
}

function cleanHighScoreName(name) {
  const cleaned = String(name || "Vineguard Team").trim().slice(0, 32);
  return cleaned || "Vineguard Team";
}

function loadLastHighScoreName() {
  try {
    return cleanHighScoreName(localStorage.getItem(LAST_HIGH_SCORE_NAME_KEY));
  } catch {
    return "Vineguard Team";
  }
}

function saveLastHighScoreName(name) {
  try {
    localStorage.setItem(LAST_HIGH_SCORE_NAME_KEY, cleanHighScoreName(name));
  } catch {
    // The game remains playable if storage is unavailable.
  }
}

function compareHighScores(left, right) {
  return right.scoreMl - left.scoreMl || right.seconds - left.seconds;
}

function formatMl(value) {
  return `${Math.round(value)} ml`;
}

function formatTime(seconds) {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
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
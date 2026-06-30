import { PLATFORMS, PRESS, VERSES, WORLD } from "./config.js";
import { drawFrame, foxAnimations, playerAnimations, sprites } from "./sprites.js";

const FONT = '"Press Start 2P", monospace';

export function render(ctx, state) {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);

  if (state.screen === "title") {
    drawTitleScreen(ctx, state);
    return;
  }

  drawBackground(ctx);
  drawPlatforms(ctx);
  drawGrapes(ctx, state);
  drawWinepress(ctx, state);
  drawFoxes(ctx, state);
  drawPlayers(ctx, state);
  drawParticles(ctx, state);
  drawHud(ctx, state);
}

function drawBackground(ctx) {
  ctx.fillStyle = "#8bc46f";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#78aa5e";
  for (let x = 0; x < WORLD.width; x += 48) {
    ctx.fillRect(x, WORLD.floorY + 12, 28, 6);
  }

  ctx.fillStyle = "#47734d";
  ctx.fillRect(0, WORLD.floorY, WORLD.width, WORLD.height - WORLD.floorY);
}

function drawPlatforms(ctx) {
  for (const platform of PLATFORMS) {
    ctx.fillStyle = platform.y === WORLD.floorY ? "#5b4635" : "#7b5a3d";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#9f744b";
    ctx.fillRect(platform.x, platform.y, platform.width, 5);
  }
}

function drawGrapes(ctx, state) {
  for (const grape of state.grapes) {
    if (grape.gone || grape.stolenBy) {
      continue;
    }

    ctx.fillStyle = "#37663d";
    ctx.fillRect(grape.x - 3, grape.y - 32, 6, 34);
    ctx.fillRect(grape.x - 20, grape.y - 30, 40, 5);

    if (grape.stage === "blossom") {
      drawBlossom(ctx, grape.x, grape.y - 8);
    } else if (grape.stage === "unripe") {
      drawCluster(ctx, grape.x, grape.y - 8, "#77bf52", 5);
    } else {
      const pulse = Math.sin(grape.sparkle * 8) * 2;
      drawCluster(ctx, grape.x, grape.y - 8 + pulse, "#7432a8", 7);
      ctx.strokeStyle = "#f7e06e";
      ctx.strokeRect(grape.x - 16, grape.y - 27 + pulse, 32, 32);
    }
  }
}

function drawBlossom(ctx, x, y) {
  ctx.fillStyle = "#ffd6ee";
  ctx.fillRect(x - 4, y - 8, 8, 16);
  ctx.fillRect(x - 8, y - 4, 16, 8);
  ctx.fillStyle = "#f5b342";
  ctx.fillRect(x - 2, y - 2, 4, 4);
}

function drawCluster(ctx, x, y, color, radius) {
  ctx.fillStyle = color;
  const points = [
    [0, -10],
    [-8, -4],
    [8, -4],
    [-5, 5],
    [5, 5],
    [0, 14],
  ];
  for (const [offsetX, offsetY] of points) {
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWinepress(ctx, state) {
  const vat = PRESS.vat;
  const press = state.winepress;
  if (press.highlightVat) {
    ctx.strokeStyle = "#f7e06e";
    ctx.lineWidth = 5;
    ctx.strokeRect(vat.x - 8, vat.y - 8, vat.width + 16, vat.height + 16);
  }

  ctx.fillStyle = "#70472d";
  ctx.fillRect(vat.x, vat.y, vat.width, vat.height);
  ctx.fillStyle = press.loaded ? "#7a2e70" : "#4b3328";
  ctx.fillRect(vat.x + 8, vat.y + 12, vat.width - 16, vat.height - 22);

  drawPump(ctx, PRESS.leftPump, press.leftOffset, press.highlightPumps);
  drawPump(ctx, PRESS.rightPump, press.rightOffset, press.highlightPumps);

  ctx.strokeStyle = "#5a3a28";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(PRESS.leftPump.x + PRESS.leftPump.width, PRESS.leftPump.baseY + press.leftOffset + 8);
  ctx.lineTo(vat.x, vat.y + 24);
  ctx.moveTo(vat.x + vat.width, vat.y + 24);
  ctx.lineTo(PRESS.rightPump.x, PRESS.rightPump.baseY + press.rightOffset + 8);
  ctx.stroke();

  if (press.loaded) {
    const extracted = 1 - (press.loaded.juiceLeftMl / state.parameters.juicePerGrapeMl);
    const fillWidth = (vat.width - 16) * Math.max(0, Math.min(1, extracted));
    ctx.fillStyle = "#d766a6";
    ctx.fillRect(vat.x + 8, vat.y + vat.height - 10, fillWidth, 5);
  }
}

function drawPump(ctx, pump, offset, highlighted) {
  if (highlighted) {
    ctx.strokeStyle = "#f7e06e";
    ctx.lineWidth = 4;
    ctx.strokeRect(pump.x - 5, pump.baseY + offset - 5, pump.width + 10, pump.height + 10);
  }

  ctx.fillStyle = "#3d2f28";
  ctx.fillRect(pump.x + 14, pump.baseY + offset + pump.height, pump.width - 28, 54 - offset);
  ctx.fillStyle = "#c98d50";
  ctx.fillRect(pump.x, pump.baseY + offset, pump.width, pump.height);
}

function drawFoxes(ctx, state) {
  for (const fox of state.foxes) {
    const animation = fox.state === "fleeing" ? foxAnimations.flee : foxAnimations.run;
    const drawn = drawFrame(
      ctx,
      sprites.fox,
      animation,
      fox.animationTime,
      fox.x + fox.width / 2 - 24,
      fox.y + fox.height / 2 - 28,
      48,
      48,
      fox.facing < 0,
    );

    if (!drawn) {
      ctx.fillStyle = fox.state === "fleeing" ? "#f0a15f" : "#d95f30";
      ctx.fillRect(fox.x, fox.y, fox.width, fox.height);
      ctx.fillStyle = "#f7ead1";
      ctx.fillRect(fox.x + fox.width - 8, fox.y + 3, 8, 7);
      ctx.fillStyle = "#7a2c1f";
      ctx.fillRect(fox.x - 12, fox.y + 6, 14, 8);
    }

    if (fox.target && !fox.carrying && fox.state !== "fleeing") {
      ctx.strokeStyle = "#f7e06e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fox.x + fox.width / 2, fox.y + fox.height / 2);
      ctx.lineTo(fox.target.x, fox.target.y - 18);
      ctx.stroke();
    }

    if (fox.carrying) {
      drawCluster(ctx, fox.x + fox.width / 2, fox.y - 8, "#7432a8", 4);
    }
  }
}

function drawPlayers(ctx, state) {
  for (const player of state.players) {
    const sheet = sprites.players[player.id - 1];
    const animation = getPlayerAnimation(player);
    const drawn = drawFrame(
      ctx,
      sheet,
      animation,
      player.animationTime,
      player.x + player.width / 2 - 24,
      player.y + player.height - 48,
      48,
      48,
      player.facing < 0,
    );

    if (!drawn) {
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.fillStyle = "#f7ead1";
      ctx.fillRect(player.x + 6, player.y + 7, 12, 5);
    }

    if (player.carrying) {
      drawCluster(ctx, player.x + player.width / 2, player.y - 14, "#7432a8", 5);
    }
  }
}

function getPlayerAnimation(player) {
  if (!player.onGround) {
    return playerAnimations.jump;
  }

  if (Math.abs(player.vx) > 1) {
    return playerAnimations.run;
  }

  return playerAnimations.idle;
}

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life * 2);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 4, 4);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  drawGamePlayerSlots(ctx, state);
  drawGameScorePanel(ctx, state);
  drawTutorialText(ctx, state);

  if (state.screen !== "playing") {
    ctx.fillStyle = "rgba(21, 24, 31, 0.68)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "#f7ead1";
    ctx.textAlign = "center";
    if (state.transition) {
      ctx.font = `18px ${FONT}`;
      ctx.fillText(state.transition.title, WORLD.width / 2, 160);
      ctx.font = `10px ${FONT}`;
      drawCenteredLines(ctx, state.transition.lines.join("\n"), WORLD.width / 2, 246, 24);
    } else {
      ctx.font = `18px ${FONT}`;
      drawCenteredLines(ctx, state.message, WORLD.width / 2, 220, 28);
    }

    ctx.font = `10px ${FONT}`;
    if (state.screen === "title") {
      ctx.fillText("Join: Arrows, WASD, YGHJ, or PL;'", WORLD.width / 2, 294);
    }
    ctx.textAlign = "left";
  }
}

function drawGamePlayerSlots(ctx, state) {
  const slotWidth = 198;
  const slotHeight = 54;
  const gap = 10;
  const startX = 18;
  const y = 10;

  for (let index = 0; index < 4; index += 1) {
    const x = startX + index * (slotWidth + gap);
    const controls = state.controls[index];
    const controlState = state.controlStates[index] || {};
    const player = state.players.find((item) => item.controlIndex === index);
    const active = Boolean(player);

    ctx.fillStyle = active ? "rgba(71, 115, 77, 0.88)" : "rgba(21, 24, 31, 0.56)";
    ctx.fillRect(x, y, slotWidth, slotHeight);
    ctx.strokeStyle = active ? player.color : "rgba(247, 234, 209, 0.36)";
    ctx.lineWidth = active ? 3 : 2;
    ctx.strokeRect(x, y, slotWidth, slotHeight);

    ctx.fillStyle = active ? "#f7e06e" : "rgba(247, 234, 209, 0.58)";
    ctx.font = `8px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(`P${index + 1}`, x + 10, y + 17);
    ctx.font = `6px ${FONT}`;
    ctx.fillText(active ? "ACTIVE" : "JOIN", x + 10, y + 31);

    drawKeyPyramid(ctx, controls, controlState, x + 58, y + 9, active);

    if (active) {
      drawTitlePlayer(ctx, player, x + 146, y + 11, state.titleTime, controlState);
    } else {
      drawInactivePlayerSlot(ctx, x + 156, y + 12);
    }
  }

  ctx.textAlign = "left";
}

function drawGameScorePanel(ctx, state) {
  const x = 286;
  const y = 72;
  const width = 388;
  const height = 52;

  ctx.fillStyle = "rgba(21, 24, 31, 0.76)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(247, 224, 110, 0.78)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "#f7ead1";
  ctx.font = `13px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(`${formatLiters(state.juice)} L`, x + 18, y + 26);

  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = "#f7e06e";
  ctx.fillText(`${Math.round(state.juice)} ml`, x + 128, y + 25);

  ctx.fillStyle = "#f7ead1";
  ctx.textAlign = "right";
  ctx.fillText(`Foxes ${state.run.stolen}/${state.parameters.stolenLimit}`, x + width - 18, y + 25);

  ctx.font = `7px ${FONT}`;
  ctx.fillStyle = "rgba(247, 234, 209, 0.82)";
  ctx.fillText(`Grapes ${spawnRatePerSecond(state, "grape")} /s`, x + width - 196, y + 43);
  ctx.fillText(`Foxes ${spawnRatePerSecond(state, "fox")} /s`, x + width - 18, y + 43);
  ctx.textAlign = "left";
}

function spawnRatePerSecond(state, kind) {
  const parameters = state.parameters;
  const elapsedMinutes = state.elapsed / 60;
  const interval = kind === "grape"
    ? Math.max(parameters.grapeMinInterval, parameters.grapeStartInterval - elapsedMinutes * parameters.grapeIntervalRampPerMinute)
    : Math.max(parameters.foxMinInterval, parameters.foxStartInterval - elapsedMinutes * parameters.foxIntervalRampPerMinute);
  return (1 / interval).toFixed(2);
}

function drawTitleScreen(ctx, state) {
  drawBackground(ctx);
  drawPlatforms(ctx);

  ctx.fillStyle = "rgba(21, 24, 31, 0.3)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  drawTitleVines(ctx, state.titleTime);
  drawJoinSlots(ctx, state);

  ctx.fillStyle = "#f7ead1";
  ctx.textAlign = "center";
  ctx.font = `34px ${FONT}`;
  ctx.fillText("VINEGUARD", WORLD.width / 2, 136);
  ctx.font = `9px ${FONT}`;
  ctx.fillText("A local co-op vineyard scramble", WORLD.width / 2, 160);

  drawRotatingVerse(ctx, state);
  drawHighScoreTable(ctx, state);

  ctx.font = `9px ${FONT}`;
  const joinText = state.players.length === 0
    ? "Press any player controls to join"
    : `${state.players.length} player${state.players.length === 1 ? "" : "s"} joined. Press Space or Start.`;
  ctx.fillText(joinText, WORLD.width / 2, 438);

  ctx.font = `7px ${FONT}`;
  ctx.fillStyle = "rgba(247, 234, 209, 0.72)";
  ctx.fillText("By HanClinto Games for CGDC Speedgame Classic 2026", WORLD.width / 2, 512);
  ctx.textAlign = "left";
}

function drawJoinSlots(ctx, state) {
  const slotWidth = 212;
  const slotHeight = 72;
  const gap = 16;
  const startX = (WORLD.width - slotWidth * 4 - gap * 3) / 2;
  const y = 14;

  for (let index = 0; index < 4; index += 1) {
    const x = startX + index * (slotWidth + gap);
    const controls = state.controls[index];
    const controlState = state.controlStates[index] || {};
    const player = state.players.find((item) => item.controlIndex === index);
    const active = Boolean(player);

    ctx.fillStyle = active ? "rgba(71, 115, 77, 0.9)" : "rgba(21, 24, 31, 0.68)";
    ctx.fillRect(x, y, slotWidth, slotHeight);
    ctx.strokeStyle = active ? player.color : "rgba(247, 234, 209, 0.44)";
    ctx.lineWidth = active ? 3 : 2;
    ctx.strokeRect(x, y, slotWidth, slotHeight);

    ctx.fillStyle = active ? "#f7e06e" : "rgba(247, 234, 209, 0.68)";
    ctx.font = `8px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(`P${index + 1}`, x + 12, y + 18);
    ctx.font = `6px ${FONT}`;
    ctx.fillText(active ? "READY" : "PRESS A KEY", x + 12, y + 32);

    drawKeyPyramid(ctx, controls, controlState, x + 62, y + 14, active);

    if (active) {
      drawTitlePlayer(ctx, player, x + 158, y + 18, state.titleTime, controlState);
    } else {
      drawInactivePlayerSlot(ctx, x + 168, y + 23);
    }
  }

  ctx.textAlign = "left";
}

function drawKeyPyramid(ctx, controls, controlState, x, y, active) {
  drawKeyCap(ctx, x + 27, y, keyShortLabel(controls.jump), active, controlState.jump);
  drawKeyCap(ctx, x, y + 22, keyShortLabel(controls.left), active, controlState.left);
  drawKeyCap(ctx, x + 27, y + 22, keyShortLabel(controls.down), active, controlState.down);
  drawKeyCap(ctx, x + 54, y + 22, keyShortLabel(controls.right), active, controlState.right);
}

function drawKeyCap(ctx, x, y, label, active, pressed) {
  ctx.fillStyle = pressed ? "#f7e06e" : active ? "#f7ead1" : "rgba(247, 234, 209, 0.18)";
  ctx.fillRect(x, y, 22, 17);
  ctx.strokeStyle = pressed ? "#f7ead1" : active ? "#f7e06e" : "rgba(247, 234, 209, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, 22, 17);
  ctx.fillStyle = pressed || active ? "#15181f" : "rgba(247, 234, 209, 0.72)";
  ctx.font = `6px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(label, x + 11, y + 12);
}

function drawTitlePlayer(ctx, player, x, y, time, controlState = {}) {
  const sheet = sprites.players[player.id - 1];
  const movingSideways = Boolean(controlState.left || controlState.right);
  const animation = controlState.jump ? playerAnimations.jump : movingSideways ? playerAnimations.run : playerAnimations.idle;
  const flip = controlState.left && !controlState.right;
  const drawn = drawFrame(ctx, sheet, animation, time * (movingSideways ? 1.8 : 1), x - 12, y - 8, 48, 48, flip);

  if (!drawn) {
    ctx.fillStyle = player.color;
    ctx.fillRect(x, y, 24, 34);
    ctx.fillStyle = "#f7ead1";
    ctx.fillRect(x + 6, y + 7, 12, 5);
  }
}

function drawInactivePlayerSlot(ctx, x, y) {
  ctx.strokeStyle = "rgba(247, 234, 209, 0.32)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 24, 34);
  ctx.fillStyle = "rgba(247, 234, 209, 0.24)";
  ctx.fillRect(x + 6, y + 7, 12, 5);
}

function keyShortLabel(code) {
  const labels = {
    ArrowLeft: "<",
    ArrowRight: ">",
    ArrowUp: "^",
    ArrowDown: "v",
    Semicolon: ";",
    Quote: "'",
    Space: "SP",
  };

  if (labels[code]) {
    return labels[code];
  }

  if (code.startsWith("Key")) {
    return code.slice(3);
  }

  if (code.startsWith("Digit")) {
    return code.slice(5);
  }

  return code.slice(0, 2).toUpperCase();
}

function drawTitleVines(ctx, time) {
  ctx.strokeStyle = "rgba(55, 102, 61, 0.76)";
  ctx.lineWidth = 5;
  for (let index = 0; index < 6; index += 1) {
    const y = 152 + index * 39;
    ctx.beginPath();
    ctx.moveTo(90, y);
    for (let x = 90; x <= 870; x += 40) {
      ctx.lineTo(x, y + Math.sin(time * 0.8 + x * 0.02 + index) * 10);
    }
    ctx.stroke();
  }

  for (let index = 0; index < 18; index += 1) {
    const x = 110 + index * 44;
    const y = 164 + (index % 6) * 38 + Math.sin(time + index) * 3;
    drawCluster(ctx, x, y, index % 3 === 0 ? "#7432a8" : "#77bf52", 4);
  }
}

function drawRotatingVerse(ctx, state) {
  const rotationSeconds = 7.5;
  const titleTime = Number.isFinite(state.titleTime) ? state.titleTime : 0;
  const verseCount = Math.max(1, VERSES.length);
  const index = Math.abs(Math.floor(titleTime / rotationSeconds)) % verseCount;
  const verse = VERSES[index] || VERSES[0];
  if (!verse) {
    return;
  }
  const cycle = titleTime % rotationSeconds;
  const alpha = Math.min(1, cycle / 1.2, (rotationSeconds - cycle) / 1.2);

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = "rgba(21, 24, 31, 0.72)";
  ctx.fillRect(144, 174, 672, 84);
  ctx.strokeStyle = "rgba(247, 224, 110, 0.74)";
  ctx.lineWidth = 3;
  ctx.strokeRect(144, 174, 672, 84);

  ctx.fillStyle = "#f7ead1";
  ctx.font = `9px ${FONT}`;
  ctx.textAlign = "center";
  drawWrappedCenteredText(ctx, `"${verse.text}"`, WORLD.width / 2, 205, 594, 15);
  ctx.fillStyle = "#f7e06e";
  ctx.font = `8px ${FONT}`;
  ctx.fillText(verse.reference, WORLD.width / 2, 247);
  ctx.restore();
}

function drawHighScoreTable(ctx, state) {
  ctx.fillStyle = "rgba(21, 24, 31, 0.76)";
  ctx.fillRect(230, 284, 500, 126);
  ctx.strokeStyle = "rgba(247, 234, 209, 0.58)";
  ctx.lineWidth = 2;
  ctx.strokeRect(230, 284, 500, 126);

  ctx.fillStyle = "#f7e06e";
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("LOCAL HIGH SCORES", 250, 309);

  drawHighScoreTabs(ctx, state);

  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = "#f7ead1";
  const scores = highScoresForTab(state).slice(0, 5);
  if (scores.length === 0) {
    ctx.fillText("No harvests recorded yet", 250, 344);
    return;
  }

  ctx.fillStyle = "#f7e06e";
  ctx.font = `7px ${FONT}`;
  ctx.fillText("P", 594, 329);
  ctx.textAlign = "right";
  ctx.fillText("SCORE", 716, 329);
  ctx.textAlign = "left";

  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = "#f7ead1";

  for (let index = 0; index < scores.length; index += 1) {
    const score = scores[index];
    const y = 350 + index * 14;
    ctx.fillText(`${index + 1}. ${score.name}`, 250, y);
    ctx.textAlign = "right";
    ctx.fillText(`${score.players}P`, 608, y);
    ctx.fillText(`${score.scoreMl} ml`, 716, y);
    ctx.textAlign = "left";
  }
}

function drawHighScoreTabs(ctx, state) {
  const tabs = ["overall", "1", "2", "3", "4"];
  const labels = ["ALL", "1P", "2P", "3P", "4P"];
  let x = 476;

  ctx.font = `7px ${FONT}`;
  for (let index = 0; index < tabs.length; index += 1) {
    const active = state.highScoreTab === tabs[index];
    ctx.fillStyle = active ? "#f7e06e" : "rgba(247, 234, 209, 0.28)";
    ctx.fillRect(x, 296, 38, 18);
    ctx.strokeStyle = active ? "#f7ead1" : "rgba(247, 234, 209, 0.44)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, 296, 38, 18);
    ctx.fillStyle = active ? "#15181f" : "rgba(247, 234, 209, 0.72)";
    ctx.textAlign = "center";
    ctx.fillText(labels[index], x + 19, 309);
    x += 42;
  }

  ctx.textAlign = "left";
}

function highScoresForTab(state) {
  if (state.highScoreTab === "overall") {
    return state.highScores;
  }

  const playerCount = Number(state.highScoreTab);
  return state.highScores.filter((score) => score.players === playerCount);
}

function drawCenteredLines(ctx, text, x, y, lineHeight) {
  const lines = text.split("\n");
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let index = 0; index < lines.length; index += 1) {
    ctx.fillText(lines[index], x, startY + index * lineHeight);
  }
}

function drawTutorialText(ctx, state) {
  if (!state.tutorial.active || state.screen !== "playing") {
    return;
  }

  ctx.fillStyle = "rgba(21, 24, 31, 0.82)";
  ctx.fillRect(84, 82, 792, 54);
  ctx.strokeStyle = "#f7e06e";
  ctx.lineWidth = 3;
  ctx.strokeRect(84, 82, 792, 54);
  ctx.fillStyle = "#f7ead1";
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = "center";
  drawCenteredLines(ctx, state.tutorial.text, WORLD.width / 2, 110, 17);
  ctx.textAlign = "left";
}

function drawJuiceJar(ctx, state) {
  const x = 610;
  const y = 27;
  ctx.strokeStyle = "#f7ead1";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, 120, 28);
  ctx.fillStyle = "#8f3fa2";
  ctx.fillRect(x + 4, y + 4, 112, 20);
  ctx.fillStyle = "#f7ead1";
  ctx.font = `9px ${FONT}`;
  ctx.fillText(`${formatLiters(state.juice)} L`, x + 134, y + 14);
  ctx.font = `7px ${FONT}`;
  ctx.fillText(`${state.run.stolen}/${state.parameters.stolenLimit} stolen`, x + 134, y + 28);
}

function drawTopScore(ctx, state) {
  if (!state.highScores.length) {
    return;
  }

  const topScore = state.highScores[0];
  ctx.fillStyle = "#f7ead1";
  ctx.font = `7px ${FONT}`;
  ctx.fillText(`Best: ${topScore.name} ${topScore.scoreMl} ml`, 610, 67);
}

function drawPlayerStatus(ctx, state) {
  let x = 250;
  for (const player of state.players) {
    const controls = state.controls[player.controlIndex] || { name: player.controlName };
    ctx.fillStyle = player.color;
    ctx.fillRect(x, 31, 12, 12);
    ctx.fillStyle = "#f7ead1";
    ctx.font = `8px ${FONT}`;
    ctx.fillText(`P${player.id} ${controls.name}`, x + 17, 42);
    x += 112;
  }
}

function drawWrappedCenteredText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }

  lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let index = 0; index < lines.length; index += 1) {
    ctx.fillText(lines[index], x, startY + index * lineHeight);
  }
}

function formatLiters(ml) {
  return (Math.round(ml) / 1000).toFixed(1);
}
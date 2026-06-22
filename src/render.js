import { PLATFORMS, PRESS, WORLD } from "./config.js";
import { drawFrame, foxAnimations, playerAnimations, sprites } from "./sprites.js";

const FONT = '"Press Start 2P", monospace';

export function render(ctx, state) {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
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
    const fillWidth = ((vat.width - 16) * press.strokes) / PRESS.requiredStrokes;
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
      ctx.moveTo(fox.x + fox.width / 2, fox.y);
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
  ctx.fillStyle = "rgba(21, 24, 31, 0.78)";
  ctx.fillRect(16, 14, 928, 58);

  ctx.fillStyle = "#f7ead1";
  ctx.font = `16px ${FONT}`;
  ctx.fillText("VINEGUARD", 32, 40);
  ctx.font = `9px ${FONT}`;
  ctx.fillText('Song of Solomon 2:15 - "Catch the foxes for us..."', 32, 61);

  drawJuiceJar(ctx, state);
  drawPlayerStatus(ctx, state);
  drawBestRun(ctx, state);
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
  ctx.fillRect(x + 4, y + 4, ((112 * state.juice) / state.juiceGoal), 20);
  ctx.fillStyle = "#f7ead1";
  ctx.font = `9px ${FONT}`;
  ctx.fillText(`Juice ${state.juice}/${state.juiceGoal}`, x + 134, y + 19);
}

function drawBestRun(ctx, state) {
  if (!state.bestRun || state.bestRun.phase === 0) {
    return;
  }

  ctx.fillStyle = "#f7ead1";
  ctx.font = `7px ${FONT}`;
  ctx.fillText(`Best P${state.bestRun.players}: phase ${state.bestRun.phase}, juice ${state.bestRun.juice}`, 610, 67);
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
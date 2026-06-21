const FRAME_SIZE = 32;

function image(src) {
  const sprite = new Image();
  sprite.src = src;
  return sprite;
}

export const sprites = {
  frameSize: FRAME_SIZE,
  players: [
    image("src/assets/generated/player_1_male_red.png"),
    image("src/assets/generated/player_2_female_blue.png"),
    image("src/assets/generated/player_3_male_gold.png"),
    image("src/assets/generated/player_4_female_green.png"),
  ],
  fox: image("src/assets/fox_sprite_sheet_by_elthlen.png"),
};

export const playerAnimations = {
  idle: { row: 0, frames: [0, 1, 2, 3], fps: 4 },
  run: { row: 1, frames: [0, 1, 2, 3, 4, 5], fps: 8 },
  jump: { row: 3, frames: [0], fps: 1 },
};

export const foxAnimations = {
  run: { row: 0, frames: [0, 1, 2, 3, 4, 5], fps: 9 },
  flee: { row: 1, frames: [0, 1, 2, 3, 4, 5], fps: 12 },
};

export function drawFrame(ctx, sheet, animation, time, x, y, width, height, flip = false) {
  if (!sheet.complete || sheet.naturalWidth === 0) {
    return false;
  }

  const frameIndex = Math.floor(time * animation.fps) % animation.frames.length;
  const column = animation.frames[frameIndex];
  const sourceX = column * FRAME_SIZE;
  const sourceY = animation.row * FRAME_SIZE;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (flip) {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, sourceX, sourceY, FRAME_SIZE, FRAME_SIZE, 0, 0, width, height);
  } else {
    ctx.drawImage(sheet, sourceX, sourceY, FRAME_SIZE, FRAME_SIZE, x, y, width, height);
  }

  ctx.restore();
  return true;
}
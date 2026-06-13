import type { GameState } from './types';
import { toScreen } from './iso';
import {
  TILE_W,
  TILE_H,
  CANVAS_W,
  CANVAS_H,
  WORLD_W,
  WORLD_H,
  SHORE_Y,
} from './constants';

const GROUND_COLOR = '#7cb342';
const GROUND_ALT = '#689f38';
const WATER_COLOR = 'rgba(21, 101, 192, 0.6)';
const DEEP_WATER = 'rgba(13, 71, 161, 0.8)';
const PLAYER_COLOR = '#e65100';
const PLAYER_OUTLINE = '#bf360c';
const ROD_COLOR = '#5d4037';
const LINE_COLOR = '#bdbdbd';
const BOBBER_TOP = '#f44336';
const BOBBER_BOT = '#eeeeee';

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawBackground(ctx);

  // Collect drawables for depth sorting
  const drawables: { y: number; draw: () => void }[] = [];

  // Fish
  for (const f of state.fish) {
    drawables.push({ y: f.position.y, draw: () => drawFish(ctx, state, f) });
  }

  // Player
  drawables.push({
    y: state.player.position.y,
    draw: () => drawPlayer(ctx, state),
  });

  // Bobber
  if (state.rod.bobberPosition) {
    drawables.push({
      y: state.rod.bobberPosition.y,
      draw: () => {
        drawRodLine(ctx, state);
        drawBobber(ctx, state);
      },
    });
  }

  // Sort by Y (far to near)
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) {
    d.draw();
  }
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const { x: sx, y: sy } = toScreen(x, y);
      const cx = sx;
      const cy = sy - TILE_H / 2;

      if (y <= SHORE_Y) {
        ctx.fillStyle = (x + y) % 2 === 0 ? GROUND_COLOR : GROUND_ALT;
      } else {
        ctx.fillStyle = y < 8 ? WATER_COLOR : DEEP_WATER;
      }

      // Draw isometric tile
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + TILE_W / 2, cy + TILE_H / 2);
      ctx.lineTo(cx, cy + TILE_H);
      ctx.lineTo(cx - TILE_W / 2, cy + TILE_H / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.stroke();
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { x: sx, y: sy } = toScreen(
    state.player.position.x,
    state.player.position.y
  );

  // Body
  ctx.fillStyle = PLAYER_COLOR;
  ctx.beginPath();
  ctx.ellipse(sx, sy - 8, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PLAYER_OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Head
  ctx.fillStyle = '#ffcc80';
  ctx.beginPath();
  ctx.arc(sx, sy - 22, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rod in hand — convert world-space aim direction to screen space
  const rodAngle = state.rod.angle;
  const worldAimX = state.player.position.x + Math.cos(rodAngle);
  const worldAimY = state.player.position.y + Math.sin(rodAngle);
  const screenPlayer = toScreen(state.player.position.x, state.player.position.y);
  const screenAim = toScreen(worldAimX, worldAimY);
  const screenRodAngle = Math.atan2(screenAim.y - screenPlayer.y, screenAim.x - screenPlayer.x);
  const rodLen = 20;
  const rodStartX = sx + Math.cos(screenRodAngle) * 5;
  const rodStartY = sy - 18 + Math.sin(screenRodAngle) * 5;
  const rodEndX = rodStartX + Math.cos(screenRodAngle) * rodLen;
  const rodEndY = rodStartY + Math.sin(screenRodAngle) * rodLen;

  ctx.strokeStyle = ROD_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rodStartX, rodStartY);
  ctx.lineTo(rodEndX, rodEndY);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawFish(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  fish: { position: { x: number; y: number }; typeIndex: number }
): void {
  const { x: sx, y: sy } = toScreen(fish.position.x, fish.position.y);
  const type = state.fishTypes[fish.typeIndex];
  const size = type.size;

  // Fish body (ellipse)
  ctx.fillStyle = type.color;
  ctx.beginPath();
  ctx.ellipse(sx, sy, size, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail (triangle)
  ctx.beginPath();
  ctx.moveTo(sx - size, sy);
  ctx.lineTo(sx - size - 5, sy - 4);
  ctx.lineTo(sx - size - 5, sy + 4);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(sx + size * 0.4, sy - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawRodLine(ctx: CanvasRenderingContext2D, state: GameState): void {
  const player = toScreen(state.player.position.x, state.player.position.y);
  const bobber = state.rod.bobberPosition;
  if (!bobber) return;
  const bPos = toScreen(bobber.x, bobber.y);

  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 18);
  ctx.lineTo(bPos.x, bPos.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBobber(ctx: CanvasRenderingContext2D, state: GameState): void {
  const bobber = state.rod.bobberPosition;
  if (!bobber) return;
  const { x, y } = toScreen(bobber.x, bobber.y);

  // Bobber body
  ctx.fillStyle = BOBBER_TOP;
  ctx.beginPath();
  ctx.arc(x, y - 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BOBBER_BOT;
  ctx.beginPath();
  ctx.arc(x, y + 1, 5, 0, Math.PI * 2);
  ctx.fill();

  // Splash effect when bobber lands
  if (state.rod.splashTimer > 0) {
    const t = state.rod.splashTimer / 0.6; // 0..1
    for (let i = 0; i < 3; i++) {
      const radius = (8 + i * 10) * (1 - t) + (20 + i * 15) * t;
      const alpha = t * 0.5;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.5 - i * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  // Hook indicator when fish is near
  if (state.rod.hookedFishId !== null) {
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

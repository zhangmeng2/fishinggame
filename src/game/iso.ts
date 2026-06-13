import type { Vector2 } from './types';
import { TILE_W, TILE_H, CANVAS_W } from './constants';

export function toScreen(wx: number, wy: number): Vector2 {
  return {
    x: (wx - wy) * (TILE_W / 2) + CANVAS_W / 2,
    y: (wx + wy) * (TILE_H / 2) + 60,
  };
}

export function toWorld(sx: number, sy: number): Vector2 {
  const ox = sx - CANVAS_W / 2;
  const oy = sy - 60;
  return {
    x: ox / TILE_W + oy / TILE_H,
    y: oy / TILE_H - ox / TILE_W,
  };
}

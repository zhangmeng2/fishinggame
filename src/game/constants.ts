export const TILE_W = 64;
export const TILE_H = 32;
export const CANVAS_W = 800;
export const CANVAS_H = 600;
export const PLAYER_SPEED = 120;
export const CAST_SPEED = 500;
export const HOOK_RADIUS = 25;
export const WORLD_W = 15;
export const WORLD_H = 15;
export const SHORE_Y = 4;
export const WATER_START_Y = 5;
export const FISH_SPAWN_Y_MIN = 7;
export const FISH_SPAWN_Y_MAX = 13;
export const FISH_SPAWN_INTERVAL = 2.0;
export const MAX_FISH = 8;
export const PLAYER_MIN_X = 0.5;
export const PLAYER_MAX_X = 14.5;
export const PLAYER_MIN_Y = 0.5;
export const PLAYER_MAX_Y = 4.5;

export const FISH_TYPES = [
  { name: '鲫鱼', color: '#c0c0c0', score: 10, speed: 50, size: 8, spawnWeight: 10 },
  { name: '鲤鱼', color: '#e8a020', score: 30, speed: 70, size: 12, spawnWeight: 5 },
  { name: '草鱼', color: '#4a8c3f', score: 50, speed: 90, size: 14, spawnWeight: 2 },
];

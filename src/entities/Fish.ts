import type { FishInstance, FishType } from '../game/types';
import {
  FISH_SPAWN_Y_MIN,
  FISH_SPAWN_Y_MAX,
  WORLD_W,
  FISH_SPAWN_INTERVAL,
  MAX_FISH,
} from '../game/constants';

export function createFish(id: number, types: FishType[]): FishInstance {
  const typeIndex = weightedRandom(types);
  return {
    id,
    typeIndex,
    position: {
      x: 1 + Math.random() * (WORLD_W - 2),
      y: FISH_SPAWN_Y_MIN + Math.random() * (FISH_SPAWN_Y_MAX - FISH_SPAWN_Y_MIN),
    },
    direction: Math.random() * Math.PI * 2,
    changeTimer: 2 + Math.random() * 4,
  };
}

export function updateFish(
  fish: FishInstance[],
  types: FishType[],
  dt: number,
  fishTimer: number,
  nextFishId: number
): { newFish: FishInstance | null; nextId: number; newTimer: number } {
  let timer = fishTimer - dt;
  let nextId = nextFishId;
  let newFish: FishInstance | null = null;

  if (timer <= 0 && fish.length < MAX_FISH) {
    newFish = createFish(nextId, types);
    nextId++;
    timer = FISH_SPAWN_INTERVAL;
  }

  for (const f of fish) {
    f.changeTimer -= dt;
    if (f.changeTimer <= 0) {
      f.direction = Math.random() * Math.PI * 2;
      f.changeTimer = 2 + Math.random() * 4;
    }
    const speed = types[f.typeIndex].speed;
    f.position.x = clamp(
      f.position.x + Math.cos(f.direction) * speed * dt,
      1, WORLD_W - 1
    );
    f.position.y = clamp(
      f.position.y + Math.sin(f.direction) * speed * dt,
      FISH_SPAWN_Y_MIN, FISH_SPAWN_Y_MAX
    );
  }

  return { newFish, nextId, newTimer: timer };
}

function weightedRandom(types: FishType[]): number {
  const total = types.reduce((sum, t) => sum + t.spawnWeight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < types.length; i++) {
    r -= types[i].spawnWeight;
    if (r <= 0) return i;
  }
  return types.length - 1;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

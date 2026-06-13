import type { PlayerState, InputState } from '../game/types';
import { getMovement } from '../game/input';
import {
  PLAYER_SPEED,
  PLAYER_MIN_X,
  PLAYER_MAX_X,
  PLAYER_MIN_Y,
  PLAYER_MAX_Y,
} from '../game/constants';

export function createPlayer(): PlayerState {
  return { position: { x: 7, y: 2 } };
}

export function updatePlayer(
  player: PlayerState,
  input: InputState,
  dt: number
): void {
  const move = getMovement(input);
  if (move.x === 0 && move.y === 0) return;

  player.position.x = clamp(
    player.position.x + move.x * PLAYER_SPEED * dt,
    PLAYER_MIN_X,
    PLAYER_MAX_X
  );
  player.position.y = clamp(
    player.position.y + move.y * PLAYER_SPEED * dt,
    PLAYER_MIN_Y,
    PLAYER_MAX_Y
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

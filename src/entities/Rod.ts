import type { RodState, InputState, FishInstance } from '../game/types';
import { GamePhase } from '../game/types';
import { CAST_SPEED, HOOK_RADIUS } from '../game/constants';

export function createRod(): RodState {
  return {
    phase: GamePhase.IDLE,
    angle: 0,
    bobberPosition: null,
    castTarget: null,
    castProgress: 0,
    hookedFishId: null,
  };
}

export function updateRod(
  rod: RodState,
  input: InputState,
  playerPos: { x: number; y: number },
  fish: FishInstance[],
  dt: number
): { caughtFishId: number | null } {
  switch (rod.phase) {
    case GamePhase.IDLE: {
      rod.angle = Math.atan2(
        input.mouseWorldPos.y - playerPos.y,
        input.mouseWorldPos.x - playerPos.x
      );
      rod.phase = GamePhase.AIMING;
      break;
    }
    case GamePhase.AIMING: {
      rod.angle = Math.atan2(
        input.mouseWorldPos.y - playerPos.y,
        input.mouseWorldPos.x - playerPos.x
      );
      if (input.mouseClicked) {
        const castDist = 8;
        rod.castTarget = {
          x: playerPos.x + Math.cos(rod.angle) * castDist,
          y: playerPos.y + Math.sin(rod.angle) * castDist,
        };
        rod.bobberPosition = { ...playerPos };
        rod.castProgress = 0;
        rod.hookedFishId = null;
        rod.phase = GamePhase.CASTING;
      }
      break;
    }
    case GamePhase.CASTING: {
      if (!rod.bobberPosition || !rod.castTarget) break;
      const dx = rod.castTarget.x - rod.bobberPosition.x;
      const dy = rod.castTarget.y - rod.bobberPosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = CAST_SPEED * dt;

      if (dist < step) {
        rod.bobberPosition = { ...rod.castTarget };
        rod.castProgress = 1;
        rod.phase = GamePhase.WAITING;
      } else {
        rod.bobberPosition.x += (dx / dist) * step;
        rod.bobberPosition.y += (dy / dist) * step;
        rod.castProgress += step / 8;
      }
      break;
    }
    case GamePhase.WAITING: {
      if (!rod.bobberPosition) break;

      // Check for fish near bobber
      rod.hookedFishId = null;
      for (const f of fish) {
        const dx = f.position.x - rod.bobberPosition.x;
        const dy = f.position.y - rod.bobberPosition.y;
        if (dx * dx + dy * dy < HOOK_RADIUS * HOOK_RADIUS) {
          rod.hookedFishId = f.id;
          break;
        }
      }

      if (input.mouseClicked) {
        const caught = rod.hookedFishId;
        rod.phase = GamePhase.IDLE;
        rod.bobberPosition = null;
        rod.castTarget = null;
        rod.hookedFishId = null;
        return { caughtFishId: caught };
      }
      break;
    }
  }
  return { caughtFishId: null };
}

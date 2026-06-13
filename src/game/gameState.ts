import { GameState, InputState } from './types';
import { FISH_TYPES, FISH_SPAWN_INTERVAL } from './constants';
import { createPlayer, updatePlayer } from '../entities/Player';
import { createRod, updateRod } from '../entities/Rod';
import { updateFish } from '../entities/Fish';

export function createInitialState(): GameState {
  return {
    player: createPlayer(),
    rod: createRod(),
    fish: [],
    score: 0,
    highScore: 0,
    fishTypes: FISH_TYPES,
    nextFishId: 1,
    fishTimer: 1.0,
  };
}

export function updateGameState(
  state: GameState,
  input: InputState,
  dt: number
): void {
  updatePlayer(state.player, input, dt);

  const fishResult = updateFish(
    state.fish,
    state.fishTypes,
    dt,
    state.fishTimer,
    state.nextFishId
  );
  state.fishTimer = fishResult.newTimer;
  state.nextFishId = fishResult.nextId;
  if (fishResult.newFish) {
    state.fish.push(fishResult.newFish);
  }

  const rodResult = updateRod(
    state.rod,
    input,
    state.player.position,
    state.fish,
    dt
  );

  if (rodResult.caughtFishId !== null) {
    const idx = state.fish.findIndex((f) => f.id === rodResult.caughtFishId);
    if (idx !== -1) {
      const type = state.fishTypes[state.fish[idx].typeIndex];
      state.score += type.score;
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
      state.fish.splice(idx, 1);
    }
  }

  input.mouseClicked = false;
}

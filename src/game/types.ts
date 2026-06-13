export interface Vector2 {
  x: number;
  y: number;
}

export const GamePhase = {
  IDLE: 'IDLE',
  AIMING: 'AIMING',
  CASTING: 'CASTING',
  WAITING: 'WAITING',
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export interface FishType {
  name: string;
  color: string;
  score: number;
  speed: number;
  size: number;
  spawnWeight: number;
}

export interface FishInstance {
  id: number;
  typeIndex: number;
  position: Vector2;
  direction: number;
  changeTimer: number;
}

export interface PlayerState {
  position: Vector2;
}

export interface RodState {
  phase: GamePhase;
  angle: number;
  bobberPosition: Vector2 | null;
  castTarget: Vector2 | null;
  castProgress: number;
  hookedFishId: number | null;
}

export interface GameState {
  player: PlayerState;
  rod: RodState;
  fish: FishInstance[];
  score: number;
  highScore: number;
  fishTypes: FishType[];
  nextFishId: number;
  fishTimer: number;
}

export interface InputState {
  keysDown: Set<string>;
  mouseWorldPos: Vector2;
  mouseClicked: boolean;
}

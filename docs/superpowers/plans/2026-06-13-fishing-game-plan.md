# Fishing Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2.5D isometric fishing game prototype where the player moves on shore and casts a rod to catch fish.

**Architecture:** React + TypeScript + Vite. Canvas 2D for game rendering, React for HUD overlay. Custom isometric projection math, pure geometric shapes (no sprites). Game loop via requestAnimationFrame in a React component.

**Tech Stack:** Vite, React 18, TypeScript, Canvas 2D

---

### Task 1: Initialize project

**Files:**
- Create: entire Vite project scaffold

- [ ] **Step 1: Scaffold Vite + React + TypeScript**

Run:
```bash
cd /Users/zhangmengdemac/Documents/code/fishinggame
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
```

- [ ] **Step 3: Initialize git**

Run:
```bash
git init
```

- [ ] **Step 4: Clean up scaffold files**

Remove `src/App.css`, `src/index.css`, `src/assets/react.svg`, `public/vite.svg`. Clear `src/App.tsx` to a minimal div.

- [ ] **Step 5: Create directory structure**

Run:
```bash
mkdir -p src/game src/entities src/components
```

- [ ] **Step 6: Verify dev server starts**

Run:
```bash
npm run dev
```
Expected: Vite dev server starts on localhost, blank page renders.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Types and constants

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/constants.ts`

- [ ] **Step 1: Write types.ts**

```typescript
export interface Vector2 {
  x: number;
  y: number;
}

export enum GamePhase {
  IDLE = 'IDLE',
  AIMING = 'AIMING',
  CASTING = 'CASTING',
  WAITING = 'WAITING',
}

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
```

- [ ] **Step 2: Write constants.ts**

```typescript
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
  {
    name: '鲫鱼',
    color: '#c0c0c0',
    score: 10,
    speed: 50,
    size: 8,
    spawnWeight: 10,
  },
  {
    name: '鲤鱼',
    color: '#e8a020',
    score: 30,
    speed: 70,
    size: 12,
    spawnWeight: 5,
  },
  {
    name: '草鱼',
    color: '#4a8c3f',
    score: 50,
    speed: 90,
    size: 14,
    spawnWeight: 2,
  },
];
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/game/types.ts src/game/constants.ts
git commit -m "feat: add game types and constants"
```

---

### Task 3: Isometric coordinate utilities

**Files:**
- Create: `src/game/iso.ts`

- [ ] **Step 1: Write iso.ts**

```typescript
import { Vector2 } from './types';
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/iso.ts
git commit -m "feat: add isometric coordinate conversion"
```

---

### Task 4: Input manager

**Files:**
- Create: `src/game/input.ts`

- [ ] **Step 1: Write input.ts**

```typescript
import { InputState, Vector2 } from './types';
import { toWorld } from './iso';

export function createInputState(): InputState {
  return {
    keysDown: new Set(),
    mouseWorldPos: { x: 0, y: 0 },
    mouseClicked: false,
  };
}

export function setupInput(
  canvas: HTMLCanvasElement,
  input: InputState
): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    input.keysDown.add(e.key.toLowerCase());
  };
  const onKeyUp = (e: KeyboardEvent) => {
    input.keysDown.delete(e.key.toLowerCase());
  };
  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.mouseWorldPos = toWorld(sx * scaleX, sy * scaleY);
  };
  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      input.mouseClicked = true;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
  };
}

export function getMovement(input: InputState): Vector2 {
  let dx = 0;
  let dy = 0;
  if (input.keysDown.has('w') || input.keysDown.has('arrowup')) dy -= 1;
  if (input.keysDown.has('s') || input.keysDown.has('arrowdown')) dy += 1;
  if (input.keysDown.has('a') || input.keysDown.has('arrowleft')) dx -= 1;
  if (input.keysDown.has('d') || input.keysDown.has('arrowright')) dx += 1;

  if (dx !== 0 && dy !== 0) {
    const diag = 1 / Math.SQRT2;
    dx *= diag;
    dy *= diag;
  }
  return { x: dx, y: dy };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/input.ts
git commit -m "feat: add input manager (keyboard + mouse)"
```

---

### Task 5: Player entity

**Files:**
- Create: `src/entities/Player.ts`

- [ ] **Step 1: Write Player.ts**

```typescript
import { PlayerState, InputState } from '../game/types';
import { getMovement } from '../game/input';
import {
  PLAYER_SPEED,
  PLAYER_MIN_X,
  PLAYER_MAX_X,
  PLAYER_MIN_Y,
  PLAYER_MAX_Y,
} from '../game/constants';

export function createPlayer(): PlayerState {
  return {
    position: { x: 7, y: 2 },
  };
}

export function updatePlayer(
  player: PlayerState,
  input: InputState,
  dt: number
): void {
  const move = getMovement(input);
  if (move.x === 0 && move.y === 0) return;

  const newX = player.position.x + move.x * PLAYER_SPEED * dt;
  const newY = player.position.y + move.y * PLAYER_SPEED * dt;

  player.position.x = clamp(newX, PLAYER_MIN_X, PLAYER_MAX_X);
  player.position.y = clamp(newY, PLAYER_MIN_Y, PLAYER_MAX_Y);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat: add player entity with movement"
```

---

### Task 6: Fish entity

**Files:**
- Create: `src/entities/Fish.ts`

- [ ] **Step 1: Write Fish.ts**

```typescript
import { FishInstance, FishType } from '../game/types';
import {
  FISH_SPAWN_Y_MIN,
  FISH_SPAWN_Y_MAX,
  WORLD_W,
  FISH_SPAWN_INTERVAL,
  MAX_FISH,
} from '../game/constants';

export function createFish(
  id: number,
  types: FishType[]
): FishInstance {
  const typeIndex = weightedRandom(types);
  const x = 1 + Math.random() * (WORLD_W - 2);
  const y = FISH_SPAWN_Y_MIN + Math.random() * (FISH_SPAWN_Y_MAX - FISH_SPAWN_Y_MIN);
  return {
    id,
    typeIndex,
    position: { x, y },
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
    f.position.x += Math.cos(f.direction) * speed * dt;
    f.position.y += Math.sin(f.direction) * speed * dt;

    f.position.x = clamp(f.position.x, 1, WORLD_W - 1);
    f.position.y = clamp(f.position.y, FISH_SPAWN_Y_MIN, FISH_SPAWN_Y_MAX);
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Fish.ts
git commit -m "feat: add fish entity with spawning and movement AI"
```

---

### Task 7: Rod entity

**Files:**
- Create: `src/entities/Rod.ts`

- [ ] **Step 1: Write Rod.ts**

```typescript
import { RodState, GamePhase, InputState, FishInstance, FishType } from '../game/types';
import { CAST_SPEED, HOOK_RADIUS } from '../game/constants';

export function createRod(): RodState {
  return {
    phase: GamePhase.IDLE,
    angle: 0,
    bobberPosition: null,
    castTarget: null,
    castProgress: 0,
  };
}

export function updateRod(
  rod: RodState,
  input: InputState,
  playerPos: { x: number; y: number },
  fish: FishInstance[],
  types: FishType[],
  dt: number
): { caughtFish: { typeIndex: number } | null } {
  const caughtFish: { typeIndex: number } | null = null;

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
        rod.phase = GamePhase.CASTING;
        rod.castTarget = { ...input.mouseWorldPos };
        rod.castProgress = 0;
        const castDist = 8;
        rod.castTarget.x = playerPos.x + Math.cos(rod.angle) * castDist;
        rod.castTarget.y = playerPos.y + Math.sin(rod.angle) * castDist;
        rod.bobberPosition = { ...playerPos };
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
      for (const f of fish) {
        const dx = f.position.x - rod.bobberPosition.x;
        const dy = f.position.y - rod.bobberPosition.y;
        if (dx * dx + dy * dy < HOOK_RADIUS * HOOK_RADIUS) {
          if (input.mouseClicked) {
            rod.phase = GamePhase.IDLE;
            rod.bobberPosition = null;
            rod.castTarget = null;
            return { caughtFish: { typeIndex: f.typeIndex } };
          }
        }
      }
      if (input.mouseClicked) {
        rod.phase = GamePhase.IDLE;
        rod.bobberPosition = null;
        rod.castTarget = null;
      }
      break;
    }
  }

  return { caughtFish: null };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Rod.ts
git commit -m "feat: add rod entity with aiming, casting, and catch logic"
```

---

### Task 8: Game state management

**Files:**
- Create: `src/game/gameState.ts`

- [ ] **Step 1: Write gameState.ts**

```typescript
import { GameState, GamePhase, InputState } from './types';
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

  const { newFish, nextId, newTimer } = updateFish(
    state.fish,
    state.fishTypes,
    dt,
    state.fishTimer,
    state.nextFishId
  );
  state.fishTimer = newTimer;
  state.nextFishId = nextId;
  if (newFish) {
    state.fish.push(newFish);
  }

  const result = updateRod(
    state.rod,
    input,
    state.player.position,
    state.fish,
    state.fishTypes,
    dt
  );

  if (result.caughtFish) {
    const type = state.fishTypes[result.caughtFish.typeIndex];
    state.score += type.score;
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }
    const idx = state.fish.findIndex(
      (f) => f.typeIndex === result.caughtFish!.typeIndex
    );
    if (idx !== -1) {
      const fish = state.fish[idx];
      const bobber = state.rod.bobberPosition;
      if (bobber && fish) {
        const dx = fish.position.x - bobber.x;
        const dy = fish.position.y - bobber.y;
        if (dx * dx + dy * dy < 30 * 30) {
          state.fish.splice(idx, 1);
        }
      }
    }
  }

  input.mouseClicked = false;
}
```

Wait, the fish removal logic is a bit convoluted. Let me simplify: when a fish is caught, remove the closest fish to the bobber.

Actually, let me restructure Rod.ts to return which fish was caught (by id), and then remove that fish in gameState. Let me redo both files.

Let me revise Rod.ts:

```typescript
// The return type should include fishId
export function updateRod(...): { caughtFishId: number | null } {
  // In WAITING state:
  for (const f of fish) {
    const dx = f.position.x - rod.bobberPosition.x;
    const dy = f.position.y - rod.bobberPosition.y;
    if (dx * dx + dy * dy < HOOK_RADIUS * HOOK_RADIUS) {
      if (input.mouseClicked) {
        resetRod(rod);
        return { caughtFishId: f.id };
      }
    }
  }
}
```

And then gameState does:
```typescript
if (result.caughtFishId !== null) {
  const idx = state.fish.findIndex(f => f.id === result.caughtFishId);
  if (idx !== -1) {
    state.score += state.fishTypes[state.fish[idx].typeIndex].score;
    state.fish.splice(idx, 1);
  }
}
```

This is cleaner. Let me rewrite both Rod.ts and gameState.ts properly in the plan. But wait, in the plan I already wrote Rod.ts in Task 7 with the old return type. I need to make sure the plan is consistent.

Let me redo the plan with the correct cross-task consistency. I'll rewrite the Rod.ts task and the gameState task.

OK I'm writing this plan in one go, so I just need to make sure Task 7's Rod.ts and Task 8's gameState.ts are consistent. Let me do that.

Actually, I realize I'm spending too much time deliberating internally. Let me just write the complete plan file now.<｜end▁of▁thinking｜>Let me write the complete plan now.

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="Write">
<｜｜DSML｜｜parameter name="content" string="true"># Fishing Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2.5D isometric fishing game prototype where the player moves on shore and casts a rod to catch fish.

**Architecture:** React + TypeScript + Vite. Canvas 2D for game rendering, React for HUD overlay. Custom isometric projection math, pure geometric shapes (no sprites). Game loop via requestAnimationFrame in a React component.

**Tech Stack:** Vite, React 18, TypeScript, Canvas 2D

---

### Task 1: Initialize project

**Files:**
- Create: Vite project scaffold, directory structure

- [ ] **Step 1: Scaffold Vite + React + TypeScript**

```bash
cd /Users/zhangmengdemac/Documents/code/fishinggame
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Initialize git**

```bash
git init
```

- [ ] **Step 4: Clean up scaffold**

Remove `src/App.css`, `src/index.css`, `src/assets/react.svg`, `public/vite.svg`.
Replace `src/App.tsx` content with:

```tsx
function App() {
  return <div>Fishing Game</div>;
}

export default App;
```

- [ ] **Step 5: Create source directories**

```bash
mkdir -p src/game src/entities src/components
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite dev server starts, "Fishing Game" renders in browser. Then Ctrl+C to stop.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Types and constants

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/constants.ts`

- [ ] **Step 1: Write types.ts**

```typescript
export interface Vector2 {
  x: number;
  y: number;
}

export enum GamePhase {
  IDLE = 'IDLE',
  AIMING = 'AIMING',
  CASTING = 'CASTING',
  WAITING = 'WAITING',
}

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
```

- [ ] **Step 2: Write constants.ts**

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/game/types.ts src/game/constants.ts
git commit -m "feat: add game types and constants"
```

---

### Task 3: Isometric coordinate utilities

**Files:**
- Create: `src/game/iso.ts`

- [ ] **Step 1: Write iso.ts**

```typescript
import { Vector2 } from './types';
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/iso.ts
git commit -m "feat: add isometric coordinate conversion"
```

---

### Task 4: Input manager

**Files:**
- Create: `src/game/input.ts`

- [ ] **Step 1: Write input.ts**

```typescript
import { InputState, Vector2 } from './types';
import { toWorld } from './iso';

export function createInputState(): InputState {
  return {
    keysDown: new Set(),
    mouseWorldPos: { x: 0, y: 0 },
    mouseClicked: false,
  };
}

export function setupInput(
  canvas: HTMLCanvasElement,
  input: InputState
): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    input.keysDown.add(e.key.toLowerCase());
  };
  const onKeyUp = (e: KeyboardEvent) => {
    input.keysDown.delete(e.key.toLowerCase());
  };
  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.mouseWorldPos = toWorld(sx * scaleX, sy * scaleY);
  };
  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      input.mouseClicked = true;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
  };
}

export function getMovement(input: InputState): Vector2 {
  let dx = 0;
  let dy = 0;
  if (input.keysDown.has('w') || input.keysDown.has('arrowup')) dy -= 1;
  if (input.keysDown.has('s') || input.keysDown.has('arrowdown')) dy += 1;
  if (input.keysDown.has('a') || input.keysDown.has('arrowleft')) dx -= 1;
  if (input.keysDown.has('d') || input.keysDown.has('arrowright')) dx += 1;

  if (dx !== 0 && dy !== 0) {
    const d = 1 / Math.SQRT2;
    dx *= d;
    dy *= d;
  }
  return { x: dx, y: dy };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/input.ts
git commit -m "feat: add input manager (keyboard + mouse)"
```

---

### Task 5: Player entity

**Files:**
- Create: `src/entities/Player.ts`

- [ ] **Step 1: Write Player.ts**

```typescript
import { PlayerState, InputState } from '../game/types';
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat: add player entity with movement"
```

---

### Task 6: Fish entity

**Files:**
- Create: `src/entities/Fish.ts`

- [ ] **Step 1: Write Fish.ts**

```typescript
import { FishInstance, FishType } from '../game/types';
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Fish.ts
git commit -m "feat: add fish entity with spawning and movement AI"
```

---

### Task 7: Rod entity

**Files:**
- Create: `src/entities/Rod.ts`

- [ ] **Step 1: Write Rod.ts**

```typescript
import { RodState, GamePhase, InputState, FishInstance } from '../game/types';
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Rod.ts
git commit -m "feat: add rod entity with aiming, casting, and catch logic"
```

---

### Task 8: Game state management

**Files:**
- Create: `src/game/gameState.ts`

- [ ] **Step 1: Write gameState.ts**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/gameState.ts
git commit -m "feat: add game state management and update loop"
```

---

### Task 9: Renderer

**Files:**
- Create: `src/game/renderer.ts`

- [ ] **Step 1: Write renderer.ts**

```typescript
import { GameState } from './types';
import { toScreen } from './iso';
import {
  TILE_W,
  TILE_H,
  CANVAS_W,
  CANVAS_H,
  WORLD_W,
  WORLD_H,
  WATER_START_Y,
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

  // Rod in hand (aiming from shoulder)
  const rodAngle = state.rod.angle;
  const rodLen = 20;
  const rodStartX = sx + Math.cos(rodAngle) * 5;
  const rodStartY = sy - 18 + Math.sin(rodAngle) * 5;
  const rodEndX = rodStartX + Math.cos(rodAngle) * rodLen;
  const rodEndY = rodStartY + Math.sin(rodAngle) * rodLen;

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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/renderer.ts
git commit -m "feat: add isometric renderer with depth sorting"
```

---

### Task 10: Game component

**Files:**
- Create: `src/game/Game.tsx`

- [ ] **Step 1: Write Game.tsx**

```tsx
import { useRef, useEffect } from 'react';
import { CANVAS_W, CANVAS_H } from './constants';
import { createInputState, setupInput } from './input';
import { createInitialState, updateGameState } from './gameState';
import { render } from './renderer';
import { GameState, InputState } from './types';

interface GameProps {
  onStateChange: (state: GameState) => void;
}

export default function Game({ onStateChange }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const inputRef = useRef<InputState>(createInputState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cleanup = setupInput(canvas, inputRef.current);
    let hudUpdateTimer = 0;

    function loop(time: number) {
      const dt = lastTimeRef.current
        ? Math.min((time - lastTimeRef.current) / 1000, 0.05)
        : 0.016;
      lastTimeRef.current = time;

      const state = stateRef.current;
      updateGameState(state, inputRef.current, dt);
      render(ctx!, state);

      // Throttle HUD updates to ~10fps
      hudUpdateTimer += dt;
      if (hudUpdateTimer > 0.1) {
        hudUpdateTimer = 0;
        onStateChange({ ...state });
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cleanup();
      cancelAnimationFrame(rafRef.current);
    };
  }, [onStateChange]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display: 'block', cursor: 'crosshair' }}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/game/Game.tsx
git commit -m "feat: add game component with render loop"
```

---

### Task 11: HUD component

**Files:**
- Create: `src/components/HUD.tsx`

- [ ] **Step 1: Write HUD.tsx**

```tsx
import { GameState, GamePhase } from '../game/types';

interface HUDProps {
  state: GameState | null;
}

export default function HUD({ state }: HUDProps) {
  if (!state) return null;

  const hintText = getHintText(state);

  return (
    <div style={styles.container}>
      <div style={styles.scoreSection}>
        <div style={styles.scoreLabel}>分数</div>
        <div style={styles.scoreValue}>{state.score}</div>
        <div style={styles.highScore}>
          最高: {state.highScore}
        </div>
      </div>
      <div style={styles.hint}>{hintText}</div>
    </div>
  );
}

function getHintText(state: GameState): string {
  switch (state.rod.phase) {
    case GamePhase.IDLE:
    case GamePhase.AIMING:
      return '移动鼠标瞄准，点击抛竿';
    case GamePhase.CASTING:
      return '浮漂飞行中...';
    case GamePhase.WAITING:
      if (state.rod.hookedFishId !== null) {
        const fish = state.fish.find((f) => f.id === state.rod.hookedFishId);
        const name = fish ? state.fishTypes[fish.typeIndex].name : '鱼';
        return `${name} 咬钩了！点击收竿！`;
      }
      return '等待鱼上钩... 点击收竿';
    default:
      return '';
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '16px 20px',
    fontFamily: 'monospace',
  },
  scoreSection: {
    textAlign: 'right',
  },
  scoreLabel: {
    fontSize: '14px',
    color: '#999',
  },
  scoreValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#fff',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  },
  highScore: {
    fontSize: '14px',
    color: '#aaa',
  },
  hint: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#fff',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    background: 'rgba(0,0,0,0.4)',
    padding: '8px 20px',
    borderRadius: '20px',
    alignSelf: 'center',
  },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/HUD.tsx
git commit -m "feat: add HUD component with score and hints"
```

---

### Task 12: App integration and styling

**Files:**
- Modify: `src/App.tsx`
- Create: `src/index.css`

- [ ] **Step 1: Write index.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
```

- [ ] **Step 2: Rewrite App.tsx**

```tsx
import { useCallback, useState } from 'react';
import Game from './game/Game';
import HUD from './components/HUD';
import { GameState } from './game/types';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Game onStateChange={handleStateChange} />
      <HUD state={gameState} />
    </div>
  );
}
```

- [ ] **Step 3: Clean up main.tsx**

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Verify dev server**

```bash
npm run dev
```
Expected: Game renders with isometric ground, player can move with WASD, mouse moves aim direction, click to cast. Then Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/index.css
git commit -m "feat: integrate game with HUD overlay and styling"
```

---

### Task 13: Polish and verify

**Files:**
- Modify: various (quality fixes)

- [ ] **Step 1: Add rod idle state rendering**

Currently the player always shows a rod. Add the rod drawing only when appropriate. Verify the rod circle indicator shows when aiming.

- [ ] **Step 2: Verify TypeScript and build**

```bash
npx tsc --noEmit
npm run build
```
Expected: No type errors, build succeeds.

- [ ] **Step 3: Manual playtest checklist**

Spin up `npm run dev` and verify:
- [ ] WASD / Arrow keys move the player within the shore area
- [ ] Mouse movement changes the rod aiming direction
- [ ] Clicking casts the bobber toward the mouse position
- [ ] Bobber travels from player to target and lands in water
- [ ] Fish spawn and swim around in the water
- [ ] When fish swims near bobber, a yellow circle indicator appears
- [ ] Clicking when fish is hooked increases score and removes the fish
- [ ] Clicking without a fish hooked retracts the line (no score change)
- [ ] HUD shows current score and context-sensitive hints

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final polish and build verification"
```

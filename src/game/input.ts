import type { InputState, Vector2 } from './types';
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

export function consumeClick(input: InputState): void {
  input.mouseClicked = false;
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

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

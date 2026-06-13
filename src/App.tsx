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

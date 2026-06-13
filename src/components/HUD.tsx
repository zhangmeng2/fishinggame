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

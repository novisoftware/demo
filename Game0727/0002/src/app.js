import { Game } from './game/Game.js';

// React はタイトル・結果画面・画面遷移のみを担当する(ゲーム中の描画は Game/Screen が担当)。
const { useState, useRef, useEffect, createElement: h } = React;

function TitleScreen({ onStart }) {
  return h(
    'div',
    { className: 'panel' },
    h('h1', null, '試作シューティングゲーム (段階002)'),
    h(
      'p',
      null,
      '自機は自動で前進する。左右のボタンで機体の向きを回転させ、障害物を避けながら弾で的を撃破しよう。全2面。第2面には徘徊する敵「かに」が登場する。ゴールに到達すればクリア。'
    ),
    h('button', { className: 'btn-primary', onClick: onStart }, 'スタート')
  );
}

function ResultScreen({ title, score, onRetry, onTitle }) {
  return h(
    'div',
    { className: 'panel' },
    h('h2', null, title),
    h('p', { className: 'score-line' }, `SCORE: ${score}`),
    h(
      'div',
      { className: 'panel-actions' },
      h('button', { className: 'btn-primary', onClick: onRetry }, 'もう一度'),
      h('button', { className: 'btn-secondary', onClick: onTitle }, 'タイトルへ')
    )
  );
}

// ゲーム画面専用のマウント地点。マウント後は React が再描画に関与しない。
function GameView({ onGameOver, onClear }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const game = new Game(mountRef.current, { onGameOver, onClear });
    return () => game.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return h('div', { className: 'game-mount', ref: mountRef });
}

function App() {
  const [phase, setPhase] = useState('title');
  const [score, setScore] = useState(0);

  const start = () => setPhase('playing');
  const handleGameOver = (finalScore) => {
    setScore(finalScore);
    setPhase('gameover');
  };
  const handleClear = (finalScore) => {
    setScore(finalScore);
    setPhase('clear');
  };

  switch (phase) {
    case 'playing':
      return h(GameView, { onGameOver: handleGameOver, onClear: handleClear });
    case 'gameover':
      return h(ResultScreen, { title: 'GAME OVER', score, onRetry: start, onTitle: () => setPhase('title') });
    case 'clear':
      return h(ResultScreen, { title: 'CLEAR!', score, onRetry: start, onTitle: () => setPhase('title') });
    default:
      return h(TitleScreen, { onStart: start });
  }
}

ReactDOM.createRoot(document.getElementById('app-root')).render(h(App));

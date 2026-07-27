import { Game } from './game/Game.js';
import { STAGE_COUNT } from './game/level.js';

// React はタイトル・結果画面・画面遷移のみを担当する(ゲーム中の描画は Game/Screen が担当)。
const { useState, useRef, useEffect, createElement: h } = React;

// URL の末尾に "?2" や "?3" と付けると、その面から開始できるようにする(動作確認用)。
// 例: index.html?2 -> 第2面から、index.html?3 -> 第3面から。指定が無い/不正な場合は null。
function getStageFromQuery() {
  const m = location.search.match(/^\?(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(n - 1, STAGE_COUNT - 1);
}

function TitleScreen({ onStart }) {
  return h(
    'div',
    { className: 'panel' },
    h('h1', null, '試作シューティングゲーム (段階004)'),
    h(
      'p',
      null,
      '自機は自動で前進する。左右のボタンで機体の向きを回転させ、障害物を避けながら弾で的を撃破しよう。全3面。第2面には徘徊する敵「かに」、第3面には周囲を家来が高速旋回する敵「正八面体」が登場する。ゴールに到達すればクリア。'
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
function GameView({ startStage, onGameOver, onClear }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const game = new Game(mountRef.current, { startStage, onGameOver, onClear });
    return () => game.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return h('div', { className: 'game-mount', ref: mountRef });
}

function App() {
  const queryStage = getStageFromQuery();
  const [phase, setPhase] = useState(queryStage !== null ? 'playing' : 'title');
  const [score, setScore] = useState(0);
  const [startStage, setStartStage] = useState(queryStage !== null ? queryStage : 0);

  // タイトルからのスタートは常に第1面から。
  const start = () => {
    setStartStage(0);
    setPhase('playing');
  };
  // 「もう一度」は第2面から始める(第2面を確認しやすくするため)。
  const retry = () => {
    setStartStage(1);
    setPhase('playing');
  };
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
      return h(GameView, { startStage, onGameOver: handleGameOver, onClear: handleClear });
    case 'gameover':
      return h(ResultScreen, { title: 'GAME OVER', score, onRetry: retry, onTitle: () => setPhase('title') });
    case 'clear':
      return h(ResultScreen, { title: 'CLEAR!', score, onRetry: retry, onTitle: () => setPhase('title') });
    default:
      return h(TitleScreen, { onStart: start });
  }
}

ReactDOM.createRoot(document.getElementById('app-root')).render(h(App));

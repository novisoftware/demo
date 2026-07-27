// コース(障害物・的・敵・ゴール)のレイアウト定義。
// y はスタート地点(0)からゴールへ向かうほど負の方向に大きくなる。
// x は左右のブレ幅で、旋回して避ける/狙う操作が必要になるよう散らしてある。
// 複数ステージ分をここにまとめて定義する。

import { Crab } from './entities.js';

// --- 第1面 ---
const OBSTACLES = [
  { x: -60, y: -300, r: 30 },
  { x: 90, y: -520, r: 26 },
  { x: -120, y: -720, r: 34 },
  { x: 40, y: -940, r: 28 },
  { x: -20, y: -1180, r: 30 },
  { x: 130, y: -1420, r: 26 },
  { x: -100, y: -1650, r: 32 },
  { x: 60, y: -1900, r: 28 },
  { x: -140, y: -2120, r: 30 },
  { x: 20, y: -2300, r: 26 },
];

const TARGETS = [
  { x: 60, y: -220, r: 16 },
  { x: -90, y: -420, r: 16 },
  { x: 10, y: -620, r: 16 },
  { x: -140, y: -860, r: 16 },
  { x: 120, y: -1060, r: 16 },
  { x: -30, y: -1300, r: 16 },
  { x: 90, y: -1550, r: 16 },
  { x: -110, y: -1780, r: 16 },
  { x: 50, y: -2020, r: 16 },
  { x: -60, y: -2250, r: 16 },
];

const GOAL = { x: 0, y: -2400, r: 34 };

// --- 第2面: 敵「かに」が出現する ---
const STAGE2_OBSTACLES = [
  { x: -80, y: -260, r: 28 },
  { x: 100, y: -560, r: 26 },
  { x: -40, y: -940, r: 30 },
  { x: 120, y: -1340, r: 28 },
  { x: -110, y: -1760, r: 30 },
];

const STAGE2_TARGETS = [
  { x: 60, y: -400, r: 16 },
  { x: -70, y: -800, r: 16 },
  { x: 90, y: -1200, r: 16 },
  { x: -50, y: -1600, r: 16 },
];

// patrolRange: 左右に往復する片側の振れ幅(px)。0 なら静止。
// patrolSpeed: 往復移動の速度(px/s)。
const STAGE2_CRABS = [
  { x: -60, y: -460, r: 24, patrolRange: 90, patrolSpeed: 34 },
  { x: 80, y: -720, r: 24, patrolRange: 0, patrolSpeed: 0 },
  { x: -20, y: -1000, r: 26, patrolRange: 120, patrolSpeed: 40 },
  { x: 110, y: -1280, r: 24, patrolRange: 60, patrolSpeed: 30 },
  { x: -100, y: -1620, r: 26, patrolRange: 0, patrolSpeed: 0 },
  { x: 30, y: -1900, r: 24, patrolRange: 100, patrolSpeed: 36 },
  // ゴール手前: 2連に連なったかに(横一列に2匹)
  { x: -45, y: -2260, r: 24, patrolRange: 50, patrolSpeed: 26 },
  { x: 45, y: -2260, r: 24, patrolRange: 50, patrolSpeed: 26 },
  // ゴール手前: 3連に連なったかに(横一列に3匹)
  { x: -95, y: -2520, r: 24, patrolRange: 40, patrolSpeed: 22 },
  { x: 0, y: -2520, r: 24, patrolRange: 40, patrolSpeed: 22 },
  { x: 95, y: -2520, r: 24, patrolRange: 40, patrolSpeed: 22 },
];

const STAGE2_GOAL = { x: 0, y: -2700, r: 34 };

const STAGES = [
  { obstacles: OBSTACLES, targets: TARGETS, crabs: [], goal: GOAL },
  { obstacles: STAGE2_OBSTACLES, targets: STAGE2_TARGETS, crabs: STAGE2_CRABS, goal: STAGE2_GOAL },
];

export const STAGE_COUNT = STAGES.length;

// 呼び出すたびに新しいコピーを返す(リトライ/ステージ再読込のたびに状態をリセットするため)。
export function createLevel(stageIndex = 0) {
  const s = STAGES[stageIndex] ?? STAGES[0];
  return {
    obstacles: s.obstacles.map((o) => ({ ...o })),
    targets: s.targets.map((t) => ({ ...t, alive: true })),
    crabs: s.crabs.map((c) => new Crab(c.x, c.y, c.r, { patrolRange: c.patrolRange, patrolSpeed: c.patrolSpeed })),
    goal: { ...s.goal },
  };
}


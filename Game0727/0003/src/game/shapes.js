// 各オブジェクトの「底面(footprint)」形状をワールド座標で返すヘルパー群。
// Screen.drawWire() がこの footprint を押し出して立体的なワイヤーフレームにする。

export function boxFootprint(cx, cy, r) {
  return [
    { x: cx - r, y: cy - r },
    { x: cx + r, y: cy - r },
    { x: cx + r, y: cy + r },
    { x: cx - r, y: cy + r },
  ];
}

export function diamondFootprint(cx, cy, r) {
  return [
    { x: cx, y: cy - r },
    { x: cx + r, y: cy },
    { x: cx, y: cy + r },
    { x: cx - r, y: cy },
  ];
}

// ゴールは門(ゲート)のような八角形で表現する。
export function gateFootprint(cx, cy, r) {
  return [
    { x: cx - r, y: cy - r * 0.4 },
    { x: cx - r * 0.4, y: cy - r },
    { x: cx + r * 0.4, y: cy - r },
    { x: cx + r, y: cy - r * 0.4 },
    { x: cx + r, y: cy + r * 0.4 },
    { x: cx + r * 0.4, y: cy + r },
    { x: cx - r * 0.4, y: cy + r },
    { x: cx - r, y: cy + r * 0.4 },
  ];
}

// 第2面の敵「かに」の胴体の底面形状。
// 野球のホームベースを平らに(扁平に)したような五角形(五角柱の底面)。
export function crabBodyFootprint(cx, cy, r) {
  const w = r; // 半幅
  const shoulderY = -r * 0.55; // 後方(肩)の左右の辺の高さ
  const tipY = r * 0.85; // 前方の尖り(ホームベースの先端)
  return [
    { x: cx - w, y: cy + shoulderY }, // 後方左
    { x: cx - w, y: cy + shoulderY * 0.1 }, // 左側面
    { x: cx, y: cy + tipY }, // 前方の尖り
    { x: cx + w, y: cy + shoulderY * 0.1 }, // 右側面
    { x: cx + w, y: cy + shoulderY }, // 後方右
  ];
}

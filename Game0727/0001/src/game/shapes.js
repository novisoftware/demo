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

// ゲームバランスに関する定数をまとめたファイル。
// 値を調整するときはここだけ触れば良いようにしている。

export const CANVAS_SIZE = 480; // ゲーム画面の論理解像度(正方形、単位: px)

export const FORWARD_SPEED = 90; // 自機の自動前進速度 (px/s)
export const TURN_RATE = 2.4; // 自機の旋回速度 (rad/s)

export const BULLET_SPEED = 260; // 弾の速度 (px/s)
export const BULLET_MAX = 3; // 画面内に同時存在できる自機弾の最大数 (n=3)
export const BULLET_RANGE = 420; // 弾が消えるまでの飛距離 (px)

export const PLAYER_RADIUS = 12; // 自機の当たり判定半径
export const PLAYER_LIVES = 3; // 自機の残機数

export const INVINCIBLE_TIME = 1.5; // 復活後の無敵時間 (s)
export const EXPLOSION_TIME = 0.6; // 爆発演出の継続時間 (s)

// --- 見下ろし(俯瞰)カメラの遠近感の設定 ---
// このゲームは常に真上(俯瞰)から見下ろす構図。ただし無限遠点から見ているのではなく、
// 地面から有限の高さ CAMERA_HEIGHT にあるカメラで見下ろしている、という前提を置く。
// そのため「地面(footprint)」自体は距離によらず同じ縮尺で描画されるが、
// 高さのある部分(押し出し/extrude)は、画面中心(=自機の直下点)から離れるほど
// 外側へ大きく傾いて見える(ドローン空撮写真で高い建物ほど画面端で傾いて見えるのと同じ原理)。
export const CAMERA_HEIGHT = 260; // カメラの地面からの高さ(px相当)。小さいほど傾きが強く出る
export const PLAYER_SCREEN_Y_RATIO = 0.72; // 自機(=カメラの直下点)の固定スクリーンY位置

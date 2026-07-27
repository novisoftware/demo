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

// --- 第2面の敵「かに」関連 ---
export const CRAB_BULLET_SPEED = 210; // かにの弾の速度 (px/s)
export const CRAB_BULLET_RANGE = 520; // かにの弾が消えるまでの飛距離 (px)
export const CRAB_SCORE = 300; // かにを撃破したときの得点
export const STAGE_CLEAR_TIME = 1.6; // ステージクリア演出の表示時間 (s)

// --- 第3面の敵「正八面体」関連 ---
export const OCTA_BIG_RADIUS = 50; // 30; // 大きい正八面体の底面半径(かにより少し大きい程度)
export const OCTA_SMALL_RATIO =  0.4; 1 / 3; // 小さい正八面体の大きさ比率(大きい方の1/3)
export const OCTA_BIG_HP = 4; // 大きい正八面体を破壊するのに必要な被弾回数
export const OCTA_BIG_SCORE = 500; // 大きい正八面体を撃破したときの得点
export const OCTA_SMALL_SCORE = 100; // 小さい正八面体を撃破したときの得点
export const OCTA_SPIN_RATE = 2; // 0.6; // 大きい正八面体自身のゆっくりとした自転速度 (rad/s)
export const OCTA_ORBIT_RADIUS_RATIO = 3; // 1.8; // 小さい正八面体の公転半径(大きい方の半径に対する比率)
// 大きい正八面体を破壊した際の被弾回数(0〜3)に応じた色。4発目の被弾で爆発する。
export const OCTA_HIT_COLORS = ['#8fe3ff', '#6cff9e', '#ffe066', '#ff5c5c'];

// --- 見下ろし(俯瞰)カメラの遠近感の設定 ---
// このゲームは常に真上(俯瞰)から見下ろす構図。ただし無限遠点から見ているのではなく、
// 地面から有限の高さ CAMERA_HEIGHT にあるカメラで見下ろしている、という前提を置く。
// そのため「地面(footprint)」自体は距離によらず同じ縮尺で描画されるが、
// 高さのある部分(押し出し/extrude)は、画面中心(=自機の直下点)から離れるほど
// 外側へ大きく傾いて見える(ドローン空撮写真で高い建物ほど画面端で傾いて見えるのと同じ原理)。
export const CAMERA_HEIGHT = 260; // カメラの地面からの高さ(px相当)。小さいほど傾きが強く出る
export const PLAYER_SCREEN_Y_RATIO = 0.72; // 自機(=カメラの直下点)の固定スクリーンY位置

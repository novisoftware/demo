// ゲーム中に動的に生成されるオブジェクトの単純なデータクラス群。

export class Player {
  constructor(x = 0, y = 0, heading = 0) {
    this.x = x;
    this.y = y;
    this.heading = heading; // ラジアン。0 = 生成時点の前進方向。
    this.alive = true;
    this.invincible = 0; // 残り無敵時間(秒)
  }
}

export class Bullet {
  constructor(x, y, heading) {
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.traveled = 0;
    this.dead = false;
  }
}

export class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.t = 0; // 経過時間(秒)
  }
}

// 敵弾(「かに」が撃つ弾)。自機弾では破壊できず、自機は避けるしかない。
export class EnemyBullet {
  constructor(x, y, heading) {
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.traveled = 0;
    this.dead = false;
  }
}

// 第2面の敵「かに」。
// 予め決められた範囲(patrolRange)を左右(ワールドx方向)に往復する。0なら静止。
// 気まぐれにタイミングを決めて自機を狙い弾を撃つ。破壊可能。
export class Crab {
  constructor(x, y, r, { patrolRange = 0, patrolSpeed = 0 } = {}) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.baseX = x;
    this.patrolRange = patrolRange;
    this.patrolSpeed = patrolSpeed;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.alive = true;
    this.legTime = Math.random() * 10; // 脚アニメーションの位相をずらす
    this.fireTimer = 1 + Math.random() * 2.5; // 気まぐれな発射間隔
  }
}

// 第3面のボス的な敵「大きい正八面体」。
// 自身はゆっくりリサージュ曲線を描いて移動しつつ、ゆっくり自転する。
// 弾を4発当てると破壊される。被弾回数に応じて色が 水色→緑→黄→赤 と変化し、
// 4発目で爆発する(色の決定は Game 側で hitsTaken を見て行う)。
// 周囲を6個の「小さい正八面体」(家来)が高速に周回する。
export class OctaBoss {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.centerX = x; // リサージュ曲線の中心(基準位置)
    this.centerY = y;
    this.alive = true;
    this.hp = 4; // 破壊までに必要な残り被弾回数
    this.maxHp = this.hp; // 色決定(被弾回数の算出)に使う初期耐久値
    this.spin = Math.random() * Math.PI * 2; // 自転角度
    this.t = Math.random() * 20; // 経過時間(リサージュ曲線・自転に使用)
    // リサージュ曲線のパラメータ(個体ごとに少しずつ変えて「適当な」軌道にする)
    this.freqX = 0.14 + Math.random() * 0.08;
    this.freqY = 0.1 + Math.random() * 0.08;
    this.phaseX = Math.random() * Math.PI * 2;
    this.phaseY = Math.random() * Math.PI * 2;
    this.ampX = 70 + Math.random() * 40;
    this.ampY = 70 + Math.random() * 40;
    this.minions = []; // OctaMinion の配列
  }
}

// 第3面の「小さい正八面体」(大きい正八面体の家来)。
// 親(大きい正八面体)の周りを、常に一定方向(時計回り or 反時計回り)へ高速に周回する。
// 弾が1発当たれば消える。
export class OctaMinion {
  constructor(x, y, r, angle, orbitRadius, orbitSpeed) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.angle = angle; // 親を中心とした現在の公転角度
    this.orbitRadius = orbitRadius;
    this.orbitSpeed = orbitSpeed; // rad/s。符号で時計回り/反時計回りを表す
    this.alive = true;
  }
}


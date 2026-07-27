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

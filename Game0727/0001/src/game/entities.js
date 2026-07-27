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

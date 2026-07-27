import { Screen } from './Screen.js';
import { TouchControls } from './input.js';
import { createLevel, STAGE_COUNT } from './level.js';
import { Player, Bullet, EnemyBullet, Explosion } from './entities.js';
import { boxFootprint, diamondFootprint, gateFootprint } from './shapes.js';
import {
  CANVAS_SIZE,
  FORWARD_SPEED,
  TURN_RATE,
  BULLET_SPEED,
  BULLET_MAX,
  BULLET_RANGE,
  PLAYER_RADIUS,
  PLAYER_LIVES,
  INVINCIBLE_TIME,
  EXPLOSION_TIME,
  CRAB_BULLET_SPEED,
  CRAB_BULLET_RANGE,
  CRAB_SCORE,
  STAGE_CLEAR_TIME,
} from './constants.js';

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * 縦シューティングのゲーム本体。
 *
 * React とは完全に切り離されており、渡された root 要素の中に
 * canvas とタッチボタンの DOM を直接生成し、requestAnimationFrame で自走する。
 * React 側は `new Game(root, callbacks)` で開始し、`game.destroy()` で終了するだけ。
 */
export class Game {
  constructor(root, { onGameOver, onClear, startStage = 0 } = {}) {
    this.root = root;
    this.onGameOver = onGameOver;
    this.onClear = onClear;

    this._buildDom();
    this._resetGame(startStage);

    this._loop = this._loop.bind(this);
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._loop);
  }

  _buildDom() {
    this.root.innerHTML = '';
    this.root.classList.add('game-layout');

    const stage = document.createElement('div');
    stage.className = 'stage';
    const canvas = document.createElement('canvas');
    canvas.className = 'game-canvas';
    stage.appendChild(canvas);
    this.root.appendChild(stage);
    this.screen = new Screen(canvas, CANVAS_SIZE);

    const controlsWrap = document.createElement('div');
    this.root.appendChild(controlsWrap);
    this.controls = new TouchControls(controlsWrap);
  }

  // ゲーム全体の初期化(タイトルからのスタート・リトライ時)。スコア・残機を初期状態に戻し、
  // 指定された面(既定は第1面)から開始する。
  _resetGame(startStage = 0) {
    this.score = 0;
    this.lives = PLAYER_LIVES;
    this._loadStage(startStage);
  }

  // 1つの面を読み込む。スコア・残機はそのまま引き継ぐ(面クリアでのリセットには使わない)。
  _loadStage(stageIndex) {
    const level = createLevel(stageIndex);
    this.stage = stageIndex;
    this.obstacles = level.obstacles;
    this.targets = level.targets;
    this.crabs = level.crabs;
    this.goal = level.goal;
    this.player = new Player(0, 0, 0);
    this.bullets = [];
    this.enemyBullets = [];
    this.explosions = [];
    this.state = 'running'; // running | exploding | stagecleared | finished
    this._prevShoot = false;
    this._explodeTimer = 0;
    this._stageClearTimer = 0;
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this.controls.destroy();
    this.root.innerHTML = '';
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._update(dt);
    this._draw();
    if (this.state !== 'finished') {
      this._raf = requestAnimationFrame(this._loop);
    }
  }

  _update(dt) {
    if (this.state === 'exploding') {
      this.explosions.forEach((e) => (e.t += dt));
      this._explodeTimer -= dt;
      if (this._explodeTimer <= 0) this._respawnOrGameOver();
      return;
    }

    if (this.state === 'stagecleared') {
      this._stageClearTimer -= dt;
      if (this._stageClearTimer <= 0) {
        if (this.stage + 1 < STAGE_COUNT) {
          this._loadStage(this.stage + 1);
        } else {
          // 最終面: バナー表示後に本当のクリア(React側のクリア画面)へ遷移する。
          this.state = 'finished';
          this.onClear && this.onClear(this.score);
        }
      }
      return;
    }

    const input = this.controls.state;

    // 旋回(= 画面のローテーション)
    if (input.left) this.player.heading -= TURN_RATE * dt;
    if (input.right) this.player.heading += TURN_RATE * dt;

    // 自動前進(左右移動ではなく、常に自機の向き=heading方向へ進む)
    this.player.x += Math.sin(this.player.heading) * FORWARD_SPEED * dt;
    this.player.y -= Math.cos(this.player.heading) * FORWARD_SPEED * dt;

    if (this.player.invincible > 0) this.player.invincible -= dt;

    // 発射(ボタンを押した瞬間のみ。画面内に BULLET_MAX 発まで)
    if (input.shoot && !this._prevShoot && this.bullets.length < BULLET_MAX) {
      this.bullets.push(new Bullet(this.player.x, this.player.y, this.player.heading));
    }
    this._prevShoot = input.shoot;

    for (const b of this.bullets) {
      b.x += Math.sin(b.heading) * BULLET_SPEED * dt;
      b.y -= Math.cos(b.heading) * BULLET_SPEED * dt;
      b.traveled += BULLET_SPEED * dt;
    }

    this._updateCrabs(dt);

    for (const eb of this.enemyBullets) {
      eb.x += Math.sin(eb.heading) * CRAB_BULLET_SPEED * dt;
      eb.y -= Math.cos(eb.heading) * CRAB_BULLET_SPEED * dt;
      eb.traveled += CRAB_BULLET_SPEED * dt;
    }

    // 弾 vs 障害物: 障害物は壊せないので弾だけが消える
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const o of this.obstacles) {
        if (dist(b, o) < o.r) {
          b.dead = true;
          break;
        }
      }
    }
    // 弾 vs 的: 命中で破壊+得点
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const t of this.targets) {
        if (t.alive && dist(b, t) < t.r) {
          t.alive = false;
          b.dead = true;
          this.score += 100;
          this.explosions.push(new Explosion(t.x, t.y));
          break;
        }
      }
    }
    // 弾 vs かに: 命中で破壊+得点
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const c of this.crabs) {
        if (c.alive && dist(b, c) < c.r) {
          c.alive = false;
          b.dead = true;
          this.score += CRAB_SCORE;
          this.explosions.push(new Explosion(c.x, c.y));
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead && b.traveled < BULLET_RANGE);

    // かにの弾 vs 障害物: 弾は消える(障害物は影響を受けない)
    for (const eb of this.enemyBullets) {
      if (eb.dead) continue;
      for (const o of this.obstacles) {
        if (dist(eb, o) < o.r) {
          eb.dead = true;
          break;
        }
      }
    }
    this.enemyBullets = this.enemyBullets.filter((eb) => !eb.dead && eb.traveled < CRAB_BULLET_RANGE);

    // 自機の衝突判定(無敵時間中は無視)
    if (this.player.invincible <= 0) {
      for (const o of this.obstacles) {
        if (dist(this.player, o) < o.r + PLAYER_RADIUS) return this._crash();
      }
      for (const t of this.targets) {
        if (t.alive && dist(this.player, t) < t.r + PLAYER_RADIUS) return this._crash();
      }
      for (const c of this.crabs) {
        if (c.alive && dist(this.player, c) < c.r + PLAYER_RADIUS) return this._crash();
      }
      for (const eb of this.enemyBullets) {
        if (dist(this.player, eb) < PLAYER_RADIUS + 4) return this._crash();
      }
      if (dist(this.player, this.goal) < this.goal.r + PLAYER_RADIUS) {
        // どの面でもまず「STAGE X CLEAR」のバナーを表示する。
        // 最終面かどうかの分岐は、バナー表示後(stagecleared のタイマー終了時)に行う。
        this.state = 'stagecleared';
        this._stageClearTimer = STAGE_CLEAR_TIME;
        return;
      }
    }

    this.explosions.forEach((e) => (e.t += dt));
    this.explosions = this.explosions.filter((e) => e.t < EXPLOSION_TIME);
  }

  // 「かに」の移動(決められた範囲の往復、または静止)と、気まぐれな狙い撃ちを処理する。
  _updateCrabs(dt) {
    for (const c of this.crabs) {
      if (!c.alive) continue;
      c.legTime += dt;

      if (c.patrolRange > 0) {
        c.x += c.dir * c.patrolSpeed * dt;
        if (c.x > c.baseX + c.patrolRange) {
          c.x = c.baseX + c.patrolRange;
          c.dir = -1;
        } else if (c.x < c.baseX - c.patrolRange) {
          c.x = c.baseX - c.patrolRange;
          c.dir = 1;
        }
      }

      c.fireTimer -= dt;
      if (c.fireTimer <= 0) {
        // 気まぐれに: 一定確率でだけ実際に発射し、外れたときは短めの間隔で再抽選する
        if (Math.random() < 0.6) {
          const dx = this.player.x - c.x;
          const dy = this.player.y - c.y;
          const heading = Math.atan2(dx, -dy);
          this.enemyBullets.push(new EnemyBullet(c.x, c.y, heading));
          c.fireTimer = 1.4 + Math.random() * 2.4;
        } else {
          c.fireTimer = 0.4 + Math.random() * 0.8;
        }
      }
    }
  }

  _crash() {
    this.state = 'exploding';
    this._explodeTimer = EXPLOSION_TIME;
    this.player.alive = false;
    this.explosions.push(new Explosion(this.player.x, this.player.y));
  }

  // 被弾後: 残機があれば「その場」(同じ座標・向き)で復活。0機ならゲームオーバー。
  _respawnOrGameOver() {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.state = 'finished';
      this.onGameOver && this.onGameOver(this.score);
      return;
    }
    this.player.alive = true;
    this.player.invincible = INVINCIBLE_TIME;
    this.state = 'running';
  }

  _draw() {
    const s = this.screen;
    s.setCamera(this.player.x, this.player.y, this.player.heading);
    s.clear();
    s.drawGrid();

    for (const o of this.obstacles) {
      s.drawWire(boxFootprint(o.x, o.y, o.r), { color: '#7d8b93', extrude: 22 });
    }
    for (const t of this.targets) {
      if (t.alive) s.drawWire(diamondFootprint(t.x, t.y, t.r), { color: '#ffd35c', extrude: 16 });
    }
    for (const c of this.crabs) {
      if (c.alive) s.drawCrab(c);
    }
    s.drawWire(gateFootprint(this.goal.x, this.goal.y, this.goal.r), { color: '#6cff9e', extrude: 42 });

    for (const b of this.bullets) {
      s.drawWire(diamondFootprint(b.x, b.y, 4), { color: '#fff7cf', extrude: 6 });
    }
    for (const eb of this.enemyBullets) {
      s.drawWire(diamondFootprint(eb.x, eb.y, 5), { color: '#ff6b6b', extrude: 6 });
    }

    for (const e of this.explosions) s.drawExplosion(e);

    if (this.player.alive) {
      const blinking = this.player.invincible > 0 && Math.floor(this.player.invincible * 10) % 2 === 0;
      if (!blinking) s.drawPlayer();
    }

    s.drawCompass(this.goal.x, this.goal.y);
    s.drawHUD({ score: this.score, lives: this.lives, stage: this.stage, stageCount: STAGE_COUNT });
    if (this.state === 'stagecleared') s.drawBanner(`STAGE ${this.stage + 1} CLEAR!`);
  }
}


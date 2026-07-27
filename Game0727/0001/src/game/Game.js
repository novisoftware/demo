import { Screen } from './Screen.js';
import { TouchControls } from './input.js';
import { createLevel } from './level.js';
import { Player, Bullet, Explosion } from './entities.js';
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
  constructor(root, { onGameOver, onClear } = {}) {
    this.root = root;
    this.onGameOver = onGameOver;
    this.onClear = onClear;

    this._buildDom();
    this._reset();

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

  _reset() {
    const level = createLevel();
    this.obstacles = level.obstacles;
    this.targets = level.targets;
    this.goal = level.goal;
    this.player = new Player(0, 0, 0);
    this.bullets = [];
    this.explosions = [];
    this.score = 0;
    this.lives = PLAYER_LIVES;
    this.state = 'running'; // running | exploding | finished
    this._prevShoot = false;
    this._explodeTimer = 0;
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
    this.bullets = this.bullets.filter((b) => !b.dead && b.traveled < BULLET_RANGE);

    // 自機の衝突判定(無敵時間中は無視)
    if (this.player.invincible <= 0) {
      for (const o of this.obstacles) {
        if (dist(this.player, o) < o.r + PLAYER_RADIUS) return this._crash();
      }
      for (const t of this.targets) {
        if (t.alive && dist(this.player, t) < t.r + PLAYER_RADIUS) return this._crash();
      }
      if (dist(this.player, this.goal) < this.goal.r + PLAYER_RADIUS) {
        this.state = 'finished';
        this.onClear && this.onClear(this.score);
        return;
      }
    }

    this.explosions.forEach((e) => (e.t += dt));
    this.explosions = this.explosions.filter((e) => e.t < EXPLOSION_TIME);
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
    s.drawWire(gateFootprint(this.goal.x, this.goal.y, this.goal.r), { color: '#6cff9e', extrude: 42 });

    for (const b of this.bullets) {
      s.drawWire(diamondFootprint(b.x, b.y, 4), { color: '#fff7cf', extrude: 6 });
    }

    for (const e of this.explosions) s.drawExplosion(e);

    if (this.player.alive) {
      const blinking = this.player.invincible > 0 && Math.floor(this.player.invincible * 10) % 2 === 0;
      if (!blinking) s.drawPlayer();
    }

    s.drawCompass(this.goal.x, this.goal.y);
    s.drawHUD({ score: this.score, lives: this.lives });
  }
}

import { EXPLOSION_TIME, CAMERA_HEIGHT, PLAYER_SCREEN_Y_RATIO } from './constants.js';
import { crabBodyFootprint, octaBaseFootprint } from './shapes.js';

/**
 * ゲーム画面の描画を一手に引き受けるオブジェクト。
 *
 * - Canvas2D の薄いラッパーで、React には一切依存しない。
 * - カメラは常に「自機の位置」かつ「自機の向きが画面の真上になる回転」を持つ。
 *   これにより、自機自体は画面上で回転せず、代わりに世界(障害物・的・グリッド等)が
 *   自機を中心にぐるっと回転して見える = 「横移動ではなく画面がローテートする」を実現する。
 * - ゲームの視点はあくまで**真上からの俯瞰**(前傾きの三人称視点ではない)。ただし
 *   無限遠点から見ているわけではなく、地面から有限の高さ(CAMERA_HEIGHT)にあるカメラで
 *   見下ろしていると考える。この前提により:
 *     - 地面(footprint)は距離によらず同じ縮尺で描画される(平行投影のままでよい)。
 *     - 高さのある部分(押し出し/extrude = 立体の「上面」)だけは、画面中心の固定点
 *       (=自機の直下点)から離れるほど外側へ大きく傾いて見える。ドローンで真下を撮った
 *       写真で、画面端の高い建物ほど中心から傾いて写る(=側面が見える)のと同じ原理。
 * - 上から見た配置(footprint)を、その「傾き」を伴う「上面」で結んで描くことで、
 *   ワイヤーフレームに簡易的な立体感を持たせている。
 */
export class Screen {
  constructor(canvas, size) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.camera = { x: 0, y: 0, heading: 0 };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setCamera(x, y, heading) {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.heading = heading;
  }

  clear(color = '#03080a') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.size, this.size);
  }

  // ワールド座標(地面 = 高さ0)-> スクリーン座標。
  // 自機の前進方向(heading)が常に画面の「上」に来るように回転させる。
  // 真上から見下ろす俯瞰なので、地面自体は距離による拡大縮小をしない(平行投影)。
  toScreen(wx, wy) {
    const dx = wx - this.camera.x;
    const dy = wy - this.camera.y;
    const h = this.camera.heading;
    const rx = dx * Math.cos(h) + dy * Math.sin(h); // 画面左右方向
    const ry = -dx * Math.sin(h) + dy * Math.cos(h); // 画面奥行き方向(前方が負)
    return {
      x: this.size / 2 + rx,
      y: this.size * PLAYER_SCREEN_Y_RATIO + ry,
    };
  }

  drawLine(p1, p2, color = '#dff6ff', width = 1.5) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  _strokePoly(points, color, width, close = true) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    if (close) ctx.closePath();
    ctx.stroke();
  }

  /**
   * 押し出し(extrude)の上面を、画面固定のアンカー点(=自機の直下点)から見た
   * 放射方向へ拡大した位置に描く。アンカーに近い(=自機の近く/画面中央寄りの)
   * オブジェクトほど傾きはわずかで、アンカーから離れる(=画面の上端・下端に近づく)
   * オブジェクトほど傾きが大きく出る。これにより「画面の上端と下端で物体の形が変わる」
   * 有限高さの俯瞰カメラらしい見た目になる。
   */
  _tiltedTop(base, height, anchor) {
    const denom = Math.max(CAMERA_HEIGHT * 0.2, CAMERA_HEIGHT - height);
    const k = CAMERA_HEIGHT / denom; // 高さがあるほど、アンカーから遠いほど傾きが強調される
    return base.map((p) => ({
      x: anchor.x + (p.x - anchor.x) * k,
      y: anchor.y + (p.y - anchor.y) * k,
    }));
  }

  /**
   * ワールド上の footprint(底面の輪郭)をワイヤーフレームで描画する。
   * extrude(高さ)> 0 のとき、底面を「アンカー(自機の直下点)から放射状に拡大した上面」
   * でも描き、対応する頂点同士を線で結んで立体感(押し出し表現)を出す。
   */
  drawWire(worldPoints, { color = '#dff6ff', width = 1.5, extrude = 0 } = {}) {
    const base = worldPoints.map((p) => this.toScreen(p.x, p.y));
    this._strokePoly(base, color, width);
    if (extrude > 0) {
      const anchor = { x: this.size / 2, y: this.size * PLAYER_SCREEN_Y_RATIO };
      const top = this._tiltedTop(base, extrude, anchor);
      this._strokePoly(top, color, width);
      for (let i = 0; i < base.length; i++) {
        this.drawLine(base[i], top[i], color, width);
      }
    }
  }

  // 自機は常にカメラの直下(=画面上の固定位置)に描かれる。常にアンカー上にいるため、
  // 俯瞰カメラの傾き効果はほぼ乗らない。自機自体の立体感は簡易的に中心から拡大して出す。
  drawPlayer(color = '#8fe3ff') {
    const cx = this.size / 2;
    const cy = this.size * PLAYER_SCREEN_Y_RATIO;
    const base = [
      { x: cx, y: cy - 16 },
      { x: cx + 11, y: cy + 12 },
      { x: cx, y: cy + 4 },
      { x: cx - 11, y: cy + 12 },
    ];
    this._strokePoly(base, color, 2);
    const top = base.map((p) => ({ x: cx + (p.x - cx) * 1.15, y: cy + (p.y - cy) * 1.15 }));
    this._strokePoly(top, color, 2);
    for (let i = 0; i < base.length; i++) this.drawLine(base[i], top[i], color, 2);
  }

  drawExplosion(e) {
    const p = this.toScreen(e.x, e.y);
    const k = Math.min(1, e.t / EXPLOSION_TIME);
    const radius = 6 + k * 34;
    const alpha = (1 - k).toFixed(2);
    const ctx = this.ctx;
    ctx.strokeStyle = `rgba(255,170,90,${alpha})`;
    ctx.lineWidth = 2;
    const spikes = 8;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2 + k * 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(a) * radius * 0.35, p.y + Math.sin(a) * radius * 0.35);
      ctx.lineTo(p.x + Math.cos(a) * radius, p.y + Math.sin(a) * radius);
      ctx.stroke();
    }
  }

  // 敵「かに」を描画する。
  // 胴体: ホームベースを平らにしたような五角形を底面とする五角柱(押し出し表現)。
  // 脚: 左右3本ずつ(計6本)。1本の脚は「くの字」に折れた2本のワイヤーフレームで表現し、
  //     各脚ごとに位相をずらして時間で揺らすことで、適当に動いている様子を出す。
  drawCrab(crab, { bodyColor = '#ff9466', legColor = '#ffbd9e' } = {}) {
    this.drawWire(crabBodyFootprint(crab.x, crab.y, crab.r), { color: bodyColor, extrude: crab.r * 0.9 });

    const legsPerSide = 3;
    for (const side of [-1, 1]) {
      for (let i = 0; i < legsPerSide; i++) {
        const spread = i - (legsPerSide - 1) / 2; // -1, 0, 1 (前後方向の取り付け位置)
        const along = spread * crab.r * 0.6;
        const rootX = crab.x + side * crab.r * 0.9;
        const rootY = crab.y + along;

        // 脚ごとに位相をずらした揺れ(適当に動く歩行っぽい表現)
        const phase = crab.legTime * 2.2 + i * 1.4 + (side > 0 ? 0.7 : 0);
        const swing = Math.sin(phase) * 0.3;
        const kneeAngle = side * (0.5 + swing);
        const footAngle = side * (1.2 + swing * 1.3); // 「くの字」に折れる角度
        const legLen1 = crab.r * 0.9;
        const legLen2 = crab.r * 0.95;

        const knee = {
          x: rootX + Math.sin(kneeAngle) * legLen1,
          y: rootY + Math.cos(kneeAngle) * legLen1 * 0.4,
        };
        const foot = {
          x: knee.x + Math.sin(footAngle) * legLen2,
          y: knee.y + Math.cos(footAngle) * legLen2 * 0.4,
        };

        const rootS = this.toScreen(rootX, rootY);
        const kneeS = this.toScreen(knee.x, knee.y);
        const footS = this.toScreen(foot.x, foot.y);
        this.drawLine(rootS, kneeS, legColor, 1.5);
        this.drawLine(kneeS, footS, legColor, 1.5);
      }
    }
  }

  /**
   * 敵「正八面体」を描画する。
   * 正八面体は、赤道部分(正方形、octaBaseFootprint)の4頂点をワイヤーフレームで結び、
   * さらにその4頂点から上下1つずつの先端(上頂点・下頂点)へ線を伸ばすことで、
   * 上下対称の双三角錐(正八面体)を表現する。
   * 上頂点の位置は、他のオブジェクトの押し出し(extrude)と同じ「アンカーから
   * 放射状に傾く」ロジック(_tiltedTop)を1点だけに適用して求める。
   * 下頂点は、上下対称な双三角錐に見えるよう、中心点に対する上頂点の点対称位置とする。
   */
  drawOcta(cx, cy, r, rotation, height, color = '#8fe3ff') {
    const basePts = octaBaseFootprint(cx, cy, r, rotation);
    const baseScreen = basePts.map((p) => this.toScreen(p.x, p.y));
    this._strokePoly(baseScreen, color, 2);

    const anchor = { x: this.size / 2, y: this.size * PLAYER_SCREEN_Y_RATIO };
    const centerScreen = this.toScreen(cx, cy);
    const apexTop = this._tiltedTop([centerScreen], height, anchor)[0];
    const apexBottom = {
      x: centerScreen.x * 2 - apexTop.x,
      y: centerScreen.y * 2 - apexTop.y,
    };
    for (const p of baseScreen) {
      this.drawLine(p, apexTop, color, 2);
      this.drawLine(p, apexBottom, color, 2);
    }
  }

  // 素朴な床グリッド。回転(旋回)の感覚を視覚的にわかりやすくするために描く。
  drawGrid(step = 60, range = 480, color = 'rgba(70,120,140,0.35)') {
    const camX = this.camera.x;
    const camY = this.camera.y;
    const startX = Math.floor((camX - range) / step) * step;
    const startY = Math.floor((camY - range) / step) * step;
    for (let y = startY; y <= camY + range; y += step) {
      this.drawLine(this.toScreen(camX - range, y), this.toScreen(camX + range, y), color, 1);
    }
    for (let x = startX; x <= camX + range; x += step) {
      this.drawLine(this.toScreen(x, camY - range), this.toScreen(x, camY + range), color, 1);
    }
  }

  drawHUD({ score, lives, stage, stageCount }) {
    const ctx = this.ctx;
    ctx.font = '16px "Consolas", monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#dff6ff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${String(score).padStart(5, '0')}`, 10, 10);
    if (stageCount > 1) ctx.fillText(`STAGE ${stage + 1}/${stageCount}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`LIVES ${'▲'.repeat(Math.max(0, lives))}`, this.size - 10, 10);
  }

  // ステージクリア時などに、画面中央へ短いメッセージを表示する。
  drawBanner(text) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px "Consolas", monospace';
    ctx.fillStyle = 'rgba(3,8,10,0.55)';
    ctx.fillRect(0, this.size / 2 - 30, this.size, 60);
    ctx.fillStyle = '#6cff9e';
    ctx.fillText(text, this.size / 2, this.size / 2);
    ctx.restore();
  }

  /**
   * 画面隅に、ゴールがある方向を指す矢印インジケーター(簡易コンパス)を描く。
   * 自機を中心とした回転後の座標系で角度だけを求め、位置は画面隅に固定する。
   */
  drawCompass(targetX, targetY, { margin = 34, radius = 15, color = '#6cff9e' } = {}) {
    const dx = targetX - this.camera.x;
    const dy = targetY - this.camera.y;
    const h = this.camera.heading;
    const rx = dx * Math.cos(h) + dy * Math.sin(h);
    const ry = -dx * Math.sin(h) + dy * Math.cos(h);
    const angle = Math.atan2(ry, rx);
    const cx = this.size - margin;
    const cy = margin;
    const ctx = this.ctx;

    ctx.strokeStyle = 'rgba(108,255,158,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, -radius * 0.55);
    ctx.lineTo(radius, 0);
    ctx.lineTo(-radius * 0.6, radius * 0.55);
    ctx.moveTo(-radius * 0.15, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();
    ctx.restore();

    ctx.font = '10px "Consolas", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    ctx.fillText('GOAL', cx, cy + radius + 8);
  }
}

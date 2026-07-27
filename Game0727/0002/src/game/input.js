/**
 * スマホ向けのタッチボタン(画面外)を生成・管理するクラス。
 *
 * レイアウト: 左右2列。各列は「射撃ボタン(上)」「旋回ボタン(下)」の2つ。
 *   左列: [ 射撃 ]      右列: [ 射撃 ]
 *         [ ◀ 旋回 ]           [ ▶ 旋回 ]
 *
 * デスクトップ確認用に矢印キー/スペースキーにも簡易対応している。
 */
export class TouchControls {
  constructor(root) {
    this.state = { left: false, right: false, shoot: false };
    this._root = root;

    root.innerHTML = '';
    root.className = 'controls';

    const left = this._buildColumn('left', '◀');
    const right = this._buildColumn('right', '▶');
    root.appendChild(left.col);
    root.appendChild(right.col);

    this._bind(left.shootBtn, 'shoot');
    this._bind(right.shootBtn, 'shoot');
    this._bind(left.turnBtn, 'left');
    this._bind(right.turnBtn, 'right');

    this._onKeyDown = (e) => this._onKey(e, true);
    this._onKeyUp = (e) => this._onKey(e, false);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _buildColumn(side, arrowLabel) {
    const col = document.createElement('div');
    col.className = `control-col control-col--${side}`;

    const shootBtn = document.createElement('button');
    shootBtn.type = 'button';
    shootBtn.className = 'btn btn-shoot';
    shootBtn.textContent = 'SHOT';

    const turnBtn = document.createElement('button');
    turnBtn.type = 'button';
    turnBtn.className = 'btn btn-turn';
    turnBtn.textContent = arrowLabel;

    col.appendChild(shootBtn);
    col.appendChild(turnBtn);
    return { col, shootBtn, turnBtn };
  }

  _bind(el, key) {
    const on = (e) => {
      e.preventDefault();
      this.state[key] = true;
    };
    const off = (e) => {
      e.preventDefault();
      this.state[key] = false;
    };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  }

  _onKey(e, down) {
    if (e.repeat) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyH') this.state.left = down;
    if (e.code === 'ArrowRight' || e.code === 'KeyL') this.state.right = down;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyJ' || e.code === 'KeyK') this.state.shoot = down;
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._root.innerHTML = '';
  }
}

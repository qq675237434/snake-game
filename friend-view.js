/**
 * 贪吃蛇对战 - 好友游戏画面迷你渲染器
 * 在顶部小窗口实时绘制好友的游戏状态
 * @module friend-view
 */

class FriendView {
  /**
   * @param {HTMLCanvasElement} canvas - 好友预览画布
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastState = null;
  }

  /**
   * 更新好友游戏状态
   * @param {Object} state - { snake, food, score, obstacles, difficulty }
   */
  update(state) {
    if (!state) return;
    this.lastState = state;
    this.draw();
  }

  /** 清空画面 */
  clear() {
    this.lastState = null;
    const ctx = this.ctx;
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('等待好友...', this.canvas.width / 2, this.canvas.height / 2);
  }

  /** 绘制好友的游戏画面 */
  draw() {
    const state = this.lastState;
    if (!state) { this.clear(); return; }

    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // 根据好友的网格计算缩放
    const gridCols = 30; // 默认
    const gridRows = 20;
    const cellW = cw / gridCols;
    const cellH = ch / gridRows;
    const cellSize = Math.min(cellW, cellH);
    const offsetX = (cw - gridCols * cellSize) / 2;
    const offsetY = (ch - gridRows * cellSize) / 2;

    // 背景
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, cw, ch);

    // 网格线（轻量）
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= gridCols; x++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * cellSize, offsetY);
      ctx.lineTo(offsetX + x * cellSize, offsetY + gridRows * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= gridRows; y++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * cellSize);
      ctx.lineTo(offsetX + gridCols * cellSize, offsetY + y * cellSize);
      ctx.stroke();
    }

    // 障碍物
    if (state.obstacles && state.obstacles.length > 0) {
      ctx.fillStyle = '#6B7280';
      state.obstacles.forEach(obs => {
        ctx.fillRect(
          offsetX + obs.x * cellSize + 1,
          offsetY + obs.y * cellSize + 1,
          cellSize - 2, cellSize - 2
        );
      });
    }

    // 食物
    if (state.food) {
      ctx.fillStyle = '#FF5252';
      ctx.beginPath();
      ctx.arc(
        offsetX + state.food.x * cellSize + cellSize / 2,
        offsetY + state.food.y * cellSize + cellSize / 2,
        cellSize / 2 - 1, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // 蛇
    if (state.snake && state.snake.length > 0) {
      state.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#66BB6A' : '#4CAF50';
        const r = cellSize > 6 ? 2 : 0;
        if (r > 0) {
          this._roundRect(ctx,
            offsetX + seg.x * cellSize + 1,
            offsetY + seg.y * cellSize + 1,
            cellSize - 2, cellSize - 2, r
          );
        } else {
          ctx.fillRect(
            offsetX + seg.x * cellSize + 1,
            offsetY + seg.y * cellSize + 1,
            cellSize - 2, cellSize - 2
          );
        }
      });
    }

    // 分数叠加显示
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, cw, 22);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('好友得分: ' + (state.score || 0), 8, 16);

    // 难度标签
    const diffLabels = { easy: '🟢容易', hard: '🟡困难', hell: '🔴地狱' };
    ctx.textAlign = 'right';
    ctx.fillStyle = '#aaa';
    ctx.font = '11px sans-serif';
    ctx.fillText(diffLabels[state.difficulty] || '', cw - 8, 16);
  }

  /** @private 圆角矩形 */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 显示对战结果
   * @param {number} myScore
   * @param {number} friendScore
   * @param {string} friendNickname
   */
  drawResult(myScore, friendScore, friendNickname) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';

    const result = myScore > friendScore ? '🎉 你赢了！' :
                   myScore < friendScore ? '😅 你输了' : '🤝 平局';
    ctx.fillText(result, cw / 2, ch / 2 - 15);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('你: ' + myScore + '  vs  ' + friendNickname + ': ' + friendScore, cw / 2, ch / 2 + 10);
  }
}

/**
 * 贪吃蛇排行榜系统
 * 管理玩家分数记录、排名、昵称
 * 支持按难度分类，显示 TOP 20
 * @module leaderboard
 */

// ========================================
// 排行榜管理器
// ========================================
class LeaderboardManager {
  constructor() {
    this.STORAGE_KEY = 'snakeLeaderboard';
    this.MAX_RECORDS = 20;
    this.records = this.load();
    this.currentNickname = this.loadNickname();
  }

  /**
   * 添加一条分数记录
   * @param {number} score
   * @param {string} difficulty
   * @returns {{rank: number, isTop20: boolean}} 排名信息
   */
  addRecord(score, difficulty) {
    if (score <= 0) return { rank: -1, isTop20: false };

    const record = {
      id: this._genId(),
      nickname: this.currentNickname,
      score: score,
      difficulty: difficulty,
      time: Date.now()
    };

    this.records.push(record);
    this.records.sort((a, b) => b.score - a.score);

    // 只保留 TOP 100（防止存储膨胀，显示 TOP 20）
    if (this.records.length > 100) {
      this.records = this.records.slice(0, 100);
    }

    this.save();

    const rank = this.records.findIndex(r => r.id === record.id) + 1;
    return { rank, isTop20: rank <= this.MAX_RECORDS };
  }

  /**
   * 获取 TOP 20 排行榜
   * @returns {Array<Object>}
   */
  getTop20() {
    return this.records.slice(0, this.MAX_RECORDS);
  }

  /**
   * 设置当前玩家昵称
   * @param {string} name
   */
  setNickname(name) {
    this.currentNickname = (name || '').trim().slice(0, 10) || '蛇友';
    localStorage.setItem('snakeNickname', this.currentNickname);
  }

  /** 获取昵称 */
  getNickname() {
    return this.currentNickname;
  }

  // ========================================
  // 持久化
  // ========================================

  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) { /* ignore */ }
  }

  loadNickname() {
    try {
      return localStorage.getItem('snakeNickname') || '蛇友';
    } catch (e) { return '蛇友'; }
  }

  // ========================================
  // 工具
  // ========================================

  _genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /**
   * 获取难度标签
   * @param {string} diff
   * @returns {string}
   */
  getDifficultyLabel(diff) {
    const labels = { easy: '🟢 容易', hard: '🟡 困难', hell: '🔴 地狱' };
    return labels[diff] || diff;
  }

  /**
   * 获取排名奖牌
   * @param {number} rank - 1-based
   * @returns {string}
   */
  getRankMedal(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '#' + rank;
  }

  /**
   * 格式化时间
   * @param {number} timestamp
   * @returns {string}
   */
  formatTime(timestamp) {
    const diff = Date.now() - timestamp;
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + '分钟前';
    const h = Math.floor(min / 60);
    if (h < 24) return h + '小时前';
    const d = Math.floor(h / 24);
    return d + '天前';
  }
}

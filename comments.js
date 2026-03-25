/**
 * 贪吃蛇评论系统（Web 版）
 * 支持发表评论、点赞、实时显示
 * 数据存储在 localStorage
 * @module comments
 */

// ========================================
// 评论管理器
// ========================================
class CommentSystem {
  constructor() {
    this.STORAGE_KEY = 'snakeComments';
    this.LIKES_KEY = 'snakeCommentLikes';
    this.MAX_COMMENTS = 200;
    this.MAX_LENGTH = 50;
    this.comments = this.load();
    this.likedIds = this.loadLikes();
  }

  /**
   * 添加评论
   * @param {string} text
   * @param {number} score
   * @param {string} difficulty
   * @returns {Object|null}
   */
  addComment(text, score, difficulty) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    const comment = {
      id: this._genId(),
      content: trimmed.slice(0, this.MAX_LENGTH),
      nickname: this.getNickname(),
      score: score,
      difficulty: difficulty,
      likes: 0,
      time: Date.now()
    };

    this.comments.unshift(comment);
    if (this.comments.length > this.MAX_COMMENTS) {
      this.comments = this.comments.slice(0, this.MAX_COMMENTS);
    }
    this.save();
    return comment;
  }

  /**
   * 点赞/取消
   * @param {string} id
   * @returns {boolean} 是否已赞
   */
  toggleLike(id) {
    const comment = this.comments.find(c => c.id === id);
    if (!comment) return false;

    if (this.likedIds.has(id)) {
      this.likedIds.delete(id);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      this.likedIds.add(id);
      comment.likes++;
    }
    this.save();
    this.saveLikes();
    return this.likedIds.has(id);
  }

  isLiked(id) { return this.likedIds.has(id); }

  getRecent(count = 20) { return this.comments.slice(0, count); }

  getNickname() {
    return localStorage.getItem('snakeNickname') || '蛇友';
  }

  setNickname(name) {
    localStorage.setItem('snakeNickname', (name || '').trim().slice(0, 10) || '蛇友');
  }

  // ========================================
  // 持久化
  // ========================================

  load() {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }

  save() {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.comments)); }
    catch (e) { /* ignore */ }
  }

  loadLikes() {
    try { return new Set(JSON.parse(localStorage.getItem(this.LIKES_KEY)) || []); }
    catch (e) { return new Set(); }
  }

  saveLikes() {
    try { localStorage.setItem(this.LIKES_KEY, JSON.stringify([...this.likedIds])); }
    catch (e) { /* ignore */ }
  }

  _genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  formatTime(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + '分钟前';
    const h = Math.floor(min / 60);
    if (h < 24) return h + '小时前';
    return Math.floor(h / 24) + '天前';
  }

  getDiffLabel(diff) {
    return { easy: '🟢', hard: '🟡', hell: '🔴' }[diff] || '';
  }
}

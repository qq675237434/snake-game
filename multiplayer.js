/**
 * 贪吃蛇多人对战系统
 * 基于 PeerJS (WebRTC) 实现 P2P 实时对战
 * 无需后端服务器，纯前端通信
 * @module multiplayer
 */

// ========================================
// 消息类型枚举
// ========================================
const MsgType = {
  INVITE: 'invite',         // 发送邀请
  ACCEPT: 'accept',         // 接受邀请
  REJECT: 'reject',         // 拒绝邀请
  READY: 'ready',           // 准备就绪
  COUNTDOWN: 'countdown',   // 倒计时同步
  GAME_STATE: 'gameState',  // 游戏状态帧
  GAME_OVER: 'gameOver',    // 游戏结束
  PLAY_AGAIN: 'playAgain',  // 继续一起玩
  LEAVE: 'leave'            // 离开房间
};

// ========================================
// 对战状态枚举
// ========================================
const MPState = {
  IDLE: 'idle',             // 无连接
  CREATING: 'creating',     // 创建房间中
  WAITING: 'waiting',       // 等待好友加入
  INVITED: 'invited',       // 收到邀请
  CONNECTING: 'connecting', // 连接中
  COUNTDOWN: 'countdown',   // 倒计时中
  PLAYING: 'playing',       // 对战中
  RESULT: 'result'          // 结算界面
};

// ========================================
// 多人对战管理器
// ========================================
class MultiplayerManager {
  constructor() {
    /** @type {Peer|null} PeerJS 实例 */
    this.peer = null;
    /** @type {DataConnection|null} 当前数据连接 */
    this.conn = null;
    /** @type {string} 当前状态 */
    this.state = MPState.IDLE;
    /** @type {string} 我的房间 ID */
    this.myRoomId = '';
    /** @type {string} 对方昵称 */
    this.friendNickname = '';
    /** @type {string} 我的昵称 */
    this.myNickname = '';
    /** @type {Object|null} 对方最新游戏状态 */
    this.friendState = null;
    /** @type {number} 对方最终得分 */
    this.friendFinalScore = 0;
    /** @type {string} 对方难度 */
    this.friendDifficulty = '';
    /** @type {boolean} 对方是否请求继续 */
    this.friendWantsPlayAgain = false;
    /** @type {boolean} 我是否请求继续 */
    this.myWantsPlayAgain = false;
    /** @type {number} 倒计时数值 */
    this.countdownValue = 0;
    /** @type {number|null} 倒计时定时器 */
    this.countdownTimer = null;
    /** @type {boolean} 我是房主 */
    this.isHost = false;

    // 回调
    this.onStateChange = null;    // (state) => {}
    this.onInviteReceived = null; // (nickname) => {}
    this.onGameStart = null;      // () => {}
    this.onFriendState = null;    // (state) => {}
    this.onFriendGameOver = null; // (score, difficulty) => {}
    this.onCountdown = null;      // (value) => {}
    this.onPlayAgainReady = null; // () => {}
    this.onFriendLeft = null;     // () => {}
    this.onError = null;          // (msg) => {}
  }

  // ========================================
  // 初始化 PeerJS
  // ========================================

  /**
   * 初始化 Peer（延迟到需要时才创建）
   * @returns {Promise<string>} 我的 Peer ID
   */
  async initPeer() {
    if (this.peer && !this.peer.destroyed) {
      return this.myRoomId;
    }

    return new Promise((resolve, reject) => {
      // 生成短房间码（6位字母数字）
      const roomId = 'snake-' + Math.random().toString(36).slice(2, 8);

      this.peer = new Peer(roomId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        this.myRoomId = id;
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this._handleIncoming(conn);
      });

      this.peer.on('error', (err) => {
        console.error('[MP] Peer error:', err);
        if (this.onError) this.onError('连接错误: ' + err.type);
        reject(err);
      });

      this.peer.on('disconnected', () => {
        // 尝试重连
        if (this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
      });
    });
  }

  // ========================================
  // 创建房间（邀请方）
  // ========================================

  /**
   * 创建房间并等待好友加入
   * @param {string} nickname - 我的昵称
   * @returns {Promise<string>} 房间 ID
   */
  async createRoom(nickname) {
    this.myNickname = nickname;
    this.isHost = true;
    this._setState(MPState.CREATING);

    const roomId = await this.initPeer();
    this._setState(MPState.WAITING);
    return roomId;
  }

  // ========================================
  // 加入房间（被邀请方）
  // ========================================

  /**
   * 通过房间码加入
   * @param {string} roomId - 对方的房间 ID
   * @param {string} nickname - 我的昵称
   */
  async joinRoom(roomId, nickname) {
    this.myNickname = nickname;
    this.isHost = false;
    this._setState(MPState.CONNECTING);

    await this.initPeer();

    const conn = this.peer.connect(roomId, { reliable: true });

    conn.on('open', () => {
      this.conn = conn;
      this._bindConnection(conn);
      // 发送邀请请求（带上我的昵称）
      this._send({ type: MsgType.INVITE, nickname: this.myNickname });
      this._setState(MPState.INVITED); // 等待对方响应
    });

    conn.on('error', (err) => {
      console.error('[MP] Connection error:', err);
      if (this.onError) this.onError('连接失败，请检查房间码');
      this._setState(MPState.IDLE);
    });
  }

  // ========================================
  // 邀请响应
  // ========================================

  /** 接受对方邀请 */
  acceptInvite() {
    this._send({ type: MsgType.ACCEPT, nickname: this.myNickname });
    this._startCountdown();
  }

  /** 拒绝对方邀请 */
  rejectInvite() {
    this._send({ type: MsgType.REJECT });
    this.disconnect();
  }

  // ========================================
  // 游戏状态同步
  // ========================================

  /**
   * 发送当前帧游戏状态
   * @param {Object} state - { snake, food, score, obstacles, difficulty, gridCols, gridRows }
   */
  sendGameState(state) {
    if (this.state !== MPState.PLAYING || !this.conn) return;
    this._send({
      type: MsgType.GAME_STATE,
      state: {
        snake: state.snake,
        food: state.food,
        score: state.score,
        obstacles: state.obstacles || [],
        difficulty: state.difficulty
      }
    });
  }

  /**
   * 发送游戏结束
   * @param {number} score
   * @param {string} difficulty
   */
  sendGameOver(score, difficulty) {
    this._send({ type: MsgType.GAME_OVER, score, difficulty });
  }

  /** 请求继续一起玩 */
  requestPlayAgain() {
    this.myWantsPlayAgain = true;
    this._send({ type: MsgType.PLAY_AGAIN });
    // 双方都同意则重新开始
    if (this.friendWantsPlayAgain) {
      this._bothReadyToPlayAgain();
    }
  }

  // ========================================
  // 连接管理
  // ========================================

  /** 断开连接 */
  disconnect() {
    if (this.conn) {
      try { this._send({ type: MsgType.LEAVE }); } catch (e) { /* ignore */ }
      this.conn.close();
      this.conn = null;
    }
    this._clearCountdown();
    this.friendState = null;
    this.friendWantsPlayAgain = false;
    this.myWantsPlayAgain = false;
    this._setState(MPState.IDLE);
  }

  /** 完全销毁 */
  destroy() {
    this.disconnect();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  /** 是否在对战中 */
  get isConnected() {
    return this.conn && this.conn.open;
  }

  /** 是否在游戏中 */
  get isInGame() {
    return this.state === MPState.PLAYING;
  }

  // ========================================
  // 内部方法
  // ========================================

  /** @private 处理来自好友的连接 */
  _handleIncoming(conn) {
    // 只允许一个好友
    if (this.conn) {
      conn.close();
      return;
    }
    this.conn = conn;
    this._bindConnection(conn);
  }

  /** @private 绑定连接事件 */
  _bindConnection(conn) {
    conn.on('data', (data) => this._onMessage(data));

    conn.on('close', () => {
      this.conn = null;
      this.friendState = null;
      if (this.onFriendLeft) this.onFriendLeft();
      this._setState(MPState.IDLE);
    });

    conn.on('error', (err) => {
      console.error('[MP] Data connection error:', err);
    });
  }

  /** @private 处理收到的消息 */
  _onMessage(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case MsgType.INVITE:
        // 收到邀请
        this.friendNickname = data.nickname || '好友';
        this._setState(MPState.INVITED);
        if (this.onInviteReceived) this.onInviteReceived(this.friendNickname);
        break;

      case MsgType.ACCEPT:
        // 邀请被接受
        this.friendNickname = data.nickname || '好友';
        this._startCountdown();
        break;

      case MsgType.REJECT:
        // 邀请被拒绝
        if (this.onError) this.onError('好友拒绝了你的邀请');
        this.disconnect();
        break;

      case MsgType.COUNTDOWN:
        this.countdownValue = data.value;
        if (this.onCountdown) this.onCountdown(data.value);
        if (data.value <= 0) {
          this._setState(MPState.PLAYING);
          if (this.onGameStart) this.onGameStart();
        }
        break;

      case MsgType.GAME_STATE:
        this.friendState = data.state;
        if (this.onFriendState) this.onFriendState(data.state);
        break;

      case MsgType.GAME_OVER:
        this.friendFinalScore = data.score;
        this.friendDifficulty = data.difficulty;
        if (this.onFriendGameOver) this.onFriendGameOver(data.score, data.difficulty);
        break;

      case MsgType.PLAY_AGAIN:
        this.friendWantsPlayAgain = true;
        if (this.myWantsPlayAgain) {
          this._bothReadyToPlayAgain();
        }
        break;

      case MsgType.LEAVE:
        this.conn = null;
        this.friendState = null;
        if (this.onFriendLeft) this.onFriendLeft();
        this._setState(MPState.IDLE);
        break;
    }
  }

  /** @private 发送消息 */
  _send(data) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  /** @private 设置状态 */
  _setState(state) {
    this.state = state;
    if (this.onStateChange) this.onStateChange(state);
  }

  /** @private 开始倒计时（房主驱动） */
  _startCountdown() {
    this._setState(MPState.COUNTDOWN);
    this.friendWantsPlayAgain = false;
    this.myWantsPlayAgain = false;

    if (this.isHost) {
      // 房主负责驱动倒计时
      this.countdownValue = 3;
      if (this.onCountdown) this.onCountdown(3);
      this._send({ type: MsgType.COUNTDOWN, value: 3 });

      this.countdownTimer = setInterval(() => {
        this.countdownValue--;
        this._send({ type: MsgType.COUNTDOWN, value: this.countdownValue });
        if (this.onCountdown) this.onCountdown(this.countdownValue);

        if (this.countdownValue <= 0) {
          this._clearCountdown();
          this._setState(MPState.PLAYING);
          if (this.onGameStart) this.onGameStart();
        }
      }, 1000);
    }
  }

  /** @private 清除倒计时 */
  _clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  /** @private 双方都同意继续 */
  _bothReadyToPlayAgain() {
    this.friendWantsPlayAgain = false;
    this.myWantsPlayAgain = false;
    this.friendState = null;
    this.friendFinalScore = 0;
    if (this.onPlayAgainReady) this.onPlayAgainReady();
    this._startCountdown();
  }
}

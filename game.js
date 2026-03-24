/**
 * 贪吃蛇游戏核心逻辑
 * 使用 Canvas 渲染，支持键盘和触摸控制
 * 模块化设计，遵循最佳实践
 * 
 * 整合皮肤系统 - 支持多种皮肤和特效
 */

// ========================================
// 游戏配置常量
// ========================================
const CONFIG = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    GRID_SIZE: 20,
    INITIAL_SPEED: 150,
    SPEED_INCREMENT: 5,
    MIN_SPEED: 50,
    COLORS: {
        SNAKE_BODY: '#4CAF50',
        SNAKE_HEAD: '#66BB6A',
        FOOD: '#FF5252',
        GRID_LINE: 'rgba(255, 255, 255, 0.05)',
        BACKGROUND: '#0f0f23'
    }
};

// ========================================
// 难度设置
// ========================================
const DIFFICULTY_SETTINGS = {
    easy: {
        initialSpeed: 8,      // 初始速度（格/秒）
        speedIncrease: 0.3,   // 每吃一个食物增加的速度
        scoreMultiplier: 1,   // 分数倍率
        obstacles: false      // 是否有障碍物
    },
    hard: {
        initialSpeed: 12,
        speedIncrease: 0.6,
        scoreMultiplier: 2,
        obstacles: false
    },
    hell: {
        initialSpeed: 18,
        speedIncrease: 1.0,
        scoreMultiplier: 3,
        obstacles: true       // 随机障碍物
    }
};

// 难度显示名称映射
const DIFFICULTY_NAMES = {
    easy: { text: '容易', class: 'easy', icon: '🟢' },
    hard: { text: '困难', class: 'hard', icon: '🟡' },
    hell: { text: '地狱', class: 'hell', icon: '🔴' }
};

// ========================================
// 游戏状态枚举
// ========================================
const GameState = {
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// ========================================
// 方向枚举
// ========================================
const Direction = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// ========================================
// 游戏主类
// ========================================
class SnakeGame {
    /**
     * 初始化游戏
     */
    constructor() {
        // 获取 DOM 元素
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('currentScore');
        this.highScoreElement = document.getElementById('highScore');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        
        // 难度选择相关元素
        this.difficultySelector = document.getElementById('difficultySelector');
        this.difficultyDisplay = document.getElementById('difficultyDisplay');
        this.currentDifficultyElement = document.getElementById('currentDifficulty');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        
        // 皮肤选择相关元素
        this.skinSelector = document.getElementById('skinSelector');
        this.skinOptions = document.getElementById('skinOptions');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;
        this.backToDifficultyBtn = document.getElementById('backToDifficultyBtn');

        // 游戏状态
        this.state = GameState.READY;
        this.score = 0;
        this.currentDifficulty = 'easy'; // 默认难度
        this.highScore = this.loadHighScore();
        this.speed = CONFIG.INITIAL_SPEED;
        this.gameLoop = null;

        // 蛇和食物
        this.snake = [];
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        this.food = null;
        
        // 障碍物（地狱难度）
        this.obstacles = [];
        
        // 皮肤系统
        this.skinManager = new SkinManager();
        this.currentSkin = this.skinManager.getCurrentSkin();
        
        // 特效动画相关
        this.effectFrame = 0;

        // 初始化
        this.init();
    }

    /**
     * 初始化游戏设置
     */
    init() {
        // 设置画布尺寸
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // 设置默认难度
        this.selectDifficulty('easy');

        // 更新最高分显示
        this.updateHighScoreDisplay();

        // 绑定事件监听器
        this.bindEvents();
        
        // 绑定难度选择事件
        this.bindDifficultySelector();
        
        // 绑定皮肤选择事件
        this.bindSkinSelector();

        // 绘制初始画面
        this.draw();
        
        // 渲染皮肤选择界面
        this.renderSkinSelector();
        
        // 更新初始覆盖层消息
        this.overlayMessage.textContent = '请先选择难度，然后选择皮肤开始游戏';
        
        // 确保底部按钮栏可见（初始状态）
        const buttonsContainer = this.startBtn.closest('.overlay-buttons');
        if (buttonsContainer) {
            buttonsContainer.style.display = 'flex';
        }
        this.startBtn.textContent = '开始游戏';
        this.pauseBtn.style.display = 'none';
    }

    /**
     * 绑定所有事件监听器
     */
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 按钮事件
        this.startBtn.addEventListener('click', () => {
            // 如果在皮肤选择界面，先返回难度选择
            if (this.skinSelector && this.skinSelector.style.display !== 'none') {
                this.showDifficultySelector();
            } else {
                this.startGame();
            }
        });
        this.pauseBtn.addEventListener('click', () => this.togglePause());

        // 移动端触摸控制
        this.bindTouchControls();

        // 移动端按钮控制
        this.bindMobileButtons();

        // 防止移动端滚动
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }
    
    /**
     * 绑定皮肤选择器事件
     */
    bindSkinSelector() {
        // 返回难度选择按钮
        if (this.backToDifficultyBtn) {
            this.backToDifficultyBtn.addEventListener('click', () => {
                this.showDifficultySelector();
            });
        }
    }

    /**
     * 绑定难度选择器事件
     */
    bindDifficultySelector() {
        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.difficulty;
                this.selectDifficulty(difficulty);
                // 选择难度后，进入皮肤选择界面
                this.showSkinSelector();
            });
        });
    }

    /**
     * 选择难度
     * @param {string} difficulty - 难度级别
     */
    selectDifficulty(difficulty) {
        if (!DIFFICULTY_SETTINGS[difficulty]) return;
        
        this.currentDifficulty = difficulty;
        
        // 更新按钮选中状态
        this.difficultyButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('selected');
            }
        });
        
        // 更新难度显示
        this.updateDifficultyDisplay();
    }
    
    /**
     * 显示难度选择器
     */
    showDifficultySelector() {
        if (this.difficultySelector) {
            this.difficultySelector.style.display = 'block';
        }
        if (this.skinSelector) {
            this.skinSelector.style.display = 'none';
        }
        this.overlayTitle.textContent = '贪吃蛇游戏';
        this.overlayMessage.textContent = '使用方向键或 WASD 控制蛇的移动';
    }
    
    /**
     * 显示皮肤选择器
     */
    showSkinSelector() {
        if (this.difficultySelector) {
            this.difficultySelector.style.display = 'none';
        }
        if (this.skinSelector) {
            this.skinSelector.style.display = 'block';
        }
        this.overlayTitle.textContent = '选择皮肤';
        this.overlayMessage.textContent = '选择你喜欢的蛇皮肤';
        this.renderSkinSelector();
    }
    
    /**
     * 渲染皮肤选择界面
     */
    renderSkinSelector() {
        if (!this.skinOptions) return;
        
        this.skinOptions.innerHTML = '';
        const skins = this.skinManager.getAllSkins();
        
        Object.values(skins).forEach(skin => {
            const isUnlocked = this.skinManager.isUnlocked(skin.id);
            const isSelected = this.skinManager.selectedSkinId === skin.id;
            const progress = this.skinManager.getUnlockProgress(skin.id);
            
            const skinDiv = document.createElement('div');
            skinDiv.className = `skin-option ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            skinDiv.dataset.skinId = skin.id;
            
            // 锁图标
            if (!isUnlocked) {
                const lockIcon = document.createElement('span');
                lockIcon.className = 'skin-lock';
                lockIcon.textContent = '🔒';
                skinDiv.appendChild(lockIcon);
            }
            
            // 图标
            const iconDiv = document.createElement('div');
            iconDiv.className = 'skin-icon';
            iconDiv.textContent = skin.icon;
            skinDiv.appendChild(iconDiv);
            
            // 名称
            const nameDiv = document.createElement('div');
            nameDiv.className = 'skin-name';
            nameDiv.textContent = skin.name;
            skinDiv.appendChild(nameDiv);
            
            // 描述
            const descDiv = document.createElement('div');
            descDiv.className = 'skin-description';
            descDiv.textContent = isUnlocked ? skin.description : `解锁：${this.getUnlockDescription(skin)}`;
            skinDiv.appendChild(descDiv);
            
            // 进度条（未解锁时显示）
            if (!isUnlocked && progress && progress.progress < 100) {
                const progressDiv = document.createElement('div');
                progressDiv.className = 'skin-progress';
                const progressBar = document.createElement('div');
                progressBar.className = 'skin-progress-bar';
                progressBar.style.width = `${progress.progress}%`;
                progressDiv.appendChild(progressBar);
                skinDiv.appendChild(progressDiv);
            }
            
            // 点击事件
            skinDiv.addEventListener('click', () => {
                if (isUnlocked) {
                    this.selectSkin(skin.id);
                }
            });
            
            this.skinOptions.appendChild(skinDiv);
        });
        
        // 更新预览
        this.updateSkinPreview();
    }
    
    /**
     * 获取解锁条件描述
     * @param {Object} skin - 皮肤配置
     * @returns {string} 解锁描述
     */
    getUnlockDescription(skin) {
        if (skin.unlockType === 'score') {
            return `得分达到 ${skin.unlockCondition}`;
        } else if (skin.unlockType === 'achievement') {
            if (skin.unlockCondition === 'win_all_difficulties') {
                return '通关所有难度';
            } else if (skin.unlockCondition === 'score_2000') {
                return '单次得分 2000+';
            }
        }
        return '';
    }
    
    /**
     * 选择皮肤
     * @param {string} skinId - 皮肤 ID
     */
    selectSkin(skinId) {
        if (this.skinManager.selectSkin(skinId)) {
            this.currentSkin = this.skinManager.getCurrentSkin();
            this.renderSkinSelector();
            this.updateSkinPreview();
        }
    }
    
    /**
     * 更新皮肤预览
     */
    updateSkinPreview() {
        if (!this.previewCtx) return;
        
        const ctx = this.previewCtx;
        const canvas = this.previewCanvas;
        const skin = this.skinManager.getCurrentSkin();
        
        // 清空画布
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制预览蛇（3 节）
        const gridSize = 30;
        const startX = 40;
        const startY = (canvas.height - gridSize) / 2;
        
        for (let i = 0; i < 3; i++) {
            const x = startX - i * gridSize;
            const y = startY;
            
            let color;
            if (i === 0) {
                color = skin.headColor;
            } else {
                color = skin.bodyColor === 'gradient' ? skin.bodyColor : skin.bodyColor;
            }
            
            // 绘制形状
            this.drawPreviewSegment(ctx, x, y, gridSize, skin.shape, color, i === 0);
        }
    }
    
    /**
     * 绘制预览片段
     * @param {CanvasRenderingContext2D} ctx - 预览画布上下文
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} size - 大小
     * @param {string} shape - 形状
     * @param {string} color - 颜色
     * @param {boolean} isHead - 是否为头部
     */
    drawPreviewSegment(ctx, x, y, size, shape, color, isHead) {
        ctx.fillStyle = color;
        const halfSize = size / 2;
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        switch (shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(centerX, centerY, halfSize - 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(centerX, y + 2);
                ctx.lineTo(x + size - 2, centerY);
                ctx.lineTo(centerX, y + size - 2);
                ctx.lineTo(x + 2, centerY);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'square':
            default:
                this.roundRectWithCtx(ctx, x + 2, y + 2, size - 4, size - 4, 4);
                break;
        }
    }
    
    /**
     * 使用指定上下文绘制圆角矩形
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} radius - 圆角半径
     */
    roundRectWithCtx(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 绑定触摸滑动控制
     */
    bindTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // 判断滑动方向
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 水平滑动
                if (diffX > 0 && this.direction !== Direction.LEFT) {
                    this.nextDirection = Direction.RIGHT;
                } else if (diffX < 0 && this.direction !== Direction.RIGHT) {
                    this.nextDirection = Direction.LEFT;
                }
            } else {
                // 垂直滑动
                if (diffY > 0 && this.direction !== Direction.UP) {
                    this.nextDirection = Direction.DOWN;
                } else if (diffY < 0 && this.direction !== Direction.DOWN) {
                    this.nextDirection = Direction.UP;
                }
            }

            touchStartX = 0;
            touchStartY = 0;
        }, { passive: false });
    }

    /**
     * 绑定移动端虚拟按钮
     */
    bindMobileButtons() {
        const buttons = document.querySelectorAll('.control-btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.changeDirection(direction);
            });
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                this.changeDirection(direction);
            });
        });
    }

    /**
     * 处理键盘按键
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyPress(e) {
        // 空格键 - 暂停/继续
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.state === GameState.PLAYING) {
                this.togglePause();
            } else if (this.state === GameState.PAUSED) {
                this.togglePause();
            } else if (this.state === GameState.GAME_OVER || this.state === GameState.READY) {
                this.startGame();
            }
            return;
        }

        // 方向控制
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right'
        };

        const direction = keyMap[e.code];
        if (direction) {
            e.preventDefault();
            this.changeDirection(direction);
        }
    }

    /**
     * 改变蛇的移动方向
     * @param {string} direction - 方向字符串
     */
    changeDirection(direction) {
        if (this.state !== GameState.PLAYING) return;

        const directionMap = {
            'up': Direction.UP,
            'down': Direction.DOWN,
            'left': Direction.LEFT,
            'right': Direction.RIGHT
        };

        const newDirection = directionMap[direction];
        if (!newDirection) return;

        // 防止反向移动
        const isOpposite = (
            (newDirection === Direction.UP && this.direction === Direction.DOWN) ||
            (newDirection === Direction.DOWN && this.direction === Direction.UP) ||
            (newDirection === Direction.LEFT && this.direction === Direction.RIGHT) ||
            (newDirection === Direction.RIGHT && this.direction === Direction.LEFT)
        );

        if (!isOpposite) {
            this.nextDirection = newDirection;
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        // 重置游戏状态
        this.resetGame();

        // 更新状态
        this.state = GameState.PLAYING;

        // 隐藏难度/皮肤选择器，显示难度显示
        if (this.difficultySelector) {
            this.difficultySelector.style.display = 'none';
        }
        if (this.skinSelector) {
            this.skinSelector.style.display = 'none';
        }
        if (this.difficultyDisplay) {
            this.difficultyDisplay.style.display = 'flex';
        }

        // 隐藏覆盖层和底部按钮栏
        this.overlay.classList.add('hidden');
        
        // 隐藏底部按钮栏（游戏进行中不需要）
        const buttonsContainer = this.startBtn.closest('.overlay-buttons');
        if (buttonsContainer) {
            buttonsContainer.style.display = 'none';
        }
        
        // 显示暂停按钮（独立显示，用于游戏进行中暂停）
        this.pauseBtn.style.display = 'inline-block';
        this.pauseBtn.textContent = '暂停游戏';

        // 启动游戏循环
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    /**
     * 重置游戏
     */
    resetGame() {
        // 初始化蛇（居中位置，长度为 3）
        const startX = Math.floor(CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE / 2);
        const startY = Math.floor(CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE / 2);
        
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        // 重置方向
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;

        // 重置分数和速度
        this.score = 0;
        
        // 根据难度设置初始化速度
        const difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficulty];
        // 将格/秒转换为毫秒/格
        this.speed = Math.floor(1000 / difficultySettings.initialSpeed);
        this.currentSpeedIncrease = difficultySettings.speedIncrease;
        this.scoreMultiplier = difficultySettings.scoreMultiplier;
        
        this.updateScoreDisplay();
        this.updateDifficultyDisplay();

        // 生成第一个食物
        this.generateFood();
        
        // 生成障碍物（地狱难度）
        if (difficultySettings.obstacles) {
            this.generateObstacles();
        } else {
            this.obstacles = [];
        }
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            clearInterval(this.gameLoop);
            this.showOverlay('游戏暂停', '按空格键或点击继续按钮继续游戏', true);
            this.pauseBtn.textContent = '继续游戏';
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.overlay.classList.add('hidden');
            this.pauseBtn.textContent = '暂停游戏';
            this.gameLoop = setInterval(() => this.update(), this.speed);
        }
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.state = GameState.GAME_OVER;
        clearInterval(this.gameLoop);

        // 更新最高分（按难度分别记录）
        const difficultyHighScore = this.loadHighScoreForDifficulty(this.currentDifficulty);
        if (this.score > difficultyHighScore) {
            this.saveHighScoreForDifficulty(this.currentDifficulty, this.score);
        }
        
        // 记录分数到皮肤系统（用于解锁）
        this.skinManager.recordScore(this.currentDifficulty, this.score);
        
        // 检查成就解锁
        this.checkAchievements();
        
        // 更新显示为当前难度的最高分
        this.updateHighScoreDisplay();

        // 显示游戏结束界面
        const difficultyName = DIFFICULTY_NAMES[this.currentDifficulty].text;
        this.showOverlay(
            '游戏结束',
            `最终得分：${this.score}\n难度：${difficultyName}\n${this.score >= difficultyHighScore ? '🎉 新纪录！' : '再接再厉！'}`,
            true
        );
        
        // 隐藏暂停按钮（游戏已结束）
        this.pauseBtn.style.display = 'none';
        
        // 重新显示皮肤选择器（让玩家可以选择新解锁的皮肤）
        if (this.skinSelector) {
            this.skinSelector.style.display = 'block';
            this.renderSkinSelector(); // 重新渲染以显示解锁状态
        }
        if (this.difficultyDisplay) {
            this.difficultyDisplay.style.display = 'none';
        }
    }
    
    /**
     * 检查成就解锁
     */
    checkAchievements() {
        // 检查是否通关所有难度
        const easyHigh = this.loadHighScoreForDifficulty('easy');
        const hardHigh = this.loadHighScoreForDifficulty('hard');
        const hellHigh = this.loadHighScoreForDifficulty('hell');
        
        if (easyHigh > 0 && hardHigh > 0 && hellHigh > 0) {
            this.skinManager.recordAchievement('win_all_difficulties');
        }
        
        // 检查是否得分超过 2000
        if (this.score >= 2000) {
            this.skinManager.recordAchievement('score_2000');
        }
    }

    /**
     * 显示覆盖层
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {boolean} showButton - 是否显示按钮
     */
    showOverlay(title, message, showButton = false) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlay.classList.remove('hidden');
        
        // 控制底部按钮栏显示
        const buttonsContainer = this.startBtn.closest('.overlay-buttons');
        if (buttonsContainer) {
            buttonsContainer.style.display = showButton ? 'flex' : 'none';
        }
        
        if (showButton) {
            this.startBtn.textContent = '重新开始';
        }
    }

    /**
     * 游戏主循环 - 更新游戏状态
     */
    update() {
        // 更新方向
        this.direction = this.nextDirection;

        // 计算蛇头新位置
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // 检测碰撞
        if (this.checkCollision(newHead)) {
            this.gameOver();
            return;
        }

        // 移动蛇
        this.snake.unshift(newHead);

        // 检测是否吃到食物
        if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
            this.eatFood();
        } else {
            // 移除蛇尾
            this.snake.pop();
        }

        // 重绘
        this.draw();
    }

    /**
     * 检测碰撞
     * @param {Object} position - 位置对象
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision(position) {
        // 检测墙壁碰撞
        const gridWidth = CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE;
        const gridHeight = CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE;

        if (position.x < 0 || position.x >= gridWidth || 
            position.y < 0 || position.y >= gridHeight) {
            return true;
        }

        // 检测自身碰撞（从第 4 节开始检测，因为前 3 节不可能碰到）
        for (let i = 0; i < this.snake.length; i++) {
            if (position.x === this.snake[i].x && position.y === this.snake[i].y) {
                return true;
            }
        }
        
        // 检测障碍物碰撞（地狱难度）
        if (DIFFICULTY_SETTINGS[this.currentDifficulty].obstacles) {
            for (const obstacle of this.obstacles) {
                if (position.x === obstacle.x && position.y === obstacle.y) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 生成食物
     */
    generateFood() {
        const gridWidth = CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE;
        const gridHeight = CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE;

        let newFood;
        let isValid;

        // 确保食物不会生成在蛇身上或障碍物上
        do {
            isValid = true;
            newFood = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };

            for (const segment of this.snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    isValid = false;
                    break;
                }
            }
            
            // 检查是否在障碍物上
            if (isValid && this.obstacles.length > 0) {
                for (const obstacle of this.obstacles) {
                    if (obstacle.x === newFood.x && obstacle.y === newFood.y) {
                        isValid = false;
                        break;
                    }
                }
            }
        } while (!isValid);

        this.food = newFood;
    }

    /**
     * 生成障碍物（地狱难度）
     */
    generateObstacles() {
        const gridWidth = CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE;
        const gridHeight = CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE;
        const obstacleCount = 10; // 障碍物数量
        
        this.obstacles = [];
        
        for (let i = 0; i < obstacleCount; i++) {
            let obstacle;
            let isValid;
            
            do {
                isValid = true;
                obstacle = {
                    x: Math.floor(Math.random() * gridWidth),
                    y: Math.floor(Math.random() * gridHeight)
                };
                
                // 确保不生成在蛇身上
                for (const segment of this.snake) {
                    if (segment.x === obstacle.x && segment.y === obstacle.y) {
                        isValid = false;
                        break;
                    }
                }
                
                // 确保不生成在蛇头附近（给玩家反应空间）
                const head = this.snake[0];
                if (isValid && head) {
                    const distance = Math.abs(head.x - obstacle.x) + Math.abs(head.y - obstacle.y);
                    if (distance < 5) {
                        isValid = false;
                    }
                }
                
                // 确保不重复
                if (isValid) {
                    for (const existing of this.obstacles) {
                        if (existing.x === obstacle.x && existing.y === obstacle.y) {
                            isValid = false;
                            break;
                        }
                    }
                }
            } while (!isValid);
            
            this.obstacles.push(obstacle);
        }
    }

    /**
     * 吃食物
     */
    eatFood() {
        // 增加分数（根据难度倍率）
        this.score += 10 * this.scoreMultiplier;
        this.updateScoreDisplay();

        // 加快速度（根据难度递增）
        const settings = DIFFICULTY_SETTINGS[this.currentDifficulty];
        const newSpeed = 1000 / (1000 / this.speed + settings.speedIncrease);
        
        if (newSpeed > 0 && this.speed > CONFIG.MIN_SPEED) {
            this.speed = Math.max(CONFIG.MIN_SPEED, Math.floor(newSpeed));
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), this.speed);
        }

        // 生成新食物
        this.generateFood();
    }

    /**
     * 绘制游戏画面
     */
    draw() {
        // 清空画布
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // 绘制网格
        this.drawGrid();

        // 绘制障碍物
        this.drawObstacles();

        // 绘制食物
        this.drawFood();

        // 绘制蛇
        this.drawSnake();
    }

    /**
     * 绘制网格
     */
    drawGrid() {
        this.ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
        this.ctx.lineWidth = 1;

        // 垂直线
        for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += CONFIG.GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
            this.ctx.stroke();
        }

        // 水平线
        for (let y = 0; y <= CONFIG.CANVAS_HEIGHT; y += CONFIG.GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
    }

    /**
     * 绘制蛇
     */
    drawSnake() {
        const skin = this.currentSkin;
        this.effectFrame++;
        
        this.snake.forEach((segment, index) => {
            const x = segment.x * CONFIG.GRID_SIZE;
            const y = segment.y * CONFIG.GRID_SIZE;
            const isHead = index === 0;

            // 获取颜色（根据皮肤和位置）
            let color;
            if (isHead) {
                color = this.getHeadColor(skin, index);
            } else {
                color = this.getBodyColor(skin, index, this.snake.length);
            }

            // 绘制形状
            this.drawSnakeSegment(x, y, skin.shape, color, isHead);

            // 绘制特效
            if (skin.effect !== 'none') {
                this.drawEffect(x, y, skin.effect, index, isHead);
            }

            // 绘制蛇眼（仅蛇头）
            if (isHead) {
                this.drawEyes(x, y);
            }
        });
    }
    
    /**
     * 获取蛇头颜色
     * @param {Object} skin - 皮肤配置
     * @param {number} index - 蛇身索引
     * @returns {string} 颜色值
     */
    getHeadColor(skin, index) {
        if (skin.effect === 'rainbow') {
            return this.getRainbowColor(this.effectFrame);
        }
        return skin.headColor;
    }
    
    /**
     * 获取蛇身颜色
     * @param {Object} skin - 皮肤配置
     * @param {number} index - 蛇身索引
     * @param {number} totalLength - 蛇总长度
     * @returns {string} 颜色值
     */
    getBodyColor(skin, index, totalLength) {
        if (skin.effect === 'rainbow') {
            return this.getRainbowColor(this.effectFrame + index * 10);
        }
        if (skin.bodyColor === 'gradient') {
            // 渐变效果
            const ratio = index / totalLength;
            return this.interpolateColor(skin.headColor, '#000000', ratio);
        }
        return skin.bodyColor;
    }
    
    /**
     * 绘制蛇身片段
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {string} shape - 形状类型
     * @param {string} color - 颜色
     * @param {boolean} isHead - 是否为蛇头
     */
    drawSnakeSegment(x, y, shape, color, isHead) {
        this.ctx.fillStyle = color;
        
        const size = CONFIG.GRID_SIZE - 2;
        const halfSize = size / 2;
        const centerX = x + CONFIG.GRID_SIZE / 2;
        const centerY = y + CONFIG.GRID_SIZE / 2;
        
        switch (shape) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, halfSize, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, y + 1);
                this.ctx.lineTo(x + size, centerY);
                this.ctx.lineTo(centerX, y + size);
                this.ctx.lineTo(x + 1, centerY);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'arrow':
                this.drawArrowShape(x, y, size, isHead);
                break;
                
            case 'square':
            default:
                this.roundRect(x + 1, y + 1, size, size, 4);
                break;
        }
    }
    
    /**
     * 绘制箭头形状
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} size - 大小
     * @param {boolean} isHead - 是否为蛇头
     */
    drawArrowShape(x, y, size, isHead) {
        const centerX = x + CONFIG.GRID_SIZE / 2;
        const centerY = y + CONFIG.GRID_SIZE / 2;
        
        this.ctx.beginPath();
        
        if (isHead) {
            // 蛇头指向移动方向
            const dir = this.direction;
            if (dir === Direction.RIGHT) {
                this.ctx.moveTo(x + size, centerY);
                this.ctx.lineTo(x + 2, y + 2);
                this.ctx.lineTo(x + 2, y + size);
            } else if (dir === Direction.LEFT) {
                this.ctx.moveTo(x + 2, centerY);
                this.ctx.lineTo(x + size - 2, y + 2);
                this.ctx.lineTo(x + size - 2, y + size);
            } else if (dir === Direction.UP) {
                this.ctx.moveTo(centerX, y + 2);
                this.ctx.lineTo(x + 2, y + size - 2);
                this.ctx.lineTo(x + size - 2, y + size - 2);
            } else {
                this.ctx.moveTo(centerX, y + size - 2);
                this.ctx.lineTo(x + 2, y + 2);
                this.ctx.lineTo(x + size - 2, y + 2);
            }
        } else {
            // 蛇身简化为矩形
            this.roundRect(x + 1, y + 1, size, size, 2);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * 绘制特效
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {string} effect - 特效类型
     * @param {number} index - 蛇身索引
     * @param {boolean} isHead - 是否为蛇头
     */
    drawEffect(x, y, effect, index, isHead) {
        const centerX = x + CONFIG.GRID_SIZE / 2;
        const centerY = y + CONFIG.GRID_SIZE / 2;
        
        switch (effect) {
            case 'flame':
                this.drawFlameEffect(centerX, centerY, index);
                break;
            case 'sparkle':
                if (isHead && this.effectFrame % 20 < 10) {
                    this.drawSparkleEffect(centerX, centerY);
                }
                break;
            case 'glow':
                this.drawGlowEffect(x, y, index);
                break;
            case 'rainbow':
                // 彩虹效果已在颜色中体现
                break;
        }
    }
    
    /**
     * 绘制火焰特效
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} index - 蛇身索引
     */
    drawFlameEffect(x, y, index) {
        const flicker = Math.sin(this.effectFrame * 0.5 + index) * 3;
        this.ctx.fillStyle = `rgba(255, ${100 + flicker * 10}, 0, ${0.6 - index * 0.05})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 5 + flicker, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 绘制闪烁特效
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    drawSparkleEffect(x, y) {
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            this.ctx.beginPath();
            this.ctx.arc(x + offsetX, y + offsetY, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * 绘制发光特效
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} index - 蛇身索引
     */
    drawGlowEffect(x, y, index) {
        const glowSize = CONFIG.GRID_SIZE + 4 - index * 0.1;
        this.ctx.shadowColor = this.currentSkin.headColor;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        this.ctx.fillRect(x - 2, y - 2, glowSize, glowSize);
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 获取彩虹颜色
     * @param {number} frame - 帧数
     * @returns {string} 颜色值
     */
    getRainbowColor(frame) {
        const hue = (frame * 5) % 360;
        return `hsl(${hue}, 100%, 50%)`;
    }
    
    /**
     * 插值颜色
     * @param {string} color1 - 起始颜色
     * @param {string} color2 - 结束颜色
     * @param {number} ratio - 插值比例 (0-1)
     * @returns {string} 插值后的颜色
     */
    interpolateColor(color1, color2, ratio) {
        const hex1 = this.hexToRgb(color1);
        const hex2 = this.hexToRgb(color2);
        
        if (!hex1 || !hex2) return color1;
        
        const r = Math.round(hex1.r + (hex2.r - hex1.r) * ratio);
        const g = Math.round(hex1.g + (hex2.g - hex1.g) * ratio);
        const b = Math.round(hex1.b + (hex2.b - hex1.b) * ratio);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * HEX 转 RGB
     * @param {string} hex - HEX 颜色
     * @returns {Object|null} RGB 对象
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * 绘制障碍物
     */
    drawObstacles() {
        if (!this.obstacles || this.obstacles.length === 0) return;
        
        this.ctx.fillStyle = '#6B7280'; // 灰色障碍物
        
        this.obstacles.forEach(obstacle => {
            const x = obstacle.x * CONFIG.GRID_SIZE;
            const y = obstacle.y * CONFIG.GRID_SIZE;
            
            // 绘制障碍物（带边框的矩形）
            this.ctx.strokeStyle = '#4B5563';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 2, y + 2, CONFIG.GRID_SIZE - 4, CONFIG.GRID_SIZE - 4);
            this.ctx.fillRect(x + 4, y + 4, CONFIG.GRID_SIZE - 8, CONFIG.GRID_SIZE - 8);
        });
    }

    /**
     * 绘制蛇的眼睛
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    drawEyes(x, y) {
        this.ctx.fillStyle = '#000000';
        
        const eyeSize = 3;
        const eyeOffset = 5;

        // 根据方向调整眼睛位置
        let eye1X, eye1Y, eye2X, eye2Y;

        if (this.direction === Direction.RIGHT) {
            eye1X = x + CONFIG.GRID_SIZE - eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + CONFIG.GRID_SIZE - eyeOffset;
            eye2Y = y + CONFIG.GRID_SIZE - eyeOffset - eyeSize;
        } else if (this.direction === Direction.LEFT) {
            eye1X = x + eyeOffset - eyeSize;
            eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset - eyeSize;
            eye2Y = y + CONFIG.GRID_SIZE - eyeOffset - eyeSize;
        } else if (this.direction === Direction.UP) {
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset - eyeSize;
            eye2X = x + CONFIG.GRID_SIZE - eyeOffset - eyeSize;
            eye2Y = y + eyeOffset - eyeSize;
        } else { // DOWN
            eye1X = x + eyeOffset;
            eye1Y = y + CONFIG.GRID_SIZE - eyeOffset;
            eye2X = x + CONFIG.GRID_SIZE - eyeOffset - eyeSize;
            eye2Y = y + CONFIG.GRID_SIZE - eyeOffset;
        }

        this.ctx.beginPath();
        this.ctx.arc(eye1X + eyeSize / 2, eye1Y + eyeSize / 2, eyeSize, 0, Math.PI * 2);
        this.ctx.arc(eye2X + eyeSize / 2, eye2Y + eyeSize / 2, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * 绘制食物
     */
    drawFood() {
        if (!this.food) return;

        const x = this.food.x * CONFIG.GRID_SIZE;
        const y = this.food.y * CONFIG.GRID_SIZE;

        // 绘制圆形食物
        this.ctx.fillStyle = CONFIG.COLORS.FOOD;
        this.ctx.beginPath();
        this.ctx.arc(
            x + CONFIG.GRID_SIZE / 2,
            y + CONFIG.GRID_SIZE / 2,
            CONFIG.GRID_SIZE / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // 添加高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            x + CONFIG.GRID_SIZE / 2 - 3,
            y + CONFIG.GRID_SIZE / 2 - 3,
            CONFIG.GRID_SIZE / 6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    /**
     * 绘制圆角矩形
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} radius - 圆角半径
     */
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 更新分数显示
     */
    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
    }

    /**
     * 更新最高分显示
     */
    updateHighScoreDisplay() {
        const highScore = this.loadHighScoreForDifficulty(this.currentDifficulty);
        this.highScoreElement.textContent = highScore;
    }

    /**
     * 更新难度显示
     */
    updateDifficultyDisplay() {
        if (!this.currentDifficultyElement) return;
        
        const difficultyInfo = DIFFICULTY_NAMES[this.currentDifficulty];
        this.currentDifficultyElement.textContent = `${difficultyInfo.icon} ${difficultyInfo.text}`;
        this.currentDifficultyElement.className = `difficulty-value ${difficultyInfo.class}`;
    }

    /**
     * 从本地存储加载最高分（按难度）
     * @param {string} difficulty - 难度级别
     * @returns {number} 最高分
     */
    loadHighScoreForDifficulty(difficulty) {
        const saved = localStorage.getItem(`snakeHighScore_${difficulty}`);
        return saved ? parseInt(saved, 10) : 0;
    }

    /**
     * 保存最高分到本地存储（按难度）
     * @param {string} difficulty - 难度级别
     * @param {number} score - 分数
     */
    saveHighScoreForDifficulty(difficulty, score) {
        localStorage.setItem(`snakeHighScore_${difficulty}`, score.toString());
    }

    /**
     * 从本地存储加载最高分（兼容旧版）
     * @returns {number} 最高分
     */
    loadHighScore() {
        // 优先加载当前难度的最高分
        return this.loadHighScoreForDifficulty(this.currentDifficulty);
    }

    /**
     * 保存最高分到本地存储（兼容旧版）
     */
    saveHighScore() {
        // 同时保存当前难度的最高分和旧版格式
        this.saveHighScoreForDifficulty(this.currentDifficulty, this.highScore);
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
}

// ========================================
// 启动游戏
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();
});

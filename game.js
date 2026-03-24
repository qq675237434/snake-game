/**
 * 贪吃蛇游戏核心逻辑
 * 使用 Canvas 渲染，支持键盘和触摸控制
 * 模块化设计，遵循最佳实践
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

        // 游戏状态
        this.state = GameState.READY;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.speed = CONFIG.INITIAL_SPEED;
        this.gameLoop = null;

        // 蛇和食物
        this.snake = [];
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        this.food = null;

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

        // 更新最高分显示
        this.updateHighScoreDisplay();

        // 绑定事件监听器
        this.bindEvents();

        // 绘制初始画面
        this.draw();
    }

    /**
     * 绑定所有事件监听器
     */
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 按钮事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());

        // 移动端触摸控制
        this.bindTouchControls();

        // 移动端按钮控制
        this.bindMobileButtons();

        // 防止移动端滚动
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
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

        // 隐藏覆盖层
        this.overlay.classList.add('hidden');
        this.pauseBtn.style.display = 'inline-block';

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
        this.speed = CONFIG.INITIAL_SPEED;
        this.updateScoreDisplay();

        // 生成第一个食物
        this.generateFood();
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

        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }

        // 显示游戏结束界面
        this.showOverlay(
            '游戏结束',
            `最终得分：${this.score}\n${this.score >= this.highScore ? '🎉 新纪录！' : '再接再厉！'}`,
            true
        );
        this.pauseBtn.style.display = 'none';
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
        
        if (showButton) {
            this.startBtn.textContent = '重新开始';
            this.startBtn.style.display = 'inline-block';
        } else {
            this.startBtn.style.display = 'none';
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

        // 确保食物不会生成在蛇身上
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
        } while (!isValid);

        this.food = newFood;
    }

    /**
     * 吃食物
     */
    eatFood() {
        // 增加分数
        this.score += 10;
        this.updateScoreDisplay();

        // 加快速度
        if (this.speed > CONFIG.MIN_SPEED) {
            this.speed -= CONFIG.SPEED_INCREMENT;
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
        this.snake.forEach((segment, index) => {
            const x = segment.x * CONFIG.GRID_SIZE;
            const y = segment.y * CONFIG.GRID_SIZE;

            // 蛇头颜色不同
            this.ctx.fillStyle = index === 0 ? CONFIG.COLORS.SNAKE_HEAD : CONFIG.COLORS.SNAKE_BODY;

            // 绘制圆角矩形
            this.roundRect(
                x + 1,
                y + 1,
                CONFIG.GRID_SIZE - 2,
                CONFIG.GRID_SIZE - 2,
                4
            );

            // 绘制蛇眼（仅蛇头）
            if (index === 0) {
                this.drawEyes(x, y);
            }
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
        this.highScoreElement.textContent = this.highScore;
    }

    /**
     * 从本地存储加载最高分
     * @returns {number} 最高分
     */
    loadHighScore() {
        const saved = localStorage.getItem('snakeHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }

    /**
     * 保存最高分到本地存储
     */
    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
}

// ========================================
// 启动游戏
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();
});

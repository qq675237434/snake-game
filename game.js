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
        initialSpeed: 8,
        speedIncrease: 0.3,
        scoreMultiplier: 1,
        obstacles: false
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
        obstacles: true
    }
};

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
    constructor() {
        // Canvas 元素
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('currentScore');
        this.highScoreElement = document.getElementById('highScore');
        
        // 覆盖层元素
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        
        // 难度面板（游戏框下方）
        this.difficultyPanel = document.getElementById('difficultyPanel');
        this.difficultyDisplay = document.getElementById('difficultyDisplay');
        this.currentDifficultyElement = document.getElementById('currentDifficulty');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        
        // 皮肤面板（游戏框下方）
        this.skinPanel = document.getElementById('skinPanel');
        this.skinOptions = document.getElementById('skinOptions');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;

        // 游戏状态
        this.state = GameState.READY;
        this.score = 0;
        this.currentDifficulty = 'easy';
        this.highScore = 0;
        this.speed = CONFIG.INITIAL_SPEED;
        this.gameLoop = null;

        // 蛇和食物
        this.snake = [];
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        this.food = null;
        this.obstacles = [];
        
        // 皮肤系统
        this.skinManager = new SkinManager();
        this.currentSkin = this.skinManager.getCurrentSkin();
        this.effectFrame = 0;

        this.init();
    }

    init() {
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        this.selectDifficulty('easy');
        this.updateHighScoreDisplay();
        this.bindEvents();
        this.bindDifficultySelector();
        this.renderSkinSelector();
        this.draw();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.bindTouchControls();
        this.bindMobileButtons();
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }

    bindDifficultySelector() {
        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.difficulty;
                this.selectDifficulty(difficulty);
            });
        });
    }

    selectDifficulty(difficulty) {
        if (!DIFFICULTY_SETTINGS[difficulty]) return;
        this.currentDifficulty = difficulty;
        this.difficultyButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('selected');
            }
        });
        this.updateDifficultyDisplay();
        this.updateHighScoreDisplay();
    }

    // ========================================
    // 皮肤选择器
    // ========================================
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
            
            if (!isUnlocked) {
                const lockIcon = document.createElement('span');
                lockIcon.className = 'skin-lock';
                lockIcon.textContent = '🔒';
                skinDiv.appendChild(lockIcon);
            }
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'skin-icon';
            iconDiv.textContent = skin.icon;
            skinDiv.appendChild(iconDiv);
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'skin-name';
            nameDiv.textContent = skin.name;
            skinDiv.appendChild(nameDiv);
            
            const descDiv = document.createElement('div');
            descDiv.className = 'skin-description';
            descDiv.textContent = isUnlocked ? skin.description : `解锁：${this.getUnlockDescription(skin)}`;
            skinDiv.appendChild(descDiv);
            
            if (!isUnlocked && progress && progress.progress < 100) {
                const progressDiv = document.createElement('div');
                progressDiv.className = 'skin-progress';
                const progressBar = document.createElement('div');
                progressBar.className = 'skin-progress-bar';
                progressBar.style.width = `${progress.progress}%`;
                progressDiv.appendChild(progressBar);
                skinDiv.appendChild(progressDiv);
            }
            
            skinDiv.addEventListener('click', () => {
                if (isUnlocked) this.selectSkin(skin.id);
            });
            
            this.skinOptions.appendChild(skinDiv);
        });
        
        this.updateSkinPreview();
    }

    getUnlockDescription(skin) {
        if (skin.unlockType === 'score') return `得分达到 ${skin.unlockCondition}`;
        if (skin.unlockType === 'achievement') {
            if (skin.unlockCondition === 'win_all_difficulties') return '通关所有难度';
            if (skin.unlockCondition === 'score_2000') return '单次得分 2000+';
        }
        return '';
    }

    selectSkin(skinId) {
        if (this.skinManager.selectSkin(skinId)) {
            this.currentSkin = this.skinManager.getCurrentSkin();
            this.renderSkinSelector();
        }
    }

    updateSkinPreview() {
        if (!this.previewCtx) return;
        const ctx = this.previewCtx;
        const canvas = this.previewCanvas;
        const skin = this.skinManager.getCurrentSkin();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const gridSize = 30;
        const startX = 40;
        const startY = (canvas.height - gridSize) / 2;
        
        for (let i = 0; i < 3; i++) {
            const x = startX - i * gridSize;
            const y = startY;
            const color = i === 0 ? skin.headColor : skin.bodyColor;
            this.drawPreviewSegment(ctx, x, y, gridSize, skin.shape, color, i === 0);
        }
    }

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

    // ========================================
    // 触摸控制
    // ========================================
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

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0 && this.direction !== Direction.LEFT) this.nextDirection = Direction.RIGHT;
                else if (diffX < 0 && this.direction !== Direction.RIGHT) this.nextDirection = Direction.LEFT;
            } else {
                if (diffY > 0 && this.direction !== Direction.UP) this.nextDirection = Direction.DOWN;
                else if (diffY < 0 && this.direction !== Direction.DOWN) this.nextDirection = Direction.UP;
            }
            touchStartX = 0;
            touchStartY = 0;
        }, { passive: false });
    }

    bindMobileButtons() {
        const buttons = document.querySelectorAll('.control-btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.changeDirection(btn.dataset.direction);
            });
            btn.addEventListener('click', () => this.changeDirection(btn.dataset.direction));
        });
    }

    // ========================================
    // 键盘控制
    // ========================================
    handleKeyPress(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.state === GameState.PLAYING) this.togglePause();
            else if (this.state === GameState.PAUSED) this.togglePause();
            else if (this.state === GameState.GAME_OVER || this.state === GameState.READY) this.startGame();
            return;
        }

        const keyMap = {
            'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
            'KeyW': 'up', 'KeyS': 'down', 'KeyA': 'left', 'KeyD': 'right'
        };
        const direction = keyMap[e.code];
        if (direction) {
            e.preventDefault();
            this.changeDirection(direction);
        }
    }

    changeDirection(direction) {
        if (this.state !== GameState.PLAYING) return;
        const directionMap = { 'up': Direction.UP, 'down': Direction.DOWN, 'left': Direction.LEFT, 'right': Direction.RIGHT };
        const newDirection = directionMap[direction];
        if (!newDirection) return;

        const isOpposite = (
            (newDirection === Direction.UP && this.direction === Direction.DOWN) ||
            (newDirection === Direction.DOWN && this.direction === Direction.UP) ||
            (newDirection === Direction.LEFT && this.direction === Direction.RIGHT) ||
            (newDirection === Direction.RIGHT && this.direction === Direction.LEFT)
        );
        if (!isOpposite) this.nextDirection = newDirection;
    }

    // ========================================
    // 游戏流程
    // ========================================
    startGame() {
        this.resetGame();
        this.state = GameState.PLAYING;

        // 游戏进行中：禁用下方面板
        this.difficultyPanel.classList.add('disabled');
        this.skinPanel.classList.add('disabled');

        // 隐藏覆盖层
        this.overlay.classList.add('hidden');
        this.pauseBtn.style.display = 'inline-block';
        this.pauseBtn.textContent = '暂停游戏';

        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    resetGame() {
        const startX = Math.floor(CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE / 2);
        const startY = Math.floor(CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE / 2);
        
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
        this.score = 0;
        
        const difficultySettings = DIFFICULTY_SETTINGS[this.currentDifficulty];
        this.speed = Math.floor(1000 / difficultySettings.initialSpeed);
        this.currentSpeedIncrease = difficultySettings.speedIncrease;
        this.scoreMultiplier = difficultySettings.scoreMultiplier;
        
        this.updateScoreDisplay();
        this.updateDifficultyDisplay();
        this.generateFood();
        
        if (difficultySettings.obstacles) {
            this.generateObstacles();
        } else {
            this.obstacles = [];
        }
    }

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

    gameOver() {
        this.state = GameState.GAME_OVER;
        clearInterval(this.gameLoop);

        const difficultyHighScore = this.loadHighScoreForDifficulty(this.currentDifficulty);
        if (this.score > difficultyHighScore) {
            this.saveHighScoreForDifficulty(this.currentDifficulty, this.score);
        }
        
        this.skinManager.recordScore(this.currentDifficulty, this.score);
        this.checkAchievements();
        this.updateHighScoreDisplay();

        const difficultyName = DIFFICULTY_NAMES[this.currentDifficulty].text;
        this.showOverlay(
            '游戏结束',
            `最终得分：${this.score}\n难度：${difficultyName}\n${this.score >= difficultyHighScore ? '🎉 新纪录！' : '再接再厉！'}`,
            true
        );
        
        this.pauseBtn.style.display = 'none';

        // 游戏结束：恢复下方面板可操作
        this.difficultyPanel.classList.remove('disabled');
        this.skinPanel.classList.remove('disabled');
        this.renderSkinSelector(); // 刷新解锁状态
    }

    checkAchievements() {
        const easyHigh = this.loadHighScoreForDifficulty('easy');
        const hardHigh = this.loadHighScoreForDifficulty('hard');
        const hellHigh = this.loadHighScoreForDifficulty('hell');
        if (easyHigh > 0 && hardHigh > 0 && hellHigh > 0) {
            this.skinManager.recordAchievement('win_all_difficulties');
        }
        if (this.score >= 2000) {
            this.skinManager.recordAchievement('score_2000');
        }
    }

    showOverlay(title, message, showButton = false) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlay.classList.remove('hidden');
        
        const buttonsContainer = this.startBtn.closest('.overlay-buttons');
        if (buttonsContainer) {
            buttonsContainer.style.display = showButton ? 'flex' : 'none';
        }
        if (showButton) {
            this.startBtn.textContent = this.state === GameState.GAME_OVER ? '重新开始' : '开始游戏';
        }
    }

    // ========================================
    // 游戏主循环
    // ========================================
    update() {
        this.direction = this.nextDirection;
        const head = this.snake[0];
        const newHead = { x: head.x + this.direction.x, y: head.y + this.direction.y };

        if (this.checkCollision(newHead)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(newHead);
        if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
        }
        this.draw();
    }

    checkCollision(position) {
        const gridWidth = CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE;
        const gridHeight = CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE;

        if (position.x < 0 || position.x >= gridWidth || position.y < 0 || position.y >= gridHeight) return true;

        for (let i = 0; i < this.snake.length; i++) {
            if (position.x === this.snake[i].x && position.y === this.snake[i].y) return true;
        }
        
        if (DIFFICULTY_SETTINGS[this.currentDifficulty].obstacles) {
            for (const obstacle of this.obstacles) {
                if (position.x === obstacle.x && position.y === obstacle.y) return true;
            }
        }
        return false;
    }

    generateFood() {
        const gridWidth = CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE;
        const gridHeight = CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE;
        let newFood, isValid;

        do {
            isValid = true;
            newFood = { x: Math.floor(Math.random() * gridWidth), y: Math.floor(Math.random() * gridHeight) };
            for (const segment of this.snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) { isValid = false; break; }
            }
            if (isValid && this.obstacles.length > 0) {
                for (const obstacle of this.obstacles) {
                    if (obstacle.x === newFood.x && obstacle.y === newFood.y) { isValid = false; break; }
                }
            }
        } while (!isValid);
        this.food = newFood;
    }

    generateObstacles() {
        const gridWidth = CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE;
        const gridHeight = CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE;
        this.obstacles = [];
        
        for (let i = 0; i < 10; i++) {
            let obstacle, isValid;
            do {
                isValid = true;
                obstacle = { x: Math.floor(Math.random() * gridWidth), y: Math.floor(Math.random() * gridHeight) };
                for (const segment of this.snake) {
                    if (segment.x === obstacle.x && segment.y === obstacle.y) { isValid = false; break; }
                }
                if (isValid) {
                    const head = this.snake[0];
                    if (head && Math.abs(head.x - obstacle.x) + Math.abs(head.y - obstacle.y) < 5) isValid = false;
                }
                if (isValid) {
                    for (const existing of this.obstacles) {
                        if (existing.x === obstacle.x && existing.y === obstacle.y) { isValid = false; break; }
                    }
                }
            } while (!isValid);
            this.obstacles.push(obstacle);
        }
    }

    eatFood() {
        this.score += 10 * this.scoreMultiplier;
        this.updateScoreDisplay();

        const settings = DIFFICULTY_SETTINGS[this.currentDifficulty];
        const newSpeed = 1000 / (1000 / this.speed + settings.speedIncrease);
        if (newSpeed > 0 && this.speed > CONFIG.MIN_SPEED) {
            this.speed = Math.max(CONFIG.MIN_SPEED, Math.floor(newSpeed));
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), this.speed);
        }
        this.generateFood();
    }

    // ========================================
    // 绘制
    // ========================================
    draw() {
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.drawGrid();
        this.drawObstacles();
        this.drawFood();
        this.drawSnake();
    }

    drawGrid() {
        this.ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += CONFIG.GRID_SIZE) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, CONFIG.CANVAS_HEIGHT); this.ctx.stroke();
        }
        for (let y = 0; y <= CONFIG.CANVAS_HEIGHT; y += CONFIG.GRID_SIZE) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(CONFIG.CANVAS_WIDTH, y); this.ctx.stroke();
        }
    }

    drawSnake() {
        const skin = this.currentSkin;
        this.effectFrame++;
        
        this.snake.forEach((segment, index) => {
            const x = segment.x * CONFIG.GRID_SIZE;
            const y = segment.y * CONFIG.GRID_SIZE;
            const isHead = index === 0;

            let color;
            if (isHead) color = this.getHeadColor(skin, index);
            else color = this.getBodyColor(skin, index, this.snake.length);

            this.drawSnakeSegment(x, y, skin.shape, color, isHead);
            if (skin.effect !== 'none') this.drawEffect(x, y, skin.effect, index, isHead);
            if (isHead) this.drawEyes(x, y);
        });
    }

    getHeadColor(skin, index) {
        return skin.effect === 'rainbow' ? this.getRainbowColor(this.effectFrame) : skin.headColor;
    }

    getBodyColor(skin, index, totalLength) {
        if (skin.effect === 'rainbow') return this.getRainbowColor(this.effectFrame + index * 10);
        if (skin.bodyColor === 'gradient') return this.interpolateColor(skin.headColor, '#000000', index / totalLength);
        return skin.bodyColor;
    }

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

    drawArrowShape(x, y, size, isHead) {
        const centerX = x + CONFIG.GRID_SIZE / 2;
        const centerY = y + CONFIG.GRID_SIZE / 2;
        this.ctx.beginPath();
        
        if (isHead) {
            const dir = this.direction;
            if (dir === Direction.RIGHT) { this.ctx.moveTo(x + size, centerY); this.ctx.lineTo(x + 2, y + 2); this.ctx.lineTo(x + 2, y + size); }
            else if (dir === Direction.LEFT) { this.ctx.moveTo(x + 2, centerY); this.ctx.lineTo(x + size - 2, y + 2); this.ctx.lineTo(x + size - 2, y + size); }
            else if (dir === Direction.UP) { this.ctx.moveTo(centerX, y + 2); this.ctx.lineTo(x + 2, y + size - 2); this.ctx.lineTo(x + size - 2, y + size - 2); }
            else { this.ctx.moveTo(centerX, y + size - 2); this.ctx.lineTo(x + 2, y + 2); this.ctx.lineTo(x + size - 2, y + 2); }
        } else {
            this.roundRect(x + 1, y + 1, size, size, 2);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawEffect(x, y, effect, index, isHead) {
        const centerX = x + CONFIG.GRID_SIZE / 2;
        const centerY = y + CONFIG.GRID_SIZE / 2;
        
        switch (effect) {
            case 'flame':
                this.drawFlameEffect(centerX, centerY, index);
                break;
            case 'sparkle':
                if (isHead && this.effectFrame % 20 < 10) this.drawSparkleEffect(centerX, centerY);
                break;
            case 'glow':
                this.drawGlowEffect(x, y, index);
                break;
        }
    }

    drawFlameEffect(x, y, index) {
        const flicker = Math.sin(this.effectFrame * 0.5 + index) * 3;
        this.ctx.fillStyle = `rgba(255, ${100 + flicker * 10}, 0, ${0.6 - index * 0.05})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 5 + flicker, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSparkleEffect(x, y) {
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawGlowEffect(x, y, index) {
        const glowSize = CONFIG.GRID_SIZE + 4 - index * 0.1;
        this.ctx.shadowColor = this.currentSkin.headColor;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        this.ctx.fillRect(x - 2, y - 2, glowSize, glowSize);
        this.ctx.shadowBlur = 0;
    }

    getRainbowColor(frame) { return `hsl(${(frame * 5) % 360}, 100%, 50%)`; }

    interpolateColor(color1, color2, ratio) {
        const hex1 = this.hexToRgb(color1);
        const hex2 = this.hexToRgb(color2);
        if (!hex1 || !hex2) return color1;
        return `rgb(${Math.round(hex1.r + (hex2.r - hex1.r) * ratio)}, ${Math.round(hex1.g + (hex2.g - hex1.g) * ratio)}, ${Math.round(hex1.b + (hex2.b - hex1.b) * ratio)})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    }

    drawObstacles() {
        if (!this.obstacles || this.obstacles.length === 0) return;
        this.ctx.fillStyle = '#6B7280';
        this.obstacles.forEach(obstacle => {
            const x = obstacle.x * CONFIG.GRID_SIZE;
            const y = obstacle.y * CONFIG.GRID_SIZE;
            this.ctx.strokeStyle = '#4B5563';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 2, y + 2, CONFIG.GRID_SIZE - 4, CONFIG.GRID_SIZE - 4);
            this.ctx.fillRect(x + 4, y + 4, CONFIG.GRID_SIZE - 8, CONFIG.GRID_SIZE - 8);
        });
    }

    drawEyes(x, y) {
        this.ctx.fillStyle = '#000000';
        const eyeSize = 3, eyeOffset = 5;
        let eye1X, eye1Y, eye2X, eye2Y;

        if (this.direction === Direction.RIGHT) {
            eye1X = x + CONFIG.GRID_SIZE - eyeOffset; eye1Y = y + eyeOffset;
            eye2X = x + CONFIG.GRID_SIZE - eyeOffset; eye2Y = y + CONFIG.GRID_SIZE - eyeOffset - eyeSize;
        } else if (this.direction === Direction.LEFT) {
            eye1X = x + eyeOffset - eyeSize; eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset - eyeSize; eye2Y = y + CONFIG.GRID_SIZE - eyeOffset - eyeSize;
        } else if (this.direction === Direction.UP) {
            eye1X = x + eyeOffset; eye1Y = y + eyeOffset - eyeSize;
            eye2X = x + CONFIG.GRID_SIZE - eyeOffset - eyeSize; eye2Y = y + eyeOffset - eyeSize;
        } else {
            eye1X = x + eyeOffset; eye1Y = y + CONFIG.GRID_SIZE - eyeOffset;
            eye2X = x + CONFIG.GRID_SIZE - eyeOffset - eyeSize; eye2Y = y + CONFIG.GRID_SIZE - eyeOffset;
        }

        this.ctx.beginPath();
        this.ctx.arc(eye1X + eyeSize / 2, eye1Y + eyeSize / 2, eyeSize, 0, Math.PI * 2);
        this.ctx.arc(eye2X + eyeSize / 2, eye2Y + eyeSize / 2, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawFood() {
        if (!this.food) return;
        const x = this.food.x * CONFIG.GRID_SIZE;
        const y = this.food.y * CONFIG.GRID_SIZE;

        this.ctx.fillStyle = CONFIG.COLORS.FOOD;
        this.ctx.beginPath();
        this.ctx.arc(x + CONFIG.GRID_SIZE / 2, y + CONFIG.GRID_SIZE / 2, CONFIG.GRID_SIZE / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x + CONFIG.GRID_SIZE / 2 - 3, y + CONFIG.GRID_SIZE / 2 - 3, CONFIG.GRID_SIZE / 6, 0, Math.PI * 2);
        this.ctx.fill();
    }

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

    // ========================================
    // 分数与存储
    // ========================================
    updateScoreDisplay() { this.scoreElement.textContent = this.score; }

    updateHighScoreDisplay() {
        const highScore = this.loadHighScoreForDifficulty(this.currentDifficulty);
        this.highScoreElement.textContent = highScore;
    }

    updateDifficultyDisplay() {
        if (!this.currentDifficultyElement) return;
        const info = DIFFICULTY_NAMES[this.currentDifficulty];
        this.currentDifficultyElement.textContent = `${info.icon} ${info.text}`;
        this.currentDifficultyElement.className = `difficulty-value ${info.class}`;
    }

    loadHighScoreForDifficulty(difficulty) {
        const saved = localStorage.getItem(`snakeHighScore_${difficulty}`);
        return saved ? parseInt(saved, 10) : 0;
    }

    saveHighScoreForDifficulty(difficulty, score) {
        localStorage.setItem(`snakeHighScore_${difficulty}`, score.toString());
    }

    loadHighScore() { return this.loadHighScoreForDifficulty(this.currentDifficulty); }

    saveHighScore() {
        this.saveHighScoreForDifficulty(this.currentDifficulty, this.highScore);
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
}

// ========================================
// 启动游戏 + 排行榜 + 评论系统
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();

    // ========================================
    // 排行榜系统
    // ========================================
    const leaderboard = new LeaderboardManager();
    const commentSystem = new CommentSystem();

    // 昵称管理
    const nicknameModal = document.getElementById('nicknameModal');
    const nicknameInput = document.getElementById('nicknameInput');
    const nicknameSave = document.getElementById('nicknameSave');
    const setNicknameBtn = document.getElementById('setNicknameBtn');
    const displayNickname = document.getElementById('displayNickname');

    // 初始化昵称
    const savedNick = leaderboard.getNickname();
    displayNickname.textContent = savedNick;

    setNicknameBtn.addEventListener('click', () => {
        nicknameInput.value = leaderboard.getNickname();
        nicknameModal.classList.remove('hidden');
        nicknameInput.focus();
    });

    nicknameSave.addEventListener('click', () => {
        const name = nicknameInput.value.trim() || '蛇友';
        leaderboard.setNickname(name);
        commentSystem.setNickname(name);
        displayNickname.textContent = name;
        nicknameModal.classList.add('hidden');
    });

    nicknameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') nicknameSave.click();
    });

    nicknameModal.addEventListener('click', (e) => {
        if (e.target === nicknameModal) nicknameModal.classList.add('hidden');
    });

    // ========================================
    // 渲染排行榜
    // ========================================
    function renderLeaderboard(highlightId) {
        const list = document.getElementById('leaderboardList');
        const countBadge = document.getElementById('leaderboardCount');
        const top20 = leaderboard.getTop20();

        countBadge.textContent = 'TOP ' + Math.min(top20.length, 20);

        if (top20.length === 0) {
            list.innerHTML = '<div class="empty-state">暂无记录，快来挑战！</div>';
            return;
        }

        list.innerHTML = top20.map((record, i) => {
            const rank = i + 1;
            const topClass = rank <= 3 ? ` top-${rank}` : '';
            const hlClass = record.id === highlightId ? ' highlight' : '';
            return `
                <div class="leaderboard-item${topClass}${hlClass}">
                    <span class="leaderboard-rank">${leaderboard.getRankMedal(rank)}</span>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${escapeHtml(record.nickname)}</div>
                        <div class="leaderboard-meta">${leaderboard.getDifficultyLabel(record.difficulty)} · ${leaderboard.formatTime(record.time)}</div>
                    </div>
                    <span class="leaderboard-score">${record.score}</span>
                </div>
            `;
        }).join('');
    }

    // ========================================
    // 渲染评论
    // ========================================
    function renderComments(newId) {
        const list = document.getElementById('commentList');
        const countBadge = document.getElementById('commentCount');
        const comments = commentSystem.getRecent(30);

        countBadge.textContent = comments.length;

        if (comments.length === 0) {
            list.innerHTML = '<div class="empty-state">暂无评论，快来发第一条！</div>';
            return;
        }

        list.innerHTML = comments.map(c => {
            const isLiked = commentSystem.isLiked(c.id);
            const newClass = c.id === newId ? ' new-comment' : '';
            return `
                <div class="comment-item${newClass}" data-id="${c.id}">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHtml(c.nickname)}</span>
                        <span class="comment-score-badge">${commentSystem.getDiffLabel(c.difficulty)} ${c.score}分</span>
                    </div>
                    <div class="comment-body">${escapeHtml(c.content)}</div>
                    <div class="comment-footer">
                        <span class="comment-time">${commentSystem.formatTime(c.time)}</span>
                        <button class="comment-like-btn${isLiked ? ' liked' : ''}" data-id="${c.id}">
                            ${isLiked ? '❤️' : '🤍'} ${c.likes}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 评论发送
    const commentInput = document.getElementById('commentInput');
    const commentSendBtn = document.getElementById('commentSendBtn');

    function sendComment() {
        const text = commentInput.value.trim();
        if (!text) return;
        const score = window.game ? window.game.score : 0;
        const diff = window.game ? window.game.currentDifficulty : 'easy';
        const c = commentSystem.addComment(text, score, diff);
        commentInput.value = '';
        if (c) renderComments(c.id);
    }

    commentSendBtn.addEventListener('click', sendComment);
    commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendComment();
    });

    // 点赞代理
    document.getElementById('commentList').addEventListener('click', (e) => {
        const btn = e.target.closest('.comment-like-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        commentSystem.toggleLike(id);
        renderComments();
    });

    // ========================================
    // Hook：游戏结束时更新排行榜和评论
    // ========================================
    const originalGameOver = window.game.gameOver.bind(window.game);
    window.game.gameOver = function() {
        originalGameOver();
        const { rank, isTop20 } = leaderboard.addRecord(this.score, this.currentDifficulty);
        const record = leaderboard.records.find(r => r.score === this.score);
        renderLeaderboard(record ? record.id : null);
        renderComments();
    };

    // 初始渲染
    renderLeaderboard();
    renderComments();

    // 工具函数
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

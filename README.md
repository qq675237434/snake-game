# 🐍 贪吃蛇游戏 (Snake Game)

经典的贪吃蛇网页游戏，使用 HTML5 Canvas 渲染，支持桌面端和移动端。

## 🎮 游戏特性

- **响应式设计** - 完美适配桌面、平板和移动设备
- **双端控制** - 支持键盘（方向键/WASD）和触摸滑动控制
- **虚拟按键** - 移动端提供方向控制按钮
- **分数系统** - 实时显示当前分数和历史最高分
- **本地存储** - 最高分自动保存到浏览器
- **难度递增** - 随着得分增加，蛇的移动速度会逐渐加快
- **精美界面** - 现代化 UI 设计，流畅动画效果

## 🚀 快速开始

### 方法一：直接打开

直接在浏览器中打开 `index.html` 文件即可开始游戏。

```bash
# 在浏览器中打开
open index.html  # macOS
start index.html  # Windows
xdg-open index.html  # Linux
```

### 方法二：使用本地服务器

```bash
# 使用 Python 内置服务器
python3 -m http.server 8000

# 或使用 Node.js 的 http-server
npx http-server -p 8000

# 然后访问 http://localhost:8000
```

## 🎯 游戏操作

### 桌面端
- **方向键** 或 **WASD** - 控制蛇的移动方向
- **空格键** - 暂停/继续游戏

### 移动端
- **滑动屏幕** - 控制蛇的移动方向
- **虚拟按钮** - 点击方向按钮控制移动

## 📁 项目结构

```
snake-game/
├── index.html      # HTML 页面结构
├── style.css       # 样式表（响应式设计）
├── game.js         # 游戏逻辑（Canvas 渲染）
└── README.md       # 项目说明文档
```

## 🛠️ 技术栈

- **HTML5** - 语义化页面结构
- **CSS3** - 响应式布局、CSS 变量、动画效果
- **JavaScript (ES6+)** - 面向对象编程、Canvas API
- **LocalStorage** - 持久化存储最高分

## 🎨 代码架构

### 核心类：`SnakeGame`

```javascript
class SnakeGame {
    constructor()      // 初始化游戏
    init()            // 设置画布和事件绑定
    startGame()       // 开始游戏
    update()          // 游戏主循环
    draw()            // 渲染游戏画面
    gameOver()        // 游戏结束处理
}
```

### 主要模块

1. **配置管理** - `CONFIG` 对象集中管理游戏参数
2. **状态管理** - `GameState` 枚举定义游戏状态
3. **方向控制** - `Direction` 枚举处理移动方向
4. **碰撞检测** - 墙壁和自身碰撞检测
5. **渲染系统** - Canvas 绘制蛇、食物和网格

## ⚙️ 游戏配置

可在 `game.js` 顶部的 `CONFIG` 对象中修改游戏参数：

```javascript
const CONFIG = {
    CANVAS_WIDTH: 600,      // 画布宽度
    CANVAS_HEIGHT: 400,     // 画布高度
    GRID_SIZE: 20,          // 网格大小
    INITIAL_SPEED: 150,     // 初始速度（毫秒）
    SPEED_INCREMENT: 5,     // 速度增量
    MIN_SPEED: 50,          // 最快速度
    // ... 颜色配置
};
```

## 🎯 游戏规则

1. 控制蛇移动，吃到红色食物得分
2. 每吃一个食物，蛇身增长一节
3. 吃到食物后速度会略微提升
4. 撞到墙壁或蛇身游戏结束
5. 不能直接反向移动（例如正在向右时不能直接向左）

## 📱 浏览器兼容性

- ✅ Chrome (推荐)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ 移动端浏览器

## 🔧 开发说明

### 代码规范

- 使用 ES6+ 语法（class、const/let、箭头函数）
- 模块化设计，职责分离
- 详细的中文注释
- 遵循最佳实践

### 扩展建议

- [ ] 添加多种难度级别
- [ ] 增加道具系统（加速、减速、穿墙等）
- [ ] 添加音效和背景音乐
- [ ] 实现在线排行榜
- [ ] 支持双人模式
- [ ] 添加皮肤系统

## 📄 许可证

MIT License - 可自由使用、修改和分发

## 👨‍💻 作者

由 Codex AI 助手开发

---

**享受游戏！** 🎮🐍

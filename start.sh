#!/bin/bash
# 贪吃蛇游戏 V3 - 快速启动脚本

echo "🐍 贪吃蛇游戏 V3 - 皮肤系统"
echo "================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "game.js" ]; then
    echo "❌ 错误：请在 snake-game 目录下运行此脚本"
    exit 1
fi

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：需要安装 Python 3"
    exit 1
fi

# 启动 HTTP 服务器
PORT=8080
echo "✅ 启动本地服务器..."
echo "📍 访问地址：http://localhost:${PORT}"
echo "📍 游戏文件：$(pwd)"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "================================"
echo ""

python3 -m http.server ${PORT}

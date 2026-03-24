#!/bin/bash
# Vercel Token 部署脚本

# 配置 - 请修改为你的 Token
VERCEL_TOKEN="YOUR_VERCEL_TOKEN_HERE"  # ← 替换为你的 Vercel Token
PROJECT_NAME="snake-game"
PROJECT_DIR="/root/.openclaw/workspace-codex/snake-game"

echo "🚀 开始部署到 Vercel..."
echo "项目：$PROJECT_NAME"
echo "目录：$PROJECT_DIR"

# 检查 Token
if [ "$VERCEL_TOKEN" = "YOUR_VERCEL_TOKEN_HERE" ]; then
    echo "❌ 错误：请先设置 VERCEL_TOKEN"
    echo "请编辑此文件，将 YOUR_VERCEL_TOKEN_HERE 替换为你的实际 Token"
    echo ""
    echo "获取 Token: https://vercel.com/account/settings/tokens"
    exit 1
fi

# 进入项目目录
cd "$PROJECT_DIR"

# 登录
echo "📝 登录 Vercel..."
vercel login --token "$VERCEL_TOKEN"

if [ $? -ne 0 ]; then
    echo "❌ 登录失败，请检查 Token 是否正确"
    exit 1
fi

echo "✅ 登录成功"

# 部署
echo "📤 开始部署..."
vercel --prod --token="$VERCEL_TOKEN" --yes --name="$PROJECT_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署成功！"
    echo ""
else
    echo ""
    echo "❌ 部署失败"
    echo ""
fi

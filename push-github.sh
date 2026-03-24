#!/bin/bash
# GitHub Token 推送脚本

# 配置
GITHUB_TOKEN="YOUR_GITHUB_TOKEN"
GITHUB_USERNAME="YOUR_GITHUB_USERNAME"
REPO_NAME="snake-game"
PROJECT_DIR="/root/.openclaw/workspace-codex/snake-game"

# 进入项目目录
cd "$PROJECT_DIR"

# 移除旧的 remote
git remote remove origin 2>/dev/null

# 添加使用 Token 的 remote URL
git remote add origin "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# 推送
echo "🚀 推送到 GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ 推送成功！"
    echo "📍 仓库地址：https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
else
    echo "❌ 推送失败，请检查 Token 和用户名"
fi

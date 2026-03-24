# 🚀 Vercel 部署指南

## ✅ 项目已准备就绪

你的贪吃蛇游戏已经推送到 GitHub：
- **仓库地址**: https://github.com/qq675237434/snake-game
- **vercel.json**: 已配置完成

---

## 📤 方式一：通过 Vercel 官网部署（推荐，最简单）

### 步骤：

1. **访问 Vercel**
   - 打开：https://vercel.com/new
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Import Git Repository"
   - 找到 `qq675237434/snake-game`
   - 点击 "Import"

3. **配置项目**
   - Project Name: `snake-game`
   - Framework Preset: `Other`
   - Build Command: 留空
   - Output Directory: `.`
   - Install Command: 留空

4. **点击 "Deploy"**

5. **等待部署完成**
   - 通常 1-2 分钟
   - 完成后会显示访问链接

---

## 📤 方式二：使用 Vercel CLI

### 1. 登录 Vercel

```bash
vercel login
# 选择 GitHub 登录
# 会打开浏览器授权
```

### 2. 部署

```bash
cd /root/.openclaw/workspace-codex/snake-game
vercel --prod
```

### 3. 获取链接

部署完成后会显示：
```
🔗 Production: https://snake-game-xxx.vercel.app
```

---

## 📤 方式三：使用 Vercel API（自动化）

### 1. 获取 Vercel Token

访问：https://vercel.com/account/settings/tokens
创建 Token，复制备用

### 2. 部署命令

```bash
export VERCEL_TOKEN="your_vercel_token"

cd /root/.openclaw/workspace-codex/snake-game

# 创建项目
curl -X POST "https://api.vercel.com/v9/projects" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "snake-game",
    "framework": null
  }'

# 部署
vercel --prod --token=$VERCEL_TOKEN
```

---

## 🎯 快速部署（推荐）

**最简单的方式：**

1. 访问 https://vercel.com/new
2. 登录 GitHub
3. 选择 `snake-game` 仓库
4. 点击 Deploy
5. 完成！获得访问链接

---

## 📊 部署后

### 获得的链接格式：
```
https://snake-game-xxxx.vercel.app
```

### 自定义域名（可选）：
在 Vercel 设置中添加自定义域名

### 自动部署：
每次 push 到 GitHub 自动部署新版本

---

## ⚡ 现在就去部署！

**点击这里开始：** https://vercel.com/new/imports?external-id=snake-game

或者手动访问 Vercel 官网导入 GitHub 仓库！

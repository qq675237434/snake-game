# 📤 GitHub Token 推送指南

## 🔑 第一步：获取 GitHub Token

### 方法一：创建 Classic Token（推荐）

1. 访问：https://github.com/settings/tokens
2. 点击 **"Generate new token (classic)"**
3. 填写信息：
   - **Note**: `snake-game-push`
   - **Expiration**: `No expiration`（或选择 90 天）
4. 勾选权限（Scopes）：
   - ✅ **repo** (Full control of private repositories)
   - ✅ **workflow** (Update GitHub Action workflows)
5. 点击 **"Generate token"**
6. **复制 Token**（只显示一次，格式：`ghp_xxxxxxxxxxxx`）

### 方法二：Fine-grained Token（更安全）

1. 访问：https://github.com/settings/personal-access-tokens
2. 点击 **"Generate new token"**
3. 填写：
   - **Token name**: `snake-game`
   - **Expiration**: `No expiration`
   - **Repository access**: `Only select repositories` → 选择或创建 `snake-game`
4. Permissions:
   - **Contents**: Read and write
   - **Pull requests**: Read and write (可选)
5. 点击 **"Generate token"**
6. **复制 Token**（格式：`github_pat_xxxxxxxxxxxx`）

---

## 🚀 第二步：推送代码

### 方式 A：使用推送脚本（推荐）

```bash
# 1. 编辑推送脚本
cd /root/.openclaw/workspace-codex/snake-game
nano push-github.sh

# 2. 修改这两行：
GITHUB_TOKEN="ghp_你的 Token"
GITHUB_USERNAME="你的 GitHub 用户名"

# 3. 执行脚本
bash push-github.sh
```

### 方式 B：命令行直接推送

```bash
cd /root/.openclaw/workspace-codex/snake-game

# 设置 Token（临时，仅当前会话有效）
export GITHUB_TOKEN="ghp_你的 Token"
export GITHUB_USERNAME="你的用户名"

# 添加 remote
git remote add origin "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/snake-game.git"

# 推送
git push -u origin main
```

### 方式 C：使用 Git Credential Helper

```bash
# 配置凭证存储
git config --global credential.helper store

# 推送时会提示输入用户名和 Token
git remote add origin https://github.com/你的用户名/snake-game.git
git push -u origin main
# 输入用户名
# 输入 Token（作为密码）
```

---

## 🔒 安全提示

| 事项 | 说明 |
|------|------|
| **Token 保密** | 不要提交到代码库，使用环境变量 |
| **权限最小化** | 只给必要的权限 |
| **定期轮换** | 建议每 90 天更新一次 |
| **撤销权限** | 不用时在 GitHub 删除 Token |

---

## ⚠️ 常见问题

### Q1: 推送失败 "Authentication failed"
```bash
# 检查 Token 是否正确
# 检查用户名是否正确
# 确认 Token 权限包含 repo
```

### Q2: 推送失败 "Repository not found"
```bash
# 在 GitHub 上先创建空仓库
# 访问 https://github.com/new
# 仓库名：snake-game
```

### Q3: Token 泄露了怎么办？
```bash
# 立即在 GitHub 删除该 Token
# 访问 https://github.com/settings/tokens
# 找到并删除泄露的 Token
# 重新生成新的 Token
```

---

## 📝 快速命令参考

```bash
# 查看当前 remote
git remote -v

# 修改 remote URL
git remote set-url origin https://github.com/用户名/仓库名.git

# 查看推送状态
git status

# 强制推送（谨慎使用）
git push -f origin main
```

---

## 🎯 下一步

推送成功后：

1. **启用 GitHub Pages**
   - Settings → Pages → Source: main branch → Save
   - 访问：https://用户名.github.io/snake-game

2. **添加项目描述**
   - 在仓库首页添加简介和标签

3. **分享游戏**
   - 发送链接给朋友试玩

---

**准备好了吗？请提供：**
1. GitHub Token（格式：ghp_xxxx 或 github_pat_xxxx）
2. GitHub 用户名

我来帮你完成推送！🚀

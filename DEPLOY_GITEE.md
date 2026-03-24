# 📤 部署到 Gitee Pages（国内访问快）

## 原因
Vercel 的 `*.vercel.app` 域名在国内访问不稳定，建议部署到 Gitee Pages。

---

## 步骤

### 1. 在 Gitee 创建仓库

访问：https://gitee.com/new

- **仓库名称**: snake-game
- **开源协议**: MIT
- 勾选"使用 LFS 存储大文件"（可选）

### 2. 推送代码到 Gitee

```bash
cd /root/.openclaw/workspace-codex/snake-game

# 添加 Gitee 远程仓库（替换为你的 Gitee 用户名）
git remote add gitee git@gitee.com:YOUR_USERNAME/snake-game.git

# 推送
git push -u gitee main
```

### 3. 启用 Gitee Pages

1. 进入仓库页面
2. 点击 **管理** → **Pages**
3. **源分支**: 选择 `main`
4. **文档路径**: 留空（根目录）
5. 点击 **保存**

### 4. 访问地址

格式：`https://YOUR_USERNAME.gitee.io/snake-game/`

---

## 🚀 快速部署脚本

```bash
#!/bin/bash
# deploy-to-gitee.sh

GITEE_USER="YOUR_GITEE_USERNAME"
PROJECT_DIR="/root/.openclaw/workspace-codex/snake-game"

cd "$PROJECT_DIR"

# 添加远程仓库
git remote add gitee git@gitee.com:${GITEE_USER}/snake-game.git 2>/dev/null || true

# 推送
git push -u gitee main

echo ""
echo "✅ 推送到 Gitee 完成！"
echo "📍 Pages 地址：https://${GITEE_USER}.gitee.io/snake-game/"
echo ""
echo "请前往 Gitee 仓库启用 Pages 服务"
```

---

## ⚡ 对比

| 平台 | 国内访问 | 部署速度 | 自定义域名 |
|------|----------|----------|------------|
| Vercel | ⚠️ 不稳定 | 快 | ✅ |
| Gitee Pages | ✅ 快速 | 快 | ✅ |
| Netlify | ⚠️ 一般 | 快 | ✅ |
| Cloudflare Pages | ✅ 快速 | 快 | ✅ |

---

**推荐：使用 Gitee Pages，国内访问速度最快！**

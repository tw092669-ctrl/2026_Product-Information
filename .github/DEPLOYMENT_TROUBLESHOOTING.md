# GitHub Pages 部署故障排查指南

## ⚠️ 部署失敗症狀

```
https://tw092669-ctrl.github.io/src/main.tsx net::ERR_ABORTED 404 (Not Found)
```

### 根本原因
- 舊版本 HTML 還在 GitHub Pages 上發布
- GitHub Actions 工作流未能成功構建或部署

---

## ✅ 修復步驟

### 1. 檢查 GitHub Actions 工作流狀態

訪問：https://github.com/tw092669-ctrl/2026_Product-Information/actions

查看最新的 **Deploy to GitHub Pages** 工作流：
- ✅ **成功** (綠色勾選) → 進到步驟 2
- ❌ **失敗** (紅色 X) → 查看日誌並修復
- ⏳ **執行中** (黃色圓圈) → 等待完成（1-3 分鐘）

### 2. 檢查 GitHub Pages 配置

訪問：https://github.com/tw092669-ctrl/2026_Product-Information/settings/pages

確保配置如下：
```
Source: Deploy from a branch
Branch: gh-pages
Folder: / (root)
```

若 Source 是其他選項（如 GitHub Actions），改為上述配置並保存。

### 3. 手動觸發工作流

若工作流未執行或構建失敗：

1. 訪問 Actions 標籤
2. 選擇 **Deploy to GitHub Pages**
3. 點擊 **Run workflow** 按鈕
4. 選擇 **main** 分支
5. 點擊 **Run workflow**

### 4. 驗證部署

部署成功後（5-10 分鐘），測試以下 URL：

| 資源 | URL | 應該返回 |
|------|-----|--------|
| 主頁面 | https://tw092669-ctrl.github.io/2026_Product-Information/ | 完整的 HTML 應用 |
| JS 文件 | https://tw092669-ctrl.github.io/2026_Product-Information/assets/ | 資源文件夾 |

---

## 🔧 常見問題及解決方案

### Q1: 工作流卡在「executing」

**症狀：** Actions 顯示執行中但不進展

**解決：**
```bash
# 在本地終端運行
cd /workspaces/2026_Product-Information
gh run cancel <run-id>  # 取消卡住的運行
git push origin main    # 重新觸發
```

### Q2: 工作流失敗 - npm 依賴錯誤

**症狀：** Build 步驟失敗

**檢查日誌：**
1. 進入失敗的工作流
2. 點擊 **Build project** 步驟
3. 查看詳細錯誤信息

**常見修復：**
```bash
# 本地清理並重建
rm -rf node_modules package-lock.json
npm install
npm run build
git add package-lock.json
git commit -m "Update dependencies"
git push origin main
```

### Q3: 構建成功但 Pages 未更新

**症狀：** Actions 成功但 GitHub Pages 還是舊版本

**原因：** GitHub Pages CDN 緩存

**解決：**
1. 清除瀏覽器緩存 (Ctrl+Shift+Delete)
2. 使用無痕模式訪問
3. 等待 15-30 分鐘讓 CDN 刷新

或強制刷新：
```bash
# 在瀏覽器開發者工具中
localStorage.clear()
sessionStorage.clear()
location.reload(true)
```

### Q4: HTML 頁面加載但沒有樣式或交互

**症狀：** 看到白色頁面或錯誤消息

**檢查：**
1. 打開瀏覽器開發者工具 (F12)
2. 檢查 Console 標籤是否有錯誤
3. 檢查 Network 標籤資源加載

**常見原因：** 
- CSS 或 JS 資源 404
- 相對路徑錯誤
- CORS 問題

---

## 🚀 完整部署流程驗證清單

- [ ] GitHub Pages 已啟用
- [ ] 分支設定為 `gh-pages`
- [ ] GitHub Actions 工作流執行成功
- [ ] 本地 `npm run build` 成功
- [ ] `dist/index.html` 包含正確的資源路徑
- [ ] 瀏覽器無痕模式訪問應用
- [ ] 所有資源 (CSS、JS) 成功加載
- [ ] 應用功能正常工作

---

## 📝 工作流改進日誌

最新改進：
- ✅ 添加 `workflow_dispatch` 支持手動觸發
- ✅ 改進環境變數處理（允許缺少 Secrets 時使用默認值）
- ✅ 添加構建驗證步驟
- ✅ 改進錯誤日誌輸出

---

## 📞 需要幫助？

檢查以下文件了解更多信息：
- [GitHub Pages 設置指南](./.github/GITHUB_PAGES_SETUP.md)
- [環境變數配置指南](./.github/ENVIRONMENT_VARIABLES.md)
- [Vite 配置](../../vite.config.ts)

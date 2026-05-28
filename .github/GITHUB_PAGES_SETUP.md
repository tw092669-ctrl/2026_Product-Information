# GitHub Pages 配置指南

本項目已配置為自動部署到 GitHub Pages。

## 配置說明

### 已完成的配置項目：

1. **Vite 配置 (vite.config.ts)**
   - ✅ 設定 base 路徑為 `/2026_Product-Information/`
   - 確保所有資源在 GitHub Pages 子路徑下正確加載

2. **GitHub Actions 工作流 (.github/workflows/deploy.yml)**
   - ✅ 自動在推送到 main 分支時構建
   - ✅ 運行依賴安裝和構建命令
   - ✅ 自動部署到 GitHub Pages

3. **密鑰配置 (Secrets)**
   - ⚠️ 需要手動設定 GEMINI_API_KEY

## 手動設定步驟

### 1. 在 GitHub 上啟用 Pages

1. 進入倉庫設定：https://github.com/tw092669-ctrl/2026_Product-Information/settings
2. 左側菜單選擇 **Pages**
3. 在 "Build and deployment" 下：
   - Source：選擇 **Deploy from a branch**
   - Branch：選擇 **gh-pages** 和 **root**
   - 點擊 **Save**

## 2. 設定環境變數 (Secrets)

### 必需的密鑰

1. **GEMINI_API_KEY** (必需)
   - 進入倉庫設定 → Secrets and variables → Actions
   - 點擊 **New repository secret**
   - 名稱：`GEMINI_API_KEY`
   - 值：粘貼你的 Gemini API 密鑰
   - 點擊 **Add secret**

2. **APP_URL** (可選)
   - 如不設定，將使用默認值：`https://tw092669-ctrl.github.io/2026_Product-Information/`
   - 設定步驟同上，名稱為 `APP_URL`

## 工作流程

1. **提交代碼**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. **GitHub Actions 自動執行**
   - 監聽 main 分支的推送事件
   - 安裝依賴
   - 構建項目
   - 生成 dist 目錄
   - 上傳到 GitHub Pages

3. **訪問應用**
   - 網址：`https://tw092669-ctrl.github.io/2026_Product-Information/`
   - 部署通常需要 1-2 分鐘

## 查看部署狀態

1. 進入倉庫頁面
2. 點擊 **Actions** 標籤
3. 查看最近的 **Deploy to GitHub Pages** 工作流執行結果

## 環境變數

項目需要的環境變數：

| 變數名 | 用途 | 設定位置 |
|-------|------|--------|
| GEMINI_API_KEY | Google Gemini API 密鑰 | GitHub Secrets |

## 常見問題

### Q: 構建失敗了怎麼辦？
- 檢查 Actions 標籤下的工作流日誌
- 確保 GEMINI_API_KEY 已正確設定
- 查看是否有依賴安裝錯誤

### Q: 訪問應用時 404 錯誤？
- 確認 Pages 已啟用且使用 gh-pages 分支
- 檢查 vite.config.ts 中的 base 路徑設定
- 清除瀏覽器緩存

### Q: 資源無法加載？
- 這通常是 base 路徑問題
- 確認 HTML 中的資源路徑以 `/2026_Product-Information/` 開頭

## 本地測試

在本地測試生產構建：

```bash
# 構建項目
npm run build

# 預覽構建結果（需要正確的 base 路徑）
npm run preview
```

## 相關文件

- [vite.config.ts](../vite.config.ts) - Vite 配置
- [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) - GitHub Actions 工作流
- [README.md](../README.md) - 項目主文檔

# GitHub Actions 環境變數配置指南

## 概述

本項目在 GitHub Actions workflow 中使用環境變數進行配置管理。為確保部署流程順利進行，需要正確配置以下環境變數。

## 環境變數清單

| 變數名 | 用途 | 必需 | 設定位置 | 默認值 |
|-------|------|------|--------|--------|
| `GEMINI_API_KEY` | Google Gemini API 密鑰 | ✅ 是 | Repository Secrets | 無 |
| `APP_URL` | 應用部署的完整 URL | ❌ 否 | Repository Secrets | `https://tw092669-ctrl.github.io/2026_Product-Information/` |

## 配置步驟

### 1. 設定 GEMINI_API_KEY (必需)

**步驟：**
1. 訪問 [倉庫設定](https://github.com/tw092669-ctrl/2026_Product-Information/settings)
2. 左側菜單 → **Secrets and variables** → **Actions**
3. 點擊 **New repository secret**
4. 填入以下信息：
   - **Name:** `GEMINI_API_KEY`
   - **Secret:** 粘貼你的 Gemini API 密鑰
5. 點擊 **Add secret**

**取得 API 密鑰：**
- 訪問 [Google AI Studio](https://ai.google.dev/)
- 登入你的 Google 帳戶
- 在 API Keys 部分生成新密鑰
- 複製密鑰值

### 2. 設定 APP_URL (可選)

如需自定義應用 URL，重複以上步驟：
- **Name:** `APP_URL`
- **Secret:** 你的應用 URL (例如: `https://example.com/app/`)

如不設定，workflow 將使用 GitHub Pages 的默認地址。

## Workflow 中的使用方式

環境變數在 workflow 中的使用流程：

```yaml
- name: Create environment file
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    APP_URL: ${{ secrets.APP_URL || 'https://tw092669-ctrl.github.io/2026_Product-Information/' }}
  run: |
    cat > .env.local << EOF
    GEMINI_API_KEY=${GEMINI_API_KEY}
    APP_URL=${APP_URL}
    EOF
```

**說明：**
- 使用 `${{ secrets.VARIABLE_NAME }}` 語法訪問密鑰
- `||` 提供 fallback 默認值
- `.env.local` 被 Vite 自動讀取

## 應用端使用

應用端通過 Vite 配置讀取環境變數：

```typescript
// vite.config.ts
const env = loadEnv(mode, '.', '');

define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
```

代碼中使用：

```typescript
// 任何組件
const apiKey = process.env.GEMINI_API_KEY;
```

## 安全最佳實踐

1. **不要在代碼中提交密鑰**
   - 密鑰應只存在於 GitHub Secrets
   - `.env.local` 已在 `.gitignore` 中

2. **定期輪換密鑰**
   - 如洩露 API 密鑰，立即更新
   - 在 Google AI Studio 中刪除舊密鑰

3. **限制密鑰權限**
   - 為 workflow 使用專用 API 密鑰
   - 在 Google AI Studio 中配置 API 限制

4. **監視使用情況**
   - 定期檢查 Google Cloud 使用報告
   - 監視異常的 API 調用

## 故障排除

### ❌ 構建失敗：「GEMINI_API_KEY is undefined」

**原因：** 密鑰未正確設定或不存在

**解決方案：**
```bash
# 驗證密鑰是否已設定
# 進入 GitHub 倉庫設定 → Secrets and variables → Actions
# 確認 GEMINI_API_KEY 存在
```

### ❌ 構建失敗：「Invalid API Key」

**原因：** 密鑰已過期或無效

**解決方案：**
1. 訪問 [Google AI Studio](https://ai.google.dev/)
2. 重新生成 API 密鑰
3. 在 GitHub Secrets 中更新

### ✅ 構建成功但應用不工作

**排查步驟：**
1. 檢查瀏覽器控制台是否有 API 錯誤
2. 驗證 GEMINI_API_KEY 在應用中正確傳遞
3. 確認 API 配額未超限

## Workflow 事件

當前配置僅在 **推送到 main 分支** 時觸發部署：

```yaml
on:
  push:
    branches: [main]
```

| 事件 | 構建 | 部署 |
|------|------|------|
| Push to main | ✅ 是 | ✅ 是 |
| Pull Request | ❌ 否 | ❌ 否 |
| 其他分支 | ❌ 否 | ❌ 否 |

## 環境差異

| 環境 | 使用方式 | 環境變數來源 |
|------|--------|-----------|
| 本地開發 | `npm run dev` | `.env.local` 本地文件 |
| AI Studio | 內置管理 | AI Studio Secrets 面板 |
| GitHub Actions | CI/CD 自動化 | Repository Secrets |
| 生產環境 | GitHub Pages 訪問 | 運行時注入 |

## 相關鏈接

- [GitHub Secrets 文檔](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vite 環境變數](https://vitejs.dev/guide/env-and-modes.html)
- [Google Generative AI API](https://ai.google.dev/)
- [GitHub Actions 文檔](https://docs.github.com/en/actions)

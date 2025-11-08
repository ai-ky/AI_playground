# Implementation Plan: 時間管理網站

**Branch**: `001-time-management` | **Date**: 2025-11-05 | **Spec**: [Feature Specification](spec.md)  
**Input**: Feature specification from `/specs/001-time-management/spec.md`

## Summary

開發一個靜態前端時間管理網站，支援鬧鐘、倒數計時、語音/文字混合輸入。所有數據本地儲存，無後端依賴。採用現代 HTML5/CSS3/JavaScript 技術棧，相容 GitHub Pages 部署。使用聊天框介面統一管理多個計時器，支援離線工作。

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript (ES2020+, 無 build 步驟推薦)  
**Primary Dependencies**: Web APIs (Web Audio, Web Storage, Web Speech, Service Worker)  
**Storage**: LocalStorage + IndexedDB（本地瀏覽器存儲）  
**Testing**: Jest + Playwright（前端單元和集成測試）  
**Target Platform**: 現代瀏覽器（Chrome 120+, Firefox 121+, Safari 17+, Edge 120+）  
**Project Type**: 靜態單頁應用（SPA）  
**Performance Goals**: 首屏 < 2 秒，計時精準度 ±2 秒  
**Constraints**: < 1MB 總資源、完全離線工作、GitHub Pages 相容、Lighthouse ≥ 90  
**Scale/Scope**: 單一應用，支援 20 個同時計時器，無用戶帳戶系統

## Constitution Check

✅ **簡潔優先** - 無後端，純前端實作  
✅ **無後端依賴** - LocalStorage + IndexedDB 本地儲存  
✅ **漸進增強** - 基礎功能無需 JS（如適用）；語音為增強  
✅ **文檔即代碼** - 規格完整，README 將記錄所有決策  
✅ **GitHub Pages 相容** - 無自訂配置所需

## Project Structure

### Documentation (this feature)

```text
specs/001-time-management/
├── spec.md              # ✅ Feature specification
├── checklists/
│   └── requirements.md  # ✅ Quality checklist
├── plan.md              # 📍 This file
├── research.md          # 🔄 Phase 0 (to create)
├── data-model.md        # 🔄 Phase 1 (to create)
├── contracts/           # 🔄 Phase 1 (to create)
│   ├── chat-api.md      # 聊天框輸入契約
│   ├── timer-api.md     # 計時器管理契約
│   └── storage-api.md   # 本地儲存契約
└── quickstart.md        # 🔄 Phase 1 (to create)
```

### Source Code (repository root)

```text
# GitHub Pages compatible static site
index.html              # 應用程式入口
├── /src/
│   ├── js/
│   │   ├── app.js           # 主應用邏輯
│   │   ├── chat.js          # 聊天框輸入處理
│   │   ├── timer.js         # 計時器管理
│   │   ├── alarm.js         # 鬧鐘管理
│   │   ├── storage.js       # 本地儲存抽象層
│   │   ├── audio.js         # 提示音播放
│   │   └── speech.js        # 語音識別整合
│   ├── css/
│   │   ├── style.css        # 主樣式表
│   │   └── responsive.css   # 響應式設計
│   └── components/
│       ├── chatbox.html     # 聊天框元件
│       ├── timerlist.html   # 計時器列表元件
│       └── controls.html    # 控制按鈕元件
├── /tests/
│   ├── unit/
│   │   ├── chat.test.js
│   │   ├── timer.test.js
│   │   └── storage.test.js
│   ├── integration/
│   │   └── e2e.test.js
│   └── contract/
│       └── apis.test.js
├── /assets/
│   ├── sounds/
│   │   ├── alarm1.mp3
│   │   └── alarm2.mp3
│   ├── icons/
│   │   └── favicon.ico
│   └── README.md
├── /docs/
│   ├── README.md           # 使用指南
│   ├── ARCHITECTURE.md     # 架構說明
│   └── API.md              # API 文檔
├── manifest.json           # PWA 清單
├── service-worker.js       # 離線支援
└── package.json            # NPM（可選，僅用於開發工具）
```

**Structure Decision**: 採用單一靜態網站結構，所有功能集中在單一 HTML 文件 + 模塊化 JS。無 build 步驟，直接部署至 GitHub Pages，可選使用 npm 進行開發時的測試工具。

## Technical Decisions

### 1. 架構風格

- **Client-Side MVC**: 資料模型（Timer/Alarm）→ 視圖（HTML）→ 控制器（JS）
- **事件驅動**: DOM 事件 + 自訂事件進行組件通訊
- **模塊化**: IIFE + 全域命名空間保護，無依賴於 module bundler

### 2. 存儲策略

- **LocalStorage**: 鬧鐘/計時器清單（持久化，適合小數據）
- **IndexedDB**: 可選，用於更複雜的查詢或未來擴展
- **Service Worker**: 離線支援 + 緩存策略（Cache-First for assets）

### 3. 語音輸入

- **Web Speech API**: 使用 SpeechRecognition 進行連續語音識別
- **文字後備**: 完整的文字輸入支援，無需語音權限
- **混合模式**: 聊天框支援同時文字和語音（用戶可選）

### 4. 計時邏輯

- **setTimeout/setInterval**: 基礎計時（精準度取決於瀏覽器）
- **requestAnimationFrame**: 實時 UI 更新
- **Web Workers**: 可選，用於後台計時增強精準度

### 5. 提示音

- **Web Audio API**: 生成簡單的提示音或播放預錄音頻
- **兩種內建聲音**: 標準鈴聲 + 自訂音調

## Implementation Phases

### Phase 0: Research (in progress)
- ✅ Web APIs 可行性驗證
- ✅ 時間表達解析策略
- ✅ 語音識別準確性評估

### Phase 1: Design & Contracts
- 數據模型設計（data-model.md）
- API 契約（contracts/）
- 快速開始指南（quickstart.md）

### Phase 2: Development (後續 `/speckit.tasks`)
- 核心模塊實作
- 單元 + 集成測試
- UI 實作 + 響應式設計
- 性能優化 + 部署

## Dependencies & Risks

### 外部依賴
- 無 npm 依賴（推薦）
- 可選開發依賴：Jest、Playwright、Prettier

### 風險與緩解
| 風險 | 影響 | 緩解 |
|------|------|------|
| Web Speech API 不相容 | 無語音輸入 | ✅ 文字後備完整實作 |
| 計時精準度誤差 | ±2 秒要求難達成 | 定期校準、文檔化精準度 |
| 大量計時器性能下降 | 20+ 計時器卡頓 | 使用 RequestAnimationFrame + 節流 |
| localStorage 存儲限制 | 5-10MB 限制 | 監控儲存使用，定期清理 |

## Next Steps

1. ✅ 規格確定和澄清完成
2. 📋 執行 Phase 0 研究（確認技術可行性）
3. 🎨 執行 Phase 1 設計（生成 data-model.md 和契約）
4. 👨‍💻 執行 `/speckit.tasks` 分解為開發任務

---

**Prepared by**: Copilot CLI  
**Ready for**: Phase 0 Research Dispatch

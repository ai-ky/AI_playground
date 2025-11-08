<!-- Sync Impact Report
Version: 0.1.0 (Initial)
Modified Principles: None (new document)
Added Sections: Core Principles, Technology Standards, Development Workflow, Governance
Templates requiring updates: ✅ spec-template.md, ✅ plan-template.md, ✅ tasks-template.md
Follow-up TODOs: None
-->

# AI_playground 憲法

靜態網站專案憲法，定義前端開發原則、技術標準與治理流程。
/specify
## 核心原則

### I. 簡潔優先
前端靜態網站以使用者體驗與載入效能為核心。任何功能加入前必須評估對頁面大小、首屏載入時間的影響。遵循「簡單就是美」的設計哲學，避免過度工程化。

### II. 無後端依賴
所有功能必須可離線工作或依賴公開 API。不引入需要私有伺服器的功能；若需後端能力，應明確記錄為待實現且設置明確的實現條件。

### III. 漸進增強
基礎功能必須在停用 JavaScript 後仍可用。JavaScript 用於增強使用者體驗，而非基本功能的必要條件。

### IV. 文檔即代碼
所有設計決策、功能說明與使用指南必須與程式碼同步更新。README、API 文檔與程式碼註解維持最新狀態。

### V. GitHub Pages 相容性
所有部署流程必須相容 GitHub Pages 標準；無需自訂伺服器配置或特殊環境變數；使用 `docs/` 或根目錄作為發佈來源。

## 技術標準

- **HTML/CSS/JavaScript**：採用標準 Web API，原則上無 build 步驟或最小化 build 複雜度
- **包管理**：如使用 npm，MUST 包含 `package-lock.json` 確保版本一致性
- **相容性**：支援最近 2 個瀏覽器版本（不含 IE）；無 polyfill 除非必要
- **效能預算**：首屏載入 < 3 秒；整頁下載 < 5MB；Lighthouse 分數 ≥ 90
- **無追蹤**：不使用分析工具除非明確使用者同意

## 開發工作流

- **分支策略**：`main` 分支需保持可部署狀態；feature 工作在獨立分支完成後透過 PR 進行 Code Review
- **PR 檢查清單**：確認效能影響、文檔更新、測試覆蓋（若適用）、與 GitHub Pages 相容性
- **測試**：前端邏輯應有對應測試；集成測試涵蓋跨瀏覽器功能
- **部署**：`main` 分支推送後自動部署至 GitHub Pages；無手動部署步驟

## 治理

本憲法為所有開發決策的最高指導文件。修訂遵循語義版本管理：
- **MAJOR**：原則刪除或重大重新定義
- **MINOR**：新增原則或擴展指導
- **PATCH**：澄清、措辭調整或非語義性改進

所有 PR 必須檢核與本憲法的相容性。如發現衝突，優先更新憲法後再推進實作。

**版本**: 0.1.0 | **簽署日期**: 2025-11-05 | **最後修訂**: 2025-11-05

# Research Phase: 時間管理網站

**Date**: 2025-11-05 | **Objective**: 驗證技術可行性與最佳實踐

## R1: Web APIs 可行性驗證

### Decision
採用標準 Web APIs（Web Storage、Web Audio、Web Speech）作為核心技術棧。

### Rationale
- ✅ 所有現代瀏覽器原生支持（無依賴）
- ✅ 完全離線工作能力
- ✅ GitHub Pages 相容（無後端所需）
- ✅ Service Worker 支持緩存和離線功能

### Technical Details

#### LocalStorage vs IndexedDB
- **LocalStorage**: 用於計時器/鬧鐘清單（簡單鍵值，< 5MB）
- **IndexedDB**: 保留用於未來擴展（更複雜查詢、更大數據）
- **決定**: 初版使用 LocalStorage，因應用簡單

#### Service Worker 離線策略
```
Cache Strategy:
- Assets (HTML/CSS/JS): Cache-First (定期更新)
- Sounds: Cache-First
- API 數據: 無（全本地）
```

### Browser Support
| 瀏覽器 | 版本 | Web Storage | Web Audio | Web Speech |
|--------|------|-------------|-----------|------------|
| Chrome | 120+ | ✅ | ✅ | ✅ |
| Firefox | 121+ | ✅ | ✅ | ✅ (部分) |
| Safari | 17+ | ✅ | ✅ | ❌ (WebKit issue) |
| Edge | 120+ | ✅ | ✅ | ✅ |

**結論**: Web Speech API 在 Safari 中無原生支持，但文字後備方案完整可用。

---

## R2: 時間表達解析策略

### Decision
使用基於正則表達式 + 簡單狀態機的本地時間解析器。

### Rationale
- 無需外部 NLP 庫（保持 < 1MB）
- 支援常見表達方式已足夠（95% 使用情景）
- 實現簡單、可測試性高

### Supported Patterns

#### 倒數計時表達
```
"5分鐘" / "5 minutes" → 5 * 60 = 300 秒
"30秒" / "30 seconds" → 30 秒
"2小時" / "2 hours" → 2 * 3600 = 7200 秒
"1.5小時" → 5400 秒
```

#### 鬧鐘時間表達
```
"早上8點" / "8am" → 今天 08:00 (若已過則明天)
"下午3點半" / "3:30pm" → 今天 15:30
"明天10點" → 明天 10:00
"23:45" (24h format) → 今天 23:45
```

### Implementation Approach
```javascript
// 偽代碼
function parseTimeInput(text) {
  // 1. 正則匹配倒數計時 (分鐘/秒)
  // 2. 正則匹配鬧鐘時間 (HH:MM, 相對時間)
  // 3. 返回 {type, value} 或 error
}
```

### Fallback
若無法解析 → 提示使用者「無法理解，請試試『5分鐘』或『下午3點』」

---

## R3: 語音識別準確性評估

### Decision
使用 Web Speech Recognition API，文字後備確保完整功能。

### Rationale
- Chrome/Edge 原生高準確率 (≥95%)
- Safari/Firefox 無此 API，但用戶可用文字輸入
- 混合模式（邊打邊說）提供最佳 UX

### Language Settings
- 主要語言: 繁體中文 (zh-TW)
- 備用語言: 英文 (en-US)
- 可在設定中切換

### Accuracy Targets
- 常見指令（「5分鐘」、「早上8點」）: ≥95%
- 冷門指令（「一刻鐘」）: ≥80%
- 測試集合: 見 spec.md SC-003

### Implementation
```javascript
const recognition = new (window.SpeechRecognition || 
                         window.webkitSpeechRecognition)();
recognition.lang = 'zh-TW';
recognition.continuous = true; // 持續監聽
recognition.interimResults = true; // 即時反饋
```

---

## R4: 計時精準度技術方案

### Decision
使用 setTimeout/setInterval + 定期校準機制，目標 ±2 秒精準度。

### Rationale
- setTimeout 標準精準度: ±4-16 毫秒
- 應用場景（個人計時）不需毫秒精準
- ±2 秒誤差對使用者體驗可接受

### Precision Calibration
```
計時器每 10 秒與系統時間校準一次：
- 若漂移 > 500ms，自動調整
- 視覺上平滑過渡（無跳躍）
```

### Optional Enhancement: Web Workers
未來若需更高精準度：
- 使用 Web Worker 在後台計時
- 與主線程隔離，避免 UI 阻塞
- 實現複雜度: 中等（Phase 2 可選）

---

## R5: 離線功能與 Service Worker

### Decision
實作基礎 Service Worker，支援資源緩存 + 離線運行。

### Caching Strategy
```
1. Assets (Cache-First)
   - HTML/CSS/JS: 首次訪問後緩存
   - 定期更新: 可選 background sync
   
2. 聲音文件 (Cache-First)
   - 內建 alarm1.mp3 & alarm2.mp3
   
3. 無動態 API 呼叫 (所有數據本地)
```

### Offline Behavior
- ✅ 打開已緩存頁面
- ✅ 建立/編輯計時器
- ✅ 音頻播放（已緩存聲音）
- ✅ 計時功能完全正常
- ❌ 新聲音下載（若未提前緩存）

### Implementation Scope
- 基礎 Cache-First 策略
- Network-First fallback for future API（若有）
- Stale-While-Revalidate for content updates

---

## R6: 前端框架決策

### Decision
**無框架**（Vanilla JavaScript）+ 模塊化 IIFE 架構

### Rationale
- 符合 < 1MB 資源預算
- GitHub Pages 無特殊支持需求
- 可控性高、易於調試

### Alternative Analysis
| 方案 | 優點 | 缺點 | 決定 |
|------|------|------|------|
| Vanilla JS | 輕量、無依賴 | 自己管理 DOM | ✅ 選中 |
| Vue 3 | 響應式、簡潔 | +50KB gzip | ❌ 超預算 |
| React | 組件成熟 | +40KB 起 | ❌ 超預算 |
| Lit | 輕量 Web Components | ~5KB | ⚠ 考慮中（若需要） |

### Architecture Pattern
```
IIFE 模塊化 + 全域命名空間保護：

TimerApp = (function() {
  // 私有變數
  // 公開 API
  return { init, addTimer, deleteTimer, ... }
})();

// 命名空間隔離: window.TimerApp
```

---

## R7: 提示音實現方案

### Decision
提供 2 種內建提示音（使用 Web Audio API 生成或預錄）

### 方案比較
| 方案 | 優點 | 缺點 | 選中 |
|------|------|------|------|
| Web Audio 生成 | 無文件、實時 | 複雜度高 | ⚠ 基礎音 |
| 預錄 MP3 | 高品質、簡單 | +50-100KB | ✅ 主方案 |
| 混合 | 最優 | 增加複雜度 | 考慮 |

### 內建聲音
1. **Standard Bell** (約 30KB): 傳統鈴聲
2. **Digital Chime** (約 30KB): 現代音調

### 實作
```javascript
const audioContext = new AudioContext();
// 或
const audio = new Audio('/assets/sounds/alarm1.mp3');
audio.play();
```

---

## Summary: Research Outcomes

| 議題 | 決定 | 風險等級 | 後續 |
|------|------|---------|------|
| Web APIs | LocalStorage + Web Audio + Web Speech | 低 | ✅ 可進行 Phase 1 |
| 時間解析 | 正則表達式 + 狀態機 | 低 | ✅ 可進行實作 |
| 語音識別 | Web Speech API + 文字後備 | 低 | ✅ 已驗證支援 |
| 計時精準度 | setTimeout + 定期校準 | 中 | ⚠ 監控 Phase 2 |
| 離線支援 | Service Worker 基礎實作 | 低 | ✅ 可進行實作 |
| 無框架 | Vanilla JS IIFE 模塊 | 低 | ✅ 簡化開發 |
| 提示音 | 預錄 MP3 + Web Audio | 低 | ✅ 可進行資源製作 |

**結論**: 所有技術方案已驗證可行，無阻塞因素。建議進入 Phase 1 設計階段。

---

**Research Prepared by**: Technical Analysis  
**Status**: ✅ Complete - Ready for Phase 1

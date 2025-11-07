# 任務清單: 時間管理網站

**輸入**: 設計文檔來自 `/specs/001-time-management/`  
**分支**: `001-time-management`  
**狀態**: 準備實作  
**預估時間**: 58-76 小時（1.5-2 週全職）

---

## 格式說明

- **[P]**: 任務可以並行執行（不同文件、無阻塞依賴）
- **[US#]**: 所屬用戶故事（US1、US2、US3、US4）
- **[T###]**: 任務編號，按執行順序排列
- 檔案路徑相對於儲存庫根目錄

---

## 第 1 階段: 設置與基礎設施 (6-8 小時) ✅ 完成

**目的**: 專案初始化和基礎結構

**檢查點**: 基礎結構準備就緒，可開始開發 ✅

### 設置任務

- [x] T001 建立專案目錄結構: `index.html`、`/src`、`/tests`、`/assets` 在儲存庫根目錄 ✅
- [x] T002 [P] 建立 HTML 進入點: `index.html` 包含基本 meta 標籤、viewport、字符編碼設定 ✅ (193 行)
- [x] T003 [P] 建立 CSS 檔案: `src/css/style.css`（主樣式）和 `src/css/responsive.css`（行動優先響應式） ✅ (1055 行)
- [x] T004 [P] 初始化 Service Worker: `service-worker.js` 包含基本結構和 Cache-First 策略 ✅ (106 行)
- [x] T005 [P] 建立 PWA 清單: `manifest.json` 包含應用名稱、圖示、主題顏色 ✅ (84 行)
- [x] T006 建立 `package.json` 配置 Jest、Playwright 和開發工具（可選但建議） ✅ (66 行)
- [x] T007 [P] 建立 `src/js/app.js` 初始化 TimerApp 全域命名空間和模塊初始化模式 ✅ (406 行)

---

## 第 2 階段: 基礎模塊 (16-20 小時) ✅ 完成

**目的**: 所有用戶故事依賴的核心基礎設施

**⚠️ 重要**: 所有基礎任務必須完成後才能開始用戶故事

**檢查點**: 所有模塊功能正常且可獨立測試 ✅

### 儲存層（關鍵路徑）

- [x] T008 [P] 實作 `src/js/storage.js` - LocalStorage 抽象層：
  - `init()` - 初始化儲存、檢查版本相容性
  - `save(key, value)` - 持久化到 LocalStorage（JSON 序列化）
  - `load(key)` - 從 LocalStorage 檢索
  - `clear()` - 清除所有資料
  - `export()` / `import()` - 資料備份/恢復

- [x] T009 [P] 新增儲存錯誤處理: `StorageError` 類別含有敘述性訊息

### 計時器管理核心

- [x] T010 [P] 實作 `src/js/timer.js` 計時器模塊，包含：
  - 資料結構: Timer 物件包含 id、type、label、totalSeconds、remainingSeconds、state、createdAt、soundId
  - `create(label, totalSeconds, soundId)` - 建立新計時器實體
  - `update(id, updates)` - 更新計時器屬性
  - `delete(id)` - 移除計時器
  - `list()` - 獲取所有計時器
  - `getActive()` - 獲取只有運行中的計時器
  - 狀態管理: "running" ↔ "paused" → "completed"

- [x] T011 [P] 新增計時器倒數邏輯到計時器模塊:
  - `pause(id)` - 停止倒數並記錄 pausedAt
  - `resume(id)` - 從暫停狀態恢復
  - `_runCountdown(id)` - 內部間隔管理，1 秒更新一次
  - 校準: 每 10 秒檢查系統時間，修正 ±500ms 漂移

- [x] T012 [P] 在 `src/js/timer.js` 新增計時器驗證:
  - 驗證 totalSeconds > 0
  - 驗證狀態轉移（只允許: running→paused、paused→running、任何→completed）
  - 防止對不存在計時器的操作（拋出 `NotFoundError`）

### 鬧鐘管理核心

- [x] T013 [P] 實作 `src/js/alarm.js` 鬧鐘模塊，包含：
  - 資料結構: Alarm 物件包含 id、type、label、triggerTime、state、createdAt、soundId、isRecurring
  - `create(label, triggerTime, soundId)` - 建立新鬧鐘
  - `update(id, updates)` - 更新鬧鐘屬性（如已觸發則只允許更新 soundId）
  - `delete(id)` - 移除鬧鐘
  - `list()` - 獲取所有鬧鐘
  - `getPending()` - 獲取只有待觸發的鬧鐘（triggerTime > 現在）

- [x] T014 [P] 在 `src/js/alarm.js` 新增鬧鐘觸發偵測:
  - 每秒監控待觸發的鬧鐘
  - 當 triggerTime 到達時，發送 'alarmTriggered' 事件
  - 更新狀態為 "triggered"
  - 持久化變更到儲存

- [x] T015 [P] 在 `src/js/alarm.js` 新增鬧鐘驗證:
  - 驗證 triggerTime > 現在（拒絕過去的時間）
  - 驗證狀態: "pending" | "triggered" | "cancelled"
  - 無效輸入時拋出 `ValidationError`

### 音頻與通知層

- [x] T016 [P] 實作 `src/js/audio.js` 音頻模塊，包含：
  - 聲音註冊表: 映射 "alarm1" → `/assets/sounds/alarm1.wav`、"alarm2" → `/assets/sounds/alarm2.wav`
  - `play(soundId)` - 播放音檔（處理 Web Audio API 和 HTML5 音頻後備）
  - `stop()` - 停止播放
  - `setSoundId(id)` - 設定預設聲音偏好
  - 錯誤處理: 音頻不可用時優雅降級

- [x] T017 [P] 建立佔位符聲音檔案:
  - `assets/sounds/alarm1.wav` - 標準鈴聲（佔位符 1 秒音調）
  - `assets/sounds/alarm2.wav` - 數位鐘聲（佔位符 1 秒音調）

### 事件系統

- [x] T018 [P] 在 `src/js/app.js` 實作事件分派器:
  - `emitEvent(eventName, detail)` - 分派自訂 DOM 事件
  - 支援的事件: 'timerCreated'、'timerUpdated'、'timerPaused'、'timerCompleted'、'timerDeleted'、'alarmTriggered'、'alarmDeleted'
  - 確保所有計時器/鬧鐘操作發送適當事件

- [x] T019 [P] 在 `src/js/app.js` 新增全域狀態管理:
  - 初始化 TimerApp.state 包含 items[]、settings{theme、defaultSound、language}
  - 自動同步狀態變更到儲存
  - 提供 TimerApp.getState() 和 TimerApp.setState(updates)

**基礎檢查點**:  ✅ 完成
- [x] 儲存完全功能且持久化
- [x] 計時器和鬧鐘模塊獨立運作
- [x] 音頻播放可用
- [x] 事件系統正常發送
- [x] timer-api.md 中的 11 項操作已實作

---

## 第 3 階段: 用戶故事 1 - 建立並啟動鬧鐘 (優先級: P1) 🎯 最小化可行產品

**目標**: 使用者可透過文字輸入建立鬧鐘、設定特定日期和時間、觸發時接收通知

**獨立測試**: 
1. 透過文字輸入建立「明天 9 點」的鬧鐘
2. 驗證鬧鐘出現在清單中並標記為「⏰ 鬧鐘」
3. 模擬時間到達觸發時間，驗證通知和聲音播放
4. 刪除鬧鐘，驗證從清單移除

### 用戶故事 1 的測試（可選）

- [x] T020 [P] [US1] `tests/unit/alarm.test.js` 中的鬧鐘建立單元測試: ✅ 已實作
  - 測試有效鬧鐘建立的正確狀態
  - 測試驗證: 拒絕過去的 triggerTime
  - 測試持久化到儲存

- [x] T021 [P] [US1] `tests/unit/alarm.test.js` 中的鬧鐘觸發邏輯單元測試: ✅ 已實作
  - 測試時間到達時鬧鐘狀態變更為 "triggered"
  - 測試 'alarmTriggered' 事件發送
  - 使用 Date.now() Mock 模擬時間流逝

- [x] T022 [US1] `tests/integration/e2e.test.js` 中的鬧鐘建立流程整合測試: ✅ 已實作
  - 測試完整使用者流程: 輸入 → 建立 → 觸發 → 通知
  - 驗證視覺顯示在頁面上
  - 驗證聲音播放

### 用戶故事 1 的實作

- [x] T023 [P] [US1] 在 `src/components/chatbox.html` 建立聊天框使用者介面元件: ✅ 完成
  - 輸入欄位 id="chat-input"
  - 提交按鈕 id="chat-send"
  - 初始佔位符文字: "輸入時間或說話，例如『明天 9 點』或『五分鐘』"
  - 語音按鈕 id="voice-btn"（將在用戶故事 2 連接）

- [x] T024 [P] [US1] 在 `src/components/timerlist.html` 建立計時器清單容器: ✅ 完成
  - Div id="timer-list"
  - 空狀態訊息: "尚無計時器，開始建立一個吧"
  - 用於渲染項目的結構

- [x] T025 [US1] 在 `src/js/chat.js` 實作 ChatInput 解析器: ✅ 完成
  - 函數 `parseTimeInput(text)` 識別鬧鐘模式:
    - "明天 9 點" → {type: 'alarm', hour: 9, day: 'tomorrow'}
    - "下午 3 點半" → {type: 'alarm', hour: 15, minute: 30}
    - "23:45" → {type: 'alarm', time: '23:45'}
  - 回傳 {type, value} 或 null 如果無法識別
  - 使用正則表達式解析中文時間表達: /(\d+)點|(\d+):(\d+)/

- [x] T026 [US1] 在 `src/js/chat.js` 實作時間字串到時間戳的轉換: ✅ 完成
  - 函數 `parseAlarmTime(input)` 將自然語言轉換為 unix 時間戳
  - 處理 "明天"、"後天"、相對日期
  - 無效時回傳時間戳或拋出 ValidationError

- [x] T027 [US1] 在 `src/js/app.js` 建立鬧鐘建立使用者介面處理器: ✅ 完成
  - 監聽 "chat-send" 按鈕點擊
  - 獲取輸入值、解析它
  - 呼叫 `TimerApp.Alarm.create()` 使用解析資料
  - 清空輸入欄位
  - 使用使用者友善的訊息處理錯誤

- [x] T028 [P] [US1] 在 `src/js/app.js` 建立計時器項目渲染器: ✅ 完成
  - 函數 `renderTimerItem(item)` 為單一計時器或鬧鐘建立 HTML
  - 顯示類型徽章: "⏰ 鬧鐘" 或 "⏱️ 倒數"
  - 顯示標籤、剩餘/觸發時間
  - 包含刪除按鈕

- [x] T029 [US1] 在 `src/js/app.js` 建立清單渲染器: ✅ 完成
  - 函數 `renderList()` 從儲存中獲取排序的項目
  - 按 createdAt 降序排序（最新優先）
  - 為每個項目呼叫 `renderTimerItem()`
  - 插入 #timer-list
  - 處理空狀態

- [x] T030 [US1] 在 `src/js/app.js` 將清單更新連接到事件: ✅ 完成
  - 監聽 'alarmCreated'、'alarmTriggered'、'alarmDeleted' 事件
  - 呼叫 `renderList()` 更新使用者介面
  - 使用事件委派為刪除按鈕

- [x] T031 [US1] 在 `src/js/app.js` 新增刪除功能: ✅ 完成
  - 處理刪除按鈕點擊（委派）
  - 呼叫 `TimerApp.Alarm.delete(id)`
  - 刪除前顯示確認對話框

- [x] T032 [US1] 實作鬧鐘觸發時的通知: ✅ 完成
  - 當 'alarmTriggered' 事件觸發時，顯示視覺通知:
    - 彈窗或模態視窗顯示鬧鐘標籤
    - "完成" 按鈕關閉
  - 呼叫 `TimerApp.Audio.play(alarm.soundId)`
  - 更新鬧鐘顯示為 "已觸發"

- [x] T033 [US1] 在 `src/css/style.css` 新增鬧鐘顯示樣式: ✅ 完成
  - 計時器/鬧鐘項目卡片樣式
  - 類型徽章樣式（顏色區分）
  - 響應式網格佈局（行動裝置 1 欄、桌面 2+ 欄）
  - 刪除按鈕樣式

**用戶故事 1 檢查點**: ✅ 完成
- [x] 使用者可透過文字輸入建立鬧鐘（例如 "明天 9 點"）
- [x] 鬧鐘在統一清單中顯示並標記為類型
- [x] 時間精準度足以滿足使用者介面需求（±幾秒可接受）
- [x] 使用者可刪除鬧鐘
- [x] 鬧鐘觸發時帶有通知 + 聲音
- [x] 所有視覺反饋正常工作

---

## 第 4 階段: 用戶故事 2 - 使用語音建立倒數計時 (優先級: P1)

**目標**: 使用者透過聊天框建立倒數計時（文字或語音）、系統開始倒數、視覺進度更新、完成時觸發通知

**獨立測試**:
1. 在聊天框中輸入或說出 "5 分鐘"
2. 驗證計時器出現標籤為 "⏱️ 倒數計時"、正在倒數
3. 等待 5 秒，驗證剩餘時間正確減少（±2 秒精準度）
4. 計時器完成，驗證聲音播放和通知顯示

### 用戶故事 2 的測試（可選）

- [ ] T034 [P] [US2] `tests/unit/timer.test.js` 中的計時器倒數單元測試:
  - 測試建立 60 秒計時器
  - Mock setInterval，驗證每秒遞減 1
  - 測試每 10 秒校準修正

- [ ] T035 [P] [US2] `tests/unit/chat.test.js` 中的文字解析（持續時間）單元測試:
  - "5 分鐘" → {type: 'timer', seconds: 300}
  - "30 秒" → {type: 'timer', seconds: 30}
  - "2 小時" → {type: 'timer', seconds: 7200}

- [ ] T036 [P] [US2] `tests/unit/speech.test.js` 中的語音輸入後備單元測試:
  - Mock SpeechRecognition
  - 驗證文字輸入即使在語音不可用時也能工作
  - 測試語言切換 zh-TW ↔ en-US

- [ ] T037 [US2] `tests/integration/e2e.test.js` 中的計時器建立和倒數整合測試:
  - 透過文字建立計時器: "10 秒"
  - 驗證倒數視覺更新
  - 等待完成、驗證事件觸發
  - （使用快轉計時模擬，而非真實秒數）

### 用戶故事 2 的實作

- [ ] T038 [P] [US2] 在 `src/js/chat.js` 中為計時器模式擴展 ChatInput 解析器:
  - 新增計時器偵測: "5 分鐘"、"30 秒"、"2 小時"、"1.5 小時"
  - 回傳 {type: 'timer', seconds: <number>}
  - 支援中文和英文: "5 minutes"、"30 seconds"

- [ ] T039 [US2] 在 `src/js/app.js` 實作計時器建立處理器:
  - 偵測解析輸入 type === 'timer'
  - 從輸入中擷取可選標籤（例如 "5 分鐘工作" → label="工作"）
  - 呼叫 `TimerApp.Timer.create(label, seconds, soundId)`
  - 使用者友善的錯誤訊息

- [ ] T040 [P] [US2] 在 `src/js/app.js` 實作計時器進度顯示:
  - 函數 `formatTime(seconds)` → "MM:SS" 格式
  - 範例: 245 秒 → "04:05"
  - 更新計時器項目顯示 `<span class="timer-remaining">{formatted}</span>`

- [ ] T041 [US2] 在 `src/js/app.js` 新增計時器倒數顯示更新:
  - 監聽 'timerUpdated' 事件（每 1 秒觸發）
  - 對於每個活躍計時器，用新的 remainingSeconds 更新顯示
  - 使用防抖減少過度的 DOM 更新

- [ ] T042 [P] [US2] 在 `src/js/app.js` 新增計時器完成處理器:
  - 監聽 'timerCompleted' 事件
  - 顯示通知: "{label} 完成！"（含完成時間）
  - 播放聲音: `TimerApp.Audio.play(timer.soundId)`
  - 更新顯示為 "已完成"
  - 可選提供 "再來一次" 按鈕（建立相同持續時間）

- [ ] T043 [US2] 在 `src/components/timerlist.html` 為計時器實作暫停/恢復按鈕:
  - 為執行中計時器新增暫停按鈕（id="pause-btn-{id}"）
  - 為暫停計時器新增恢復按鈕（id="resume-btn-{id}"）
  - 在按鈕工具提示顯示剩餘時間

- [ ] T044 [US2] 在 `src/js/app.js` 連接暫停/恢復處理器:
  - 暫停/恢復按鈕的委派點擊監聽
  - 呼叫 `TimerApp.Timer.pause(id)` 或 `TimerApp.Timer.resume(id)`
  - 更新按鈕狀態（暫停↔恢復）
  - 驗證狀態轉移正確

- [ ] T045 [P] [US2] 在 `src/js/speech.js` 實作 Web Speech API 整合:
  - 初始化 SpeechRecognition（Chrome/Edge）或 polyfill 檢查
  - 函數 `startVoiceInput(onResult, onError)`
  - 配置: lang='zh-TW'、continuous=true、interimResults=true
  - 將識別的文字回傳給呼叫者
  - 優雅地處理錯誤（無麥克風、權限被拒）

- [ ] T046 [US2] 在 `src/js/app.js` 新增語音按鈕功能:
  - 點擊 #voice-btn → 開始聽取
  - 視覺反饋: 按鈕文字 → "聽中..." 或麥克風圖示動畫
  - 語音結束時，解析文字並建立計時器/鬧鐘
  - 無法識別文字: "沒有聽到，請重試"

- [ ] T047 [P] [US2] 在 `src/js/speech.js` 新增不支援語音的瀏覽器後備:
  - 偵測 SpeechRecognition 是否可用
  - 不可用時: 顯示吐司 "您的瀏覽器不支援語音輸入，請使用文字輸入"
  - 確保文字輸入始終有效

- [ ] T048 [US2] 在 `src/css/style.css` 擴展計時器顯示樣式:
  - 計時器倒數顯示: 大、突出的字體（例如 2.5rem）
  - 暫停/恢復按鈕樣式
  - 倒數顏色變更: 綠色 → 橙色 → 紅色（隨時間遞減）（可選）
  - 動畫: 微妙脈衝/閃爍（< 10 秒剩餘）（可選）

- [ ] T049 [P] [US2] 在 `src/css/responsive.css` 新增行動裝置媒體查詢:
  - 計時器顯示在小螢幕上可讀
  - 按鈕易於點擊（最小 44px 高度）
  - 聊天輸入全寬度行動裝置
  - 如果需要按鈕垂直堆疊

**用戶故事 2 檢查點**:
- 使用者可透過文字（例如 "5 分鐘"）或語音（Chrome/Edge）建立計時器
- 計時器出現在清單中並每秒倒數
- 暫停/恢復功能正常
- 倒數精準度 ±2 秒已驗證
- 計時器完成時觸發通知 + 聲音
- 語音輸入在不支援的瀏覽器上優雅降級

---

## 第 5 階段: 用戶故事 3 - 管理多個計時器 (優先級: P2)

**目標**: 使用者可同時建立和管理多達 20 個計時器/鬧鐘，單一清單中，按建立時間排序，類型清晰標籤

**獨立測試**:
1. 建立 5 個不同持續時間的計時器
2. 驗證全部 5 個顯示在清單中，最新的在頂部
3. 每個標籤為 "⏱️ 倒數計時" 或 "⏰ 鬧鐘"
4. 驗證全部獨立倒數
5. 完成一個，驗證只有該計時器觸發聲音
6. 其他繼續不受影響

### 用戶故事 3 的測試（可選）

- [ ] T050 [P] [US3] `tests/unit/timer.test.js` 中的清單排序單元測試:
  - 建立 3 個不同 createdAt 值的計時器
  - 呼叫 `TimerApp.list()`（或 getAll()）
  - 驗證按 createdAt 遞減排序
  - 驗證最新的優先

- [ ] T051 [P] [US3] `tests/unit/timer.test.js` 中的平行計時器管理單元測試:
  - 建立 5 個計時器，暫停 1 個、恢復 1 個、刪除 1 個
  - 驗證操作不互相干擾
  - 驗證每個計時器的狀態保持正確
  - 效能: 所有操作 < 100ms 完成

- [ ] T052 [US3] `tests/integration/e2e.test.js` 中的多計時器使用者介面 E2E 測試:
  - 建立 3 個不同持續時間的計時器
  - 驗證視覺顯示全部 3 個
  - 驗證倒數是獨立的
  - （使用快轉計時，而非真實秒數）

### 用戶故事 3 的實作

- [ ] T053 [P] [US3] 在 `src/js/app.js` 中的清單渲染器實作排序:
  - 修改 `renderList()` 按 createdAt 遞減排序
  - 最近建立的顯示在頂部（最新優先）
  - 每次清單變更時更新

- [ ] T054 [P] [US3] 在計時器項目渲染中新增類型徽章:
  - 計時器: 顯示 "⏱️ 倒數計時"
  - 鬧鐘: 顯示 "⏰ 鬧鐘"
  - 使用表情符號 + 文字清楚表示
  - 不同顏色: 計時器橙色、鬧鐘藍色（CSS）

- [ ] T055 [US3] 在 `src/js/app.js` 中最佳化計時器更新渲染:
  - 不再每秒重新渲染整個清單:
    - 只更新特定計時器項目的倒數顯示
    - 使用事件委派和資料屬性進行定位
    - 減少 DOM 變更，改善效能

- [ ] T056 [P] [US3] 在 `src/js/timer.js` 中實作有效的間隔管理:
  - 使用單一共享間隔而非每個計時器一個
  - 在一個 tick 中更新所有活躍計時器
  - 檢查已完成的計時器並發送事件
  - 無活躍計時器時停止間隔

- [ ] T057 [US3] 在 `src/js/app.js` 中新增限制偵測:
  - 建立新計時器前，檢查數量
  - 如果 >= 20，顯示警告: "已達到最大計時器數量（20 個），請刪除舊的計時器"
  - 允許使用者繼續或取消

- [ ] T058 [P] [US3] 在 `src/components/timerlist.html` 中清單標頭新增元數據顯示:
  - 顯示計數: "計時器: X 個"（X = 活躍 + 已完成/已觸發）
  - 效能備註: 如果 5+ 活躍顯示 "所有計時器獨立運行"

- [ ] T059 [US3] 在 `src/js/app.js` 中實作效能監控:
  - 測量清單渲染時間（應 < 50ms）
  - > 100ms 時記錄警告
  - 有利於除錯效能問題
  - 可選: 僅在 DevTools 中顯示，非使用者介面

**用戶故事 3 檢查點**:
- 多個計時器/鬧鐘共存在單一清單中
- 清單正確排序（最新優先）
- 類型標籤清晰且有區別
- 所有計時器獨立倒數
- 20 個項目時無效能下降
- 完成一個計時器不影響其他
- 刪除/暫停操作適用於任何項目

---

## 第 6 階段: 用戶故事 4 - 編輯和刪除計時器 (優先級: P2)

**目標**: 使用者可編輯計時器/鬧鐘（標籤、時間）和刪除，含視覺反饋

**獨立測試**:
1. 建立計時器 "5 分鐘工作"
2. 點擊編輯，將標籤改為 "工作休息"
3. 儲存、驗證標籤已更新
4. 點擊刪除、確認對話框
5. 驗證計時器從清單移除

### 用戶故事 4 的測試（可選）

- [ ] T060 [P] [US4] `tests/unit/timer.test.js` 中的 Timer.update() 單元測試:
  - 測試更新標籤
  - 測試更新 soundId
  - 驗證狀態不被標籤更新更改
  - 測試拒絕無效狀態

- [ ] T061 [P] [US4] `tests/unit/timer.test.js` 中的刪除邏輯單元測試:
  - 測試 Timer.delete() 從清單移除
  - 測試 Alarm.delete() 從清單移除
  - 驗證持久化已更新
  - 驗證 'timerDeleted'/'alarmDeleted' 事件發送

- [ ] T062 [US4] `tests/integration/e2e.test.js` 中的編輯/刪除流程 E2E 測試:
  - 建立計時器，點擊編輯按鈕
  - 驗證編輯模態視窗出現含當前值
  - 變更標籤、儲存、驗證頁面上的更新
  - 刪除、確認對話框、驗證移除

### 用戶故事 4 的實作

- [ ] T063 [P] [US4] 在 `src/components/timerlist.html` 建立編輯按鈕和模態視窗:
  - 為每個計時器項目新增編輯按鈕（id="edit-btn-{id}"）
  - 模態視窗 div（id="edit-modal"）含:
    - 標籤輸入欄位（最多 50 字）
    - 聲音選擇器下拉清單（alarm1、alarm2）
    - 計時器: 持續時間編輯器（唯讀或可編輯）
    - 儲存和取消按鈕

- [ ] T064 [US4] 在 `src/js/app.js` 實作編輯處理器:
  - 點擊編輯按鈕 → 顯示模態視窗含當前值
  - 用現有資料填入表單
  - 驗證: 標籤最多 50 字
  - 儲存時呼叫 `TimerApp.Timer.update(id, updates)`
  - 關閉模態視窗並重新整理清單視圖

- [ ] T065 [P] [US4] 在 `src/js/timer.js` 新增標籤編輯功能:
  - Update 方法應接受標籤變更
  - 持久化到儲存
  - 發送 'timerUpdated' 事件

- [ ] T066 [P] [US4] 在 `src/js/timer.js` 新增聲音偏好變更:
  - Update 方法應接受 soundId 變更
  - 只對未觸發的鬧鐘允許變更
  - 阻止已觸發的鬧鐘變更（僅鬧鐘）

- [ ] T067 [US4] 在 `src/js/app.js` 實作刪除按鈕含確認:
  - 點擊刪除按鈕 → 顯示確認對話框
  - 對話框文字: "確認刪除『{label}』嗎?"
  - 選項: 確認 / 取消
  - 確認時: 呼叫 `TimerApp.Timer.delete(id)` 或 `TimerApp.Alarm.delete(id)`

- [ ] T068 [P] [US4] 刪除時清理執行中的間隔:
  - 刪除執行中計時器時，清除其間隔
  - 刪除暫停計時器時，無需清理
  - 持久化刪除到儲存

- [ ] T069 [US4] 新增復原功能（可選增強）:
  - 刪除後，顯示吐司: "已刪除 {label}" 帶 "復原" 按鈕
  - 復原會將計時器恢復到清單且狀態為 "paused"
  - 逾時: 5 秒，然後自動關閉復原選項

- [ ] T070 [P] [US4] 在 `src/css/style.css` 中編輯模態視窗樣式:
  - 模態視窗疊層含半透明背景
  - 模態視窗盒子: 居中、可讀寬度（400px 最大）
  - 表單輸入: 適當間距、清晰標籤
  - 按鈕: 儲存（主要）、取消（次要）
  - 輸入樣式: 邊框、焦點狀態、驗證反饋

- [ ] T071 [US4] 在 `src/css/style.css` 新增表單驗證使用者介面:
  - 無效輸入顯示錯誤狀態（紅色邊框）
  - 標籤顯示字元計數: "X/50"
  - 表單無效時停用儲存按鈕
  - 使用者修正時清除錯誤

**用戶故事 4 檢查點**:
- 使用者可編輯標籤和聲音偏好
- 編輯模態視窗直覺且無障礙
- 刪除帶確認對話框防止意外損失
- 如已實作復原功能
- 所有變更持久化到儲存
- 所有操作的使用者介面反饋清晰

---

## 第 7 階段: 打磨與跨領域關注 (12-16 小時)

**目的**: 完成使用者介面/UX、設定、離線支援、效能最佳化

### 設定與偏好

- [ ] T072 [P] 在 `src/components/settings.html` 建立設定模態視窗:
  - 主題: 淺色 / 深色切換
  - 預設聲音: alarm1 / alarm2 選擇器
  - 語言: 繁體中文 / English 選擇器
  - 清除所有資料按鈕（含確認）
  - 關於 / 幫助連結

- [ ] T073 [US?] 在 `src/js/app.js` 實作設定處理器:
  - 啟動時從儲存載入設定
  - 套用主題類別到文件
  - 儲存所有偏好變更
  - 套用語言設定（準備用於國際化）

- [ ] T074 [P] 在 `src/css/style.css` 新增主題切換:
  - 定義 CSS 變數用於顏色 (--bg-primary、--text-primary 等)
  - 淺色主題（預設）: 淺色背景、深色文字
  - 深色主題: 深色背景、淺色文字
  - 主題間流暢轉移

### Service Worker 與離線支援

- [ ] T075 [P] 在 `service-worker.js` 完成 Service Worker:
  - 註冊以攔截網路請求
  - Assets 的 Cache-First 策略:
    - 快取: index.html、所有 /src/*、/assets/sounds/*
    - 如快取遺失時網路後備（僅線上）
  - 定期快取清理（移除舊版本）

- [ ] T076 [P] 在 `src/js/app.js` 新增離線指示器:
  - 用 `navigator.onLine` 偵測線上/離線狀態
  - 使用者介面中顯示指示器: "離線模式" 或線上核取記號
  - 離線時停用語音輸入指示器（優雅降級）

- [ ] T077 [P] 在 `src/js/app.js` 新增應用程式安裝 (PWA) 提示:
  - 監聽 `beforeinstallprompt` 事件
  - 如可用顯示 "安裝應用程式" 按鈕
  - 處理安裝流程

### 無障礙與本地化準備

- [ ] T078 [P] 在 `src/components/timerlist.html` 和聊天中新增 ARIA 標籤:
  - 按鈕: `aria-label="暫停計時器"`
  - 表單輸入: `aria-label="輸入時間"`
  - 計時器狀態: `aria-live="polite"` 用於動態更新
  - 確保鍵盤導覽正常（Tab、Enter）

- [ ] T079 [P] 在 `src/js/app.js` 準備本地化結構:
  - 建立 i18n 物件含鍵→翻譯對應
  - 範例: `i18n.zh_TW.TIMER_LABEL`、`i18n.en_US.TIMER_LABEL`
  - 使用 `i18n[lang].KEY` 而非硬編碼字串
  - 語言切換: 更新頁面上的所有文字

### 效能最佳化

- [ ] T080 [P] 在 `src/js/timer.js` 最佳化計時器間隔更新:
  - 使用 `requestAnimationFrame` 而非 setInterval 進行使用者介面更新（更平順）
  - 或保持 setInterval 用於倒數但批次 DOM 更新
  - 測量和記錄效能（使用 `performance.now()`）

- [ ] T081 [P] 在 `src/css/` 中最小化和最佳化 CSS:
  - 移除未用樣式
  - 合併 style.css + responsive.css 或保持分開？
  - 將關鍵 CSS 內嵌到 index.html 用於更快首次繪製

- [ ] T082 [P] 在 `src/js/` 中稽核套件大小:
  - 測量總 JS 大小（所有檔案結合）
  - 目標: < 200KB 未壓縮、< 60KB gzip
  - 移除生產前的除錯程式碼

- [ ] T083 在 `index.html` 最佳化初始載入:
  - 將關鍵 CSS 內嵌到 `<style>` 標籤
  - 用 `defer` 屬性延遲非關鍵 JS
  - 用 `preload` 用於音檔: `<link rel="preload" href="/assets/sounds/alarm1.mp3">`

### 文檔

- [ ] T084 [P] 在 `docs/USER_GUIDE.md` 建立使用者指南:
  - 主要功能的螢幕截圖
  - 如何建立計時器/鬧鐘（文字和語音）
  - 如何暫停/恢復/刪除
  - 疑難排解: "語音不工作怎麼辦?" 等

- [ ] T085 [P] 在 `docs/DEVELOPER.md` 更新開發者文檔:
  - 架構概述
  - 模塊說明（計時器、鬧鐘、聊天、儲存、音頻）
  - 如何擴展（例如新增聲音、語言）
  - 執行測試: `npm test`、`npm run e2e`

- [ ] T086 在儲存庫根目錄更新 README.md:
  - 快速開始: 複製 → `python -m http.server 3000` → 造訪 localhost
  - 功能摘要
  - 瀏覽器支援表
  - 指向 `/docs/` 中詳細文檔的連結

### 測試與品保

- [ ] T087 [P] 在 `tests/smoke/` 新增煙霧測試:
  - 基本應用程式啟動測試
  - 所有模塊正確載入
  - 儲存可存取
  - （可以是簡單的 Jest 測試檢查 TimerApp 全域存在）

- [ ] T088 執行完整測試套件和覆蓋報告:
  - `npm test` 執行所有單元 + 整合測試
  - 生成覆蓋報告: 目標 ≥ 70%
  - 修復關鍵路徑中的任何覆蓋缺口

- [ ] T089 手動跨瀏覽器測試:
  - Chrome 120+: 全部功能 ✅
  - Firefox 121+: 全部功能 ✅
  - Safari 17+: 計時器/鬧鐘僅有（無語音） ✅
  - Edge 120+: 全部功能 ✅
  - 文檔發現的問題

- [ ] T090 使用 Lighthouse 進行效能稽核:
  - 執行: `npm run build && npm run lighthouse`
  - 或手動: DevTools → Lighthouse
  - 目標: 效能 ≥ 90、無障礙 ≥ 95、最佳實踐 ≥ 90
  - 修復任何關鍵問題

### 部署與發佈

- [ ] T091 準備 GitHub Pages 部署:
  - 驗證 index.html 在儲存庫根目錄（或 /docs/）
  - 確認所有路徑相對（無絕對 /src/...）
  - 在本地伺服器測試模擬 Pages 設定

- [ ] T092 設定 GitHub Pages 設定:
  - 儲存庫 → 設定 → Pages
  - 來源: main 分支、/ (根) 目錄
  - 或如使用 /docs/: 選擇 docs/ 目錄
  - 如需啟用自訂網域

- [ ] T093 建立 GitHub Actions 自動部署工作流（可選）:
  - `.github/workflows/deploy.yml`
  - main 推送時觸發
  - 執行測試，然後部署到 Pages
  - （如手動推送可接受可跳過）

- [ ] T094 在 `CHANGELOG.md` 中建立 v1.0.0 發佈附註:
  - 功能: 計時器、鬧鐘、語音輸入 (Chrome/Edge)、離線支援
  - 已知限制: Safari 中無語音、±2 秒計時精準度
  - 安裝: GitHub Pages URL

---

## 實作策略

### 最小化可行產品範圍
**最小化可行產品 = 用戶故事 1 + 用戶故事 2 核心（僅文字輸入）**
- 預估: 20-24 小時
- 使用者可透過文字 "5 分鐘" 建立計時器
- 計時器倒數並觸發通知
- 無語音輸入、無暫停/恢復（第 1 個最小化可行產品）

### 漸進交付
1. **迭代 1**（2-3 天）: 最小化可行產品（用戶故事 1 文字 + 用戶故事 2 基本計時器）
2. **迭代 2**（2-3 天）: 新增語音輸入（用戶故事 2 完整）+ 多計時器（用戶故事 3）
3. **迭代 3**（2-3 天）: 編輯/刪除（用戶故事 4）+ 打磨（第 7 階段）
4. **迭代 4**（1-2 天）: 測試、效能、部署

### 平行執行機會
- **T002-T007**: 設置任務全部可並行
- **T008-T017**: 所有基礎模塊（除 T018-T019 依賴其他）可並行
- **T020-T049**: 所有用戶故事 1 任務除明確依賴外可並行
- 第 2 階段完成後: 用戶故事 1、2、3、4 實作可 **完全並行**（不同功能、無跨依賴）

### 關鍵路徑
```
T001 → T008 (儲存) → T010 (計時器) 
    → T025-T026 (聊天解析)
    → T028-T032 (使用者介面渲染)
    ✓ 用戶故事 1 完成
    
T029-T042 (用戶故事 2 計時器顯示 + 語音)
    ✓ 用戶故事 2 完成
    
T053-T071 (用戶故事 3-4 多管理)
    ✓ 完整功能完成
    
T072-T094 (打磨與部署)
    ✓ 生產環境準備
```

---

## 依賴概述

```
第 1 階段: 設置
    ↓
第 2 階段: 基礎 (T008-T019)
    ├─→ T025-T033 (用戶故事 1 實作)
    ├─→ T038-T049 (用戶故事 2 實作)
    ├─→ T053-T059 (用戶故事 3 實作)
    └─→ T063-T071 (用戶故事 4 實作)
    
用戶故事 1-4 可第 2 階段後並行

全部 ↓
第 7 階段: 打磨與品保 → 部署
```

---

## 各階段成功標準

### 第 1 階段完成
- [ ] 專案結構建立檔案就位
- [ ] index.html 無錯誤載入
- [ ] 所有 CSS 檔案正確連結
- [ ] Service Worker 註冊

### 第 2 階段完成  
- [ ] 11 項計時器操作正常運作
- [ ] 7 項鬧鐘操作正常運作
- [ ] 儲存持久化正確
- [ ] 事件發送和監聽正常運作
- [ ] 音頻播放功能正常
- [ ] 無控制台錯誤

### 第 3 階段（用戶故事 1）完成
- [ ] 文字輸入鬧鐘: "明天 9 點" → 建立鬧鐘
- [ ] 鬧鐘在清單中顯示並標記為 "⏰ 鬧鐘"
- [ ] 鬧鐘在正確時間觸發並含通知 + 聲音
- [ ] 刪除鬧鐘功能正常
- [ ] 獨立測試通過: 完整鬧鐘生命週期

### 第 4 階段（用戶故事 2）完成
- [ ] 文字輸入計時器: "5 分鐘" → 建立計時器
- [ ] 計時器每秒倒數、±2 秒精準度
- [ ] 暫停/恢復正常
- [ ] 語音輸入 (Chrome/Edge) 正常、優雅後備
- [ ] 獨立測試通過: 完整計時器生命週期

### 第 5 階段（用戶故事 3）完成
- [ ] 同時建立 5 個計時器，全部在清單中可見
- [ ] 所有計時器獨立倒數
- [ ] 完成一個，只有該計時器觸發聲音
- [ ] 其他不受影響、繼續執行
- [ ] 刪除一個，其他繼續執行

### 第 6 階段（用戶故事 4）完成
- [ ] 編輯按鈕開啟模態視窗、可變更標籤/聲音
- [ ] 變更在重新整理後持久化
- [ ] 刪除帶確認對話框
- [ ] 復原功能（可選）

### 第 7 階段完成
- [ ] 設定正常運作（主題、語言、聲音）
- [ ] Service Worker 離線模式正常運作
- [ ] Lighthouse 稽核: 效能 ≥90
- [ ] 全部測試通過
- [ ] 部署到 GitHub Pages，可透過公開 URL 存取

---

## 各階段預估小時數

| 階段 | 任務 | 小時數 | 附註 |
|------|------|--------|------|
| 設置 | T001-T007 | 6-8 | 可並行 |
| 基礎 | T008-T019 | 16-20 | 大部分可並行 |
| 用戶故事 1 | T020-T033 | 12-16 | 基礎後 |
| 用戶故事 2 | T034-T049 | 12-16 | 與用戶故事 1 並行 |
| 用戶故事 3 | T050-T059 | 8-10 | 與用戶故事 1/2 並行 |
| 用戶故事 4 | T060-T071 | 6-8 | 與用戶故事 1-3 並行 |
| 打磨 | T072-T094 | 12-16 | 測試 + 部署 |
| **合計** | **T001-T094** | **58-76** | **約 2 週** |

---

## 附註

- 標籤 [P] 的任務可並行執行
- 無 [P] 或明確依賴的任務必須循序執行
- 每個用戶故事獨立可測試/可交付
- 第 2 階段（基礎）阻塞所有用戶故事
- 無後端開發; 全部本地瀏覽器 API
- 測試為可選但高度推薦

**狀態**: ✅ 準備實作

---

**生成**: 2025-11-05  
**任務數**: 94 項任務，跨 7 個階段  
**功能**: 時間管理網站（時間管理網站）  
**分支**: `001-time-management`

# Data Model: 時間管理網站

**Date**: 2025-11-05 | **Phase**: 1 - Design | **Status**: Ready for Implementation

## Overview

本應用使用本地瀏覽器儲存（LocalStorage）管理數據。所有數據結構採用 JSON 序列化格式。

## Core Entities

### 1. Timer (倒數計時)

代表一個倒數計時流程，由使用者建立並獨立運行。

```json
{
  "id": "timer_1730761200000",
  "type": "timer",
  "label": "工作時間",
  "totalSeconds": 300,
  "remainingSeconds": 245,
  "startedAt": 1730761200000,
  "pausedAt": null,
  "state": "running",
  "createdAt": 1730761100000,
  "soundId": "alarm1"
}
```

**欄位說明**:
- **id**: 唯一識別符（timestamp-based: `timer_${Date.now()}`)
- **type**: 固定為 "timer"
- **label**: 使用者自訂標籤（如「工作」、「休息」）
- **totalSeconds**: 初始設定秒數（300 = 5分鐘）
- **remainingSeconds**: 剩餘秒數（即時更新）
- **startedAt**: 開始時間戳
- **pausedAt**: 暫停時時間戳（運行中為 null）
- **state**: 狀態 ("running" | "paused" | "completed")
- **createdAt**: 建立時間戳
- **soundId**: 提示音選項 ("alarm1" | "alarm2")

**狀態轉移**:
```
created → running → (paused ↔ running) → completed
```

**驗證規則**:
- totalSeconds > 0
- remainingSeconds >= 0 && remainingSeconds <= totalSeconds
- state 必須為允許值之一
- createdAt <= startedAt <= 現在

---

### 2. Alarm (鬧鐘)

代表一個特定日期時間的提醒。

```json
{
  "id": "alarm_1730764800000",
  "type": "alarm",
  "label": "起床",
  "triggerTime": 1730765400000,
  "triggered": false,
  "state": "pending",
  "createdAt": 1730761100000,
  "soundId": "alarm1",
  "isRecurring": false
}
```

**欄位說明**:
- **id**: 唯一識別符（timestamp-based）
- **type**: 固定為 "alarm"
- **label**: 使用者自訂標籤（如「起床」、「會議」）
- **triggerTime**: 觸發時間戳（絕對時間）
- **triggered**: 是否已觸發過
- **state**: 狀態 ("pending" | "triggered" | "cancelled")
- **createdAt**: 建立時間戳
- **soundId**: 提示音選項
- **isRecurring**: 是否重複（Phase 2 功能，目前固定 false）

**狀態轉移**:
```
pending → triggered
pending → cancelled (使用者手動刪除)
```

**驗證規則**:
- triggerTime > 現在時間（防止過期鬧鐘）
- state 必須為允許值
- 若 triggered === true，state 必須是 "triggered"

---

### 3. TimerList (計時器清單)

單一統一清單，混合 Timer 和 Alarm，按建立時間排序。

```json
{
  "items": [
    { ...timer, createdAt: 1730761200000, type: "timer" },
    { ...alarm, createdAt: 1730761100000, type: "alarm" },
    { ...timer, createdAt: 1730761000000, type: "timer" }
  ],
  "metadata": {
    "lastUpdated": 1730761300000,
    "totalCount": 3,
    "activeCount": 2,
    "version": "1.0"
  }
}
```

**排序規則**:
- 降序排列（最新在上）
- 同時間戳時，Timer 優先於 Alarm

**顯示規則**:
- 類型標籤清晰可見（「鬧鐘」或「倒數計時」）
- 顯示進度（倒數計時：剩餘秒數；鬧鐘：距離時間）

---

## Data Persistence

### LocalStorage Schema

```
Key: "timerapp_state"
Value: {
  "items": [ {Timer | Alarm}[] ],
  "settings": {
    "theme": "light|dark",
    "defaultSound": "alarm1|alarm2",
    "language": "zh-TW|en-US"
  },
  "metadata": {
    "version": "1.0",
    "lastSyncTime": 1730761300000
  }
}
```

### Storage Lifecycle

1. **初始化**: 應用啟動時載入 LocalStorage
2. **新增/編輯**: 每次操作後即時保存
3. **清理**: 自動刪除已過期的鬧鐘（> 24 小時後刪除）
4. **遷移**: 若版本升級，自動轉換數據格式

### Storage Size Estimate

```
單個 Timer/Alarm: ~200 bytes
20 個計時器: ~4 KB
加上設定: ~5 KB 總計
限制: LocalStorage 5-10 MB
```

**結論**: 儲存量遠低於限制，無容量問題。

---

## State Management

### Global State

```javascript
{
  items: Timer[] | Alarm[],
  settings: {
    theme: 'light' | 'dark',
    defaultSound: 'alarm1' | 'alarm2',
    language: 'zh-TW' | 'en-US'
  },
  ui: {
    selectedId: string | null,
    isRecording: boolean,
    showSettings: boolean
  }
}
```

### State Transitions

```
Action: addTimer(label, totalSeconds)
  → Create Timer object
  → Add to items[]
  → Sort by createdAt
  → Persist to LocalStorage
  → Emit 'timerAdded' event

Action: deleteTimer(id)
  → Find item by id
  → Remove from items[]
  → If running, cleanup intervals
  → Persist to LocalStorage
  → Emit 'timerDeleted' event

Action: pauseTimer(id)
  → Find timer
  → Set state = 'paused'
  → Record pausedAt
  → Clear intervals
  → Persist
  → Emit 'timerPaused' event
```

---

## Validation Rules

### Timer Validation

```javascript
function validateTimer(timer) {
  const rules = [
    { check: timer.totalSeconds > 0, error: "總秒數必須 > 0" },
    { check: timer.remainingSeconds >= 0, error: "剩餘秒數不能為負" },
    { check: ['running', 'paused', 'completed'].includes(timer.state), error: "無效狀態" },
    { check: timer.createdAt <= Date.now(), error: "建立時間不能在未來" },
    { check: ['alarm1', 'alarm2'].includes(timer.soundId), error: "無效聲音 ID" }
  ];
  return rules.every(r => r.check || error(r.error));
}
```

### Alarm Validation

```javascript
function validateAlarm(alarm) {
  const now = Date.now();
  const rules = [
    { check: alarm.triggerTime > now, error: "觸發時間必須在未來" },
    { check: ['pending', 'triggered', 'cancelled'].includes(alarm.state), error: "無效狀態" },
    { check: alarm.createdAt <= now, error: "建立時間不能在未來" },
    { check: ['alarm1', 'alarm2'].includes(alarm.soundId), error: "無效聲音 ID" },
    { check: typeof alarm.label === 'string' && alarm.label.length <= 50, error: "標籤長度限制" }
  ];
  return rules.every(r => r.check || error(r.error));
}
```

---

## Query Patterns

### 常見查詢

```javascript
// 獲取所有活躍計時器
activeTimers() {
  return items.filter(i => i.type === 'timer' && i.state === 'running');
}

// 獲取待觸發鬧鐘
pendingAlarms() {
  return items.filter(i => i.type === 'alarm' && i.state === 'pending');
}

// 獲取已排序清單（最新優先）
sortedList() {
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

// 搜尋標籤
searchByLabel(query) {
  return items.filter(i => i.label.includes(query));
}
```

---

## Migration Path

### Version 1.0 → 1.1 (Future)

若需要添加新欄位（如 `isRecurring` 支援）：

```javascript
function migrateV1ToV1_1(oldState) {
  return {
    ...oldState,
    items: oldState.items.map(item => ({
      ...item,
      isRecurring: item.isRecurring || false  // 新欄位預設值
    })),
    metadata: {
      ...oldState.metadata,
      version: "1.1"
    }
  };
}
```

---

## Entity Relationships

```
┌─────────────────┐
│   TimerList     │ (統一容器)
├─────────────────┤
│  - items[]      │
│    ├─ Timer     │ (倒數計時)
│    │  └─ soundId ─→ Sound
│    └─ Alarm     │ (鬧鐘)
│       └─ soundId ─→ Sound
│  - settings     │
│  - metadata     │
└─────────────────┘

┌─────────────┐
│   Sound     │ (提示音)
├─────────────┤
│ - id        │ ("alarm1" | "alarm2")
│ - name      │
│ - url       │
│ - duration  │
└─────────────┘
```

---

## API Contract (Internal)

### Storage Service

```javascript
class StorageService {
  // 初始化
  init(): Promise<void>
  
  // CRUD 操作
  addItem(item: Timer | Alarm): Promise<void>
  updateItem(id: string, updates: Partial<Timer | Alarm>): Promise<void>
  deleteItem(id: string): Promise<void>
  getItem(id: string): Timer | Alarm | null
  getAll(): (Timer | Alarm)[]
  
  // 查詢
  getTimers(): Timer[]
  getAlarms(): Alarm[]
  getActive(): (Timer | Alarm)[]
  
  // 設定
  getSetting(key: string): any
  setSetting(key: string, value: any): Promise<void>
  
  // 管理
  clear(): Promise<void>
  export(): JSON
  import(data: JSON): Promise<void>
}
```

---

## Data Constraints Summary

| 項目 | 限制 | 原因 |
|------|------|------|
| 標籤長度 | ≤ 50 字 | UI 空間考量 |
| 同時計時器 | ≤ 20 個 | 性能考量 |
| 總儲存 | ≤ 1 MB | LocalStorage 限制 |
| 計時精準度 | ±2 秒 | 技術可行性 |
| 鬧鐘有效期 | 24 小時 | 自動清理策略 |

---

**Data Model Version**: 1.0  
**Status**: Ready for Implementation  
**Next**: Phase 2 - Generate API Contracts

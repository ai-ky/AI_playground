# Timer API Contract

**Version**: 1.0 | **Date**: 2025-11-05 | **Status**: Design

## Overview

計時器管理 API，提供倒數計時和鬧鐘的完整生命週期管理。所有操作均為本地同步調用，無網路延遲。

## Core Operations

### 1. Create Timer

建立新的倒數計時器。

```javascript
function createTimer(params: {
  label: string,           // 標籤 (1-50 chars)
  totalSeconds: number,    // 總秒數 (> 0)
  soundId?: string         // 提示音 ("alarm1" | "alarm2", default: "alarm1")
}): Timer
```

**Response**:
```json
{
  "id": "timer_1730761200000",
  "type": "timer",
  "label": "工作時間",
  "totalSeconds": 300,
  "remainingSeconds": 300,
  "startedAt": 1730761200000,
  "pausedAt": null,
  "state": "running",
  "createdAt": 1730761200000,
  "soundId": "alarm1"
}
```

**Errors**:
- `ValidationError`: 標籤長度超過 50 字或秒數 <= 0
- `StorageError`: 無法保存至 LocalStorage

---

### 2. Create Alarm

建立新的鬧鐘。

```javascript
function createAlarm(params: {
  label: string,           // 標籤 (1-50 chars)
  triggerTime: number,     // Unix timestamp (必須 > 現在)
  soundId?: string         // 提示音 ("alarm1" | "alarm2")
}): Alarm
```

**Response**:
```json
{
  "id": "alarm_1730764800000",
  "type": "alarm",
  "label": "起床",
  "triggerTime": 1730765400000,
  "triggered": false,
  "state": "pending",
  "createdAt": 1730764800000,
  "soundId": "alarm1",
  "isRecurring": false
}
```

**Errors**:
- `ValidationError`: 觸發時間已過或標籤無效
- `StorageError`: 無法保存

---

### 3. Get Item

取得單個計時器或鬧鐘。

```javascript
function getItem(id: string): Timer | Alarm | null
```

**Response**: Timer 或 Alarm 物件，若不存在則 null

---

### 4. List All

取得所有計時器和鬧鐘的排序清單。

```javascript
function listAll(): Array<Timer | Alarm>
```

**排序**: 按 createdAt 降序（最新優先）

**Response**:
```javascript
[
  { type: "timer", label: "工作", ... },
  { type: "alarm", label: "會議", ... },
  ...
]
```

---

### 5. Update Timer

更新計時器（狀態、標籤）。

```javascript
function updateTimer(id: string, updates: {
  label?: string,
  state?: "paused" | "running",
  soundId?: string
}): Timer
```

**Allowed State Transitions**:
- running → paused ✅
- paused → running ✅
- running/paused → completed ✅
- 其他轉移 ❌ (錯誤)

**Response**: 更新後的 Timer 物件

**Errors**:
- `NotFoundError`: Timer 不存在
- `ValidationError`: 無效的狀態轉移或標籤

---

### 6. Update Alarm

更新鬧鐘。

```javascript
function updateAlarm(id: string, updates: {
  label?: string,
  triggerTime?: number,
  soundId?: string
}): Alarm
```

**限制**:
- 若鬧鐘已觸發，只允許更新 soundId
- triggerTime 必須 > 現在

**Response**: 更新後的 Alarm 物件

---

### 7. Delete Item

刪除計時器或鬧鐘。

```javascript
function deleteItem(id: string): void
```

**Side Effects**:
- 若是運行中的 Timer，清除 interval/timeout
- 若是已觸發的 Alarm，停止音頻

**Errors**:
- `NotFoundError`: Item 不存在

---

### 8. Pause Timer

暫停計時器。

```javascript
function pauseTimer(id: string): Timer
```

**Prerequisites**: Timer 狀態必須是 "running"

**Side Effects**:
- 停止 interval
- 記錄 pausedAt 時間戳
- remainingSeconds 凍結

**Response**: 更新後的 Timer

---

### 9. Resume Timer

繼續暫停的計時器。

```javascript
function resumeTimer(id: string): Timer
```

**Prerequisites**: Timer 狀態必須是 "paused"

**Side Effects**:
- 重新啟動 interval
- pausedAt 清除 (設為 null)
- 重新計算 remainingSeconds

**Response**: 更新後的 Timer

---

### 10. Get Active Timers

取得所有運行中的計時器。

```javascript
function getActiveTimers(): Timer[]
```

**Response**: 所有狀態為 "running" 的 Timer 陣列

---

### 11. Get Pending Alarms

取得所有待觸發鬧鐘。

```javascript
function getPendingAlarms(): Alarm[]
```

**Response**: 所有狀態為 "pending" 且 triggerTime > 現在 的 Alarm 陣列

---

## Events

應用發出以下事件供 UI 層監聽。

### Timer Events

```javascript
// 新計時器建立
document.addEventListener('timerCreated', (e) => {
  const timer = e.detail;  // Timer 物件
});

// 計時器更新（進度變化）
document.addEventListener('timerUpdated', (e) => {
  const timer = e.detail;
});

// 計時器完成
document.addEventListener('timerCompleted', (e) => {
  const timer = e.detail;
});

// 計時器刪除
document.addEventListener('timerDeleted', (e) => {
  const id = e.detail;
});

// 計時器暫停
document.addEventListener('timerPaused', (e) => {
  const timer = e.detail;
});
```

### Alarm Events

```javascript
// 鬧鐘觸發
document.addEventListener('alarmTriggered', (e) => {
  const alarm = e.detail;
});

// 鬧鐘刪除
document.addEventListener('alarmDeleted', (e) => {
  const id = e.detail;
});
```

---

## Error Handling

### Error Types

```javascript
class ValidationError extends Error {
  constructor(message: string, field: string) {
    this.name = 'ValidationError';
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(id: string, type: 'Timer' | 'Alarm') {
    this.name = 'NotFoundError';
    this.id = id;
    this.type = type;
  }
}

class StorageError extends Error {
  constructor(message: string) {
    this.name = 'StorageError';
  }
}
```

### Error Response Pattern

```javascript
try {
  const timer = createTimer({ label: '', totalSeconds: 0 });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Invalid ${error.field}: ${error.message}`);
  } else if (error instanceof StorageError) {
    console.error('Storage failed:', error.message);
  }
}
```

---

## Performance Notes

- 所有操作同步執行 (< 10ms)
- 大量操作（建立 20 個計時器）: < 100ms
- UI 更新通過事件觸發（非阻塞）

---

**Contract Version**: 1.0  
**Status**: Ready for Implementation

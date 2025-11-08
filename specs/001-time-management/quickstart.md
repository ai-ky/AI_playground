# Quick Start Guide: 時間管理網站

**Target Audience**: Developers implementing Phase 2  
**Duration**: 15 minutes to understand architecture

## Project Overview

前端靜態時間管理應用，支援：
- ⏱️ 倒數計時（實時精準度 ±2 秒）
- ⏰ 鬧鐘（特定時間觸發）
- 🎤 語音輸入（繁體中文 + 英文後備）
- 💾 完全離線工作（LocalStorage 持久化）
- 📱 響應式設計（相容所有現代瀏覽器）

## Technology Stack

```
Frontend: HTML5 + CSS3 + Vanilla JavaScript (ES2020+)
Storage: LocalStorage (JSON) + optional IndexedDB
APIs: Web Storage, Web Audio, Web Speech Recognition
Offline: Service Worker + Cache-First strategy
Testing: Jest (unit) + Playwright (E2E)
No Build Step: Direct deployment to GitHub Pages
```

## Project Structure

```
├── index.html                 # 應用程式入口
├── src/
│   ├── js/
│   │   ├── app.js             # 主應用初始化
│   │   ├── timer.js           # 計時器邏輯 (核心模塊)
│   │   ├── alarm.js           # 鬧鐘邏輯
│   │   ├── chat.js            # 聊天框輸入處理
│   │   ├── storage.js         # LocalStorage 抽象層
│   │   ├── audio.js           # 提示音播放
│   │   └── speech.js          # Web Speech API 整合
│   ├── css/
│   │   ├── style.css          # 主樣式
│   │   └── responsive.css     # 響應式設計
│   └── components/            # HTML 片段（可選）
├── tests/
│   ├── unit/
│   │   ├── timer.test.js
│   │   └── chat.test.js
│   └── integration/
│       └── e2e.test.js
├── assets/
│   ├── sounds/
│   │   ├── alarm1.mp3
│   │   └── alarm2.mp3
│   └── icons/
├── docs/
│   ├── ARCHITECTURE.md        # 詳細架構文檔
│   └── API.md                 # API 參考
├── service-worker.js          # 離線支援
├── manifest.json              # PWA 清單
└── package.json               # 開發工具 (可選)
```

## Core Modules

### 1. Timer Module (timer.js)

計時器管理的核心模塊。

```javascript
// 公開 API
TimerApp.Timer.create(label, totalSeconds) → Timer
TimerApp.Timer.update(id, updates) → Timer
TimerApp.Timer.delete(id) → void
TimerApp.Timer.pause(id) → Timer
TimerApp.Timer.resume(id) → Timer
TimerApp.Timer.list() → Array<Timer>
TimerApp.Timer.getActive() → Array<Timer>
```

### 2. Alarm Module (alarm.js)

鬧鐘管理。

```javascript
TimerApp.Alarm.create(label, triggerTime) → Alarm
TimerApp.Alarm.update(id, updates) → Alarm
TimerApp.Alarm.delete(id) → void
TimerApp.Alarm.list() → Array<Alarm>
TimerApp.Alarm.getPending() → Array<Alarm>
```

### 3. Chat Module (chat.js)

聊天框輸入處理（文字 + 語音混合）。

```javascript
TimerApp.Chat.init(containerElement)
TimerApp.Chat.parseInput(text) → {type, value}
TimerApp.Chat.startVoiceInput() → Promise<string>
TimerApp.Chat.stopVoiceInput() → void
```

### 4. Storage Module (storage.js)

LocalStorage 抽象層，所有數據操作通過此模塊。

```javascript
TimerApp.Storage.init() → Promise<void>
TimerApp.Storage.save(key, value) → Promise<void>
TimerApp.Storage.load(key) → any
TimerApp.Storage.clear() → Promise<void>
TimerApp.Storage.export() → JSON
```

### 5. Audio Module (audio.js)

提示音播放。

```javascript
TimerApp.Audio.play(soundId) → Promise<void>
TimerApp.Audio.setSoundId(soundId) → void
TimerApp.Audio.stop() → void
```

## Data Flow

```
用戶輸入
  ↓
Chat.parseInput() → {type: 'timer'|'alarm', value: ...}
  ↓
Timer.create() / Alarm.create()
  ↓
Storage.save() → LocalStorage
  ↓
Emit 'timerCreated' / 'alarmTriggered' event
  ↓
UI 監聽事件，更新視圖
```

## Common Tasks

### 新增計時器

```javascript
const timer = TimerApp.Timer.create('工作', 300); // 5 分鐘
// Timer 物件自動保存至 LocalStorage
// 自動啟動計時邏輯
```

### 暫停/恢復

```javascript
TimerApp.Timer.pause(timerId);
TimerApp.Timer.resume(timerId);
```

### 處理計時器完成

```javascript
document.addEventListener('timerCompleted', (e) => {
  const timer = e.detail;
  console.log(`${timer.label} 完成！`);
  TimerApp.Audio.play(timer.soundId);
});
```

### 解析用戶輸入

```javascript
const input = "5分鐘工作";
const parsed = TimerApp.Chat.parseInput(input);
// → {type: 'timer', value: {seconds: 300, label: '工作'}}

if (parsed.type === 'timer') {
  TimerApp.Timer.create(parsed.value.label, parsed.value.seconds);
}
```

## Testing Strategy

### 單元測試 (Jest)

測試各模塊的獨立功能：

```javascript
// tests/unit/timer.test.js
describe('Timer Module', () => {
  test('creates timer with correct totalSeconds', () => {
    const timer = TimerApp.Timer.create('test', 300);
    expect(timer.totalSeconds).toBe(300);
    expect(timer.state).toBe('running');
  });
  
  test('pause timer stops countdown', () => {
    const timer = TimerApp.Timer.create('test', 300);
    TimerApp.Timer.pause(timer.id);
    const paused = TimerApp.Timer.get(timer.id);
    expect(paused.state).toBe('paused');
  });
});
```

### 集成測試 (Playwright)

測試完整用戶流程：

```javascript
// tests/integration/e2e.test.js
test('user can create and complete a timer', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[id="chat-box"]', '5分鐘');
  await page.click('button[id="send"]');
  await page.waitForSelector('[data-id*="timer"]');
  await page.waitForTimeout(5000);
  // 驗證計時進度
  const remaining = await page.textContent('[data-remaining]');
  expect(parseInt(remaining)).toBeLessThan(300);
});
```

## Deployment

### GitHub Pages

```bash
# 無需編譯，直接推送
git push origin main

# GitHub Actions 可自動部署
# 或在 Settings → Pages 中設定
```

### Local Development

```bash
# 無需安裝依賴（推薦）
python -m http.server 3000
# 訪問 http://localhost:3000

# 或使用 npm (可選)
npm install
npm run dev
```

## Browser Support

| 瀏覽器 | 版本 | 語音輸入 | 離線工作 |
|--------|------|---------|---------|
| Chrome | 120+ | ✅ | ✅ |
| Firefox | 121+ | ⚠️ 部分 | ✅ |
| Safari | 17+ | ❌ | ✅ |
| Edge | 120+ | ✅ | ✅ |

語音在 Safari 中不可用，但文字輸入完全功能。

## Performance Tips

### 最小化 DOM 操作

使用事件委派而非直接更新每個計時器：

```javascript
// ❌ 避免
items.forEach(item => updateDOM(item));

// ✅ 推薦
document.addEventListener('timerUpdated', updateSingleDOM);
```

### 限制重繪頻率

計時器每秒更新一次即足夠，不需每毫秒更新：

```javascript
setInterval(() => {
  updateUI(); // 每 1000ms 一次
}, 1000);
```

### 離線優先

確保 Service Worker 正確緩存所有資源：

```javascript
// service-worker.js
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/src/css/style.css',
        '/src/js/app.js',
        // 所有資源...
      ]);
    })
  );
});
```

## Debugging

### LocalStorage 檢查

```javascript
// 瀏覽器 DevTools Console
localStorage.getItem('timerapp_state');

// 清除所有數據
localStorage.clear();
```

### 事件追蹤

```javascript
// 監聽所有計時器事件
['timerCreated', 'timerUpdated', 'timerCompleted', 'timerDeleted'].forEach(e => {
  document.addEventListener(e, (evt) => {
    console.log(`Event: ${e}`, evt.detail);
  });
});
```

### 時間校準檢查

```javascript
// 檢查計時精準度
const start = Date.now();
await new Promise(resolve => setTimeout(resolve, 10000)); // 10 秒
const elapsed = Date.now() - start;
console.log(`Elapsed: ${elapsed}ms (should be ~10000)`);
```

## Common Issues

### 1. 語音輸入不工作

- ✅ 檢查瀏覽器是否支援 Web Speech API (Chrome/Edge/Safari 部分)
- ✅ 確認麥克風權限已授予
- ✅ 使用文字輸入作為後備

### 2. 計時器不精準

- ✅ ±2 秒誤差正常（技術限制）
- ✅ 每 10 秒自動校準
- ✅ 若需更高精準度，考慮 Web Workers

### 3. 離線不工作

- ✅ 確認 Service Worker 已註冊
- ✅ 檢查 DevTools → Application → Service Workers
- ✅ 確保資源已緩存（Network tab）

## Next Steps

1. ✅ 閱讀本指南和 ARCHITECTURE.md
2. 📖 查看 /contracts/ 中的 API 文檔
3. 👨‍💻 開始實作 Phase 2（參考 `/speckit.tasks`）
4. 🧪 編寫單元和集成測試
5. 🚀 部署至 GitHub Pages

---

**Guide Version**: 1.0  
**Last Updated**: 2025-11-05  
**Status**: Ready for Development

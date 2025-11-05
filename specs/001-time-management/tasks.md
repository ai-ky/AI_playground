# Tasks: 時間管理網站

**Input**: Design documents from `/specs/001-time-management/`  
**Branch**: `001-time-management`  
**Status**: Ready for Implementation  
**Estimated Duration**: 58-76 hours (1.5-2 weeks full-time)

---

## Format Guide

- **[P]**: Task can run in parallel (different files, no blocking dependencies)
- **[US#]**: User Story number (US1, US2, US3, US4)
- **[T###]**: Task ID in execution order
- File paths are absolute relative to repository root

---

## Phase 1: Setup & Infrastructure (6-8 hours)

**Purpose**: Project initialization and foundational structure

**Checkpoint**: Basic structure ready for development

### Setup Tasks

- [ ] T001 Create project directory structure: `index.html`, `/src`, `/tests`, `/assets` at repository root
- [ ] T002 [P] Create HTML entry point: `index.html` with basic meta tags, viewport, charset settings
- [ ] T003 [P] Create CSS files: `src/css/style.css` (main styles) and `src/css/responsive.css` (mobile-first responsive)
- [ ] T004 [P] Initialize Service Worker: `service-worker.js` with basic structure and Cache-First strategy
- [ ] T005 [P] Create PWA manifest: `manifest.json` with app name, icons, theme color for installability
- [ ] T006 Create `package.json` with Jest, Playwright, and dev tools (optional but recommended)
- [ ] T007 [P] Create `src/js/app.js` with TimerApp global namespace and module initialization pattern

---

## Phase 2: Foundational Modules (16-20 hours)

**Purpose**: Core infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: All foundational tasks MUST be complete before user story work begins

**Checkpoint**: All modules functional and independently testable

### Storage Layer (Critical Path)

- [ ] T008 [P] Implement `src/js/storage.js` - LocalStorage abstraction layer with:
  - `init()` - Initialize storage, check version compatibility
  - `save(key, value)` - Persist to LocalStorage (JSON serialization)
  - `load(key)` - Retrieve from LocalStorage
  - `clear()` - Wipe all data
  - `export()` / `import()` - Data backup/restore

- [ ] T009 [P] Add storage error handling: `StorageError` class with descriptive messages

### Timer Management Core

- [ ] T010 [P] Implement `src/js/timer.js` Timer module with:
  - Data structure: Timer object with id, type, label, totalSeconds, remainingSeconds, state, createdAt, soundId
  - `create(label, totalSeconds, soundId)` - Create new timer instance
  - `update(id, updates)` - Update timer properties
  - `delete(id)` - Remove timer from list
  - `list()` - Get all timers
  - `getActive()` - Get only running timers
  - State management: "running" ↔ "paused" → "completed"

- [ ] T011 [P] Add timer countdown logic to Timer module:
  - `pause(id)` - Stop countdown and record pausedAt
  - `resume(id)` - Resume from paused state
  - `_runCountdown(id)` - Internal interval management with 1-second updates
  - Calibration: Check system time every 10 seconds for ±500ms drift correction

- [ ] T012 [P] Add timer validation in `src/js/timer.js`:
  - Validate totalSeconds > 0
  - Validate state transitions (only allow: running→paused, paused→running, any→completed)
  - Prevent operations on non-existent timers (throw `NotFoundError`)

### Alarm Management Core

- [ ] T013 [P] Implement `src/js/alarm.js` Alarm module with:
  - Data structure: Alarm object with id, type, label, triggerTime, state, createdAt, soundId, isRecurring
  - `create(label, triggerTime, soundId)` - Create new alarm
  - `update(id, updates)` - Update alarm properties (only soundId if already triggered)
  - `delete(id)` - Remove alarm
  - `list()` - Get all alarms
  - `getPending()` - Get only pending alarms with triggerTime > now

- [ ] T014 [P] Add alarm trigger detection in `src/js/alarm.js`:
  - Monitor pending alarms every second
  - When triggerTime reached, emit 'alarmTriggered' event
  - Update state to "triggered"
  - Persist change to storage

- [ ] T015 [P] Add alarm validation in `src/js/alarm.js`:
  - Validate triggerTime > now (reject past times)
  - Validate state: "pending" | "triggered" | "cancelled"
  - Throw `ValidationError` for invalid inputs

### Audio & Notification Layer

- [ ] T016 [P] Implement `src/js/audio.js` Audio module with:
  - Sound registry: Map "alarm1" → `/assets/sounds/alarm1.mp3`, "alarm2" → `/assets/sounds/alarm2.mp3`
  - `play(soundId)` - Play audio file (handle both Web Audio API and HTML5 audio fallback)
  - `stop()` - Stop current playback
  - `setSoundId(id)` - Set default sound preference
  - Error handling: Graceful fallback if audio unavailable

- [ ] T017 [P] Create placeholder sound files:
  - `assets/sounds/alarm1.mp3` - Standard bell (placeholder 1 second tone)
  - `assets/sounds/alarm2.mp3` - Digital chime (placeholder 1 second tone)

### Event System

- [ ] T018 [P] Implement event dispatcher in `src/js/app.js`:
  - `emitEvent(eventName, detail)` - Dispatch custom DOM events
  - Events to support: 'timerCreated', 'timerUpdated', 'timerPaused', 'timerCompleted', 'timerDeleted', 'alarmTriggered', 'alarmDeleted'
  - Ensure all Timer/Alarm operations emit appropriate events

- [ ] T019 [P] Add global state management in `src/js/app.js`:
  - Initialize TimerApp.state with items[], settings{theme, defaultSound, language}
  - Synchronize state changes with Storage automatically
  - Provide TimerApp.getState() and TimerApp.setState(updates)

**Foundational Checkpoint**: 
- Storage fully functional with persistence
- Timer and Alarm modules working independently
- Audio playback operational
- Event system emitting correctly
- All 11 operations from timer-api.md implemented

---

## Phase 3: User Story 1 - 建立並啟動鬧鐘 (Priority: P1) 🎯 MVP

**Goal**: Users can create alarms via text input, set specific date/time, receive notification when triggered

**Independent Test**: 
1. Create text-input alarm for "tomorrow 9am"
2. Verify alarm appears in list with type label "鬧鐘"
3. Mock time to trigger time, verify notification and sound play
4. Delete alarm, verify removal from list

### Tests for US1 (OPTIONAL)

- [ ] T020 [P] [US1] Unit test for Alarm.create() in `tests/unit/alarm.test.js`:
  - Test valid alarm creation with correct state
  - Test validation: reject past triggerTime
  - Test persistence to storage

- [ ] T021 [P] [US1] Unit test for Alarm trigger logic in `tests/unit/alarm.test.js`:
  - Test alarm state change to "triggered" when time reaches
  - Test 'alarmTriggered' event emission
  - Mock Date.now() to simulate time passage

- [ ] T022 [US1] Integration test for alarm creation flow in `tests/integration/e2e.test.js`:
  - Test complete user flow: input → create → trigger → notification
  - Verify visual display on page
  - Verify sound plays

### Implementation for US1

- [ ] T023 [P] [US1] Create chatbox UI component in `src/components/chatbox.html`:
  - Input field with id="chat-input"
  - Submit button with id="chat-send"
  - Initial placeholder text: "輸入時間或說話，例如『明天9點』或『五分鐘』"
  - Voice button with id="voice-btn" (will be connected in US2)

- [ ] T024 [P] [US1] Create timer list container in `src/components/timerlist.html`:
  - Div with id="timer-list"
  - Empty state message: "尚無計時器，開始建立一個吧"
  - Structure for rendering items

- [ ] T025 [US1] Implement ChatInput parser in `src/js/chat.js`:
  - Function `parseTimeInput(text)` that recognizes alarm patterns:
    - "明天9點" → {type: 'alarm', hour: 9, day: 'tomorrow'}
    - "下午3點半" → {type: 'alarm', hour: 15, minute: 30}
    - "23:45" → {type: 'alarm', time: '23:45'}
  - Return {type, value} or null if unrecognizable
  - Use regex for Chinese time expressions: /(\d+)點|(\d+):(\d+)/

- [ ] T026 [US1] Implement time string to timestamp conversion in `src/js/chat.js`:
  - Function `parseAlarmTime(input)` converts natural language to unix timestamp
  - Handle "明天", "後天", relative dates
  - Return timestamp or throw ValidationError if invalid

- [ ] T027 [US1] Create alarm creation UI handler in `src/js/app.js`:
  - Listen to "chat-send" button click
  - Get input value, parse it
  - Call `TimerApp.Alarm.create()` with parsed data
  - Clear input field
  - Handle errors with user-friendly messages

- [ ] T028 [P] [US1] Create timer item renderer in `src/js/app.js`:
  - Function `renderTimerItem(item)` creates HTML for single Timer or Alarm
  - Show type badge: "⏰ 鬧鐘" or "⏱️ 倒數"
  - Show label, remaining/trigger time
  - Include delete button

- [ ] T029 [US1] Create list renderer in `src/js/app.js`:
  - Function `renderList()` fetches sorted items from storage
  - Sort by createdAt descending (newest first)
  - Call `renderTimerItem()` for each item
  - Insert into #timer-list
  - Handle empty state

- [ ] T030 [US1] Connect list updates to events in `src/js/app.js`:
  - Listen to 'alarmCreated', 'alarmTriggered', 'alarmDeleted' events
  - Call `renderList()` to update UI
  - Use event delegation for delete buttons

- [ ] T031 [US1] Add delete functionality in `src/js/app.js`:
  - Handle delete button clicks (delegated)
  - Call `TimerApp.Alarm.delete(id)`
  - Confirm dialog before deletion

- [ ] T032 [US1] Implement alarm notification when triggered:
  - When 'alarmTriggered' event fires, show visual notification:
    - Pop-up or modal with alarm label
    - "完成" button to dismiss
  - Call `TimerApp.Audio.play(alarm.soundId)`
  - Update alarm display to show "已觸發"

- [ ] T033 [US1] Add styles for alarm display in `src/css/style.css`:
  - Timer/Alarm item card styling
  - Type badge styling (色彩區分)
  - Responsive grid layout (1 column on mobile, 2+ on desktop)
  - Delete button styling

**Checkpoint US1**: 
- Users can create alarms via text input (e.g., "明天9點")
- Alarms display in unified list with type label
- Time accuracy sufficient for UI (±few seconds acceptable)
- User can delete alarms
- Alarm triggers with notification + sound
- All visual feedback working

---

## Phase 4: User Story 2 - 使用語音建立倒數計時 (Priority: P1)

**Goal**: Users create countdowns via chatbox (text OR voice), system begins countdown, visual progress updates, completion triggers notification

**Independent Test**:
1. Enter/say "5分鐘" in chatbox
2. Verify timer appears with "⏱️ 倒數計時" label, counting down
3. Wait 5 seconds, verify remaining time decreases correctly (±2 sec accuracy)
4. Let timer complete, verify sound plays and notification shows

### Tests for US2 (OPTIONAL)

- [ ] T034 [P] [US2] Unit test for Timer countdown in `tests/unit/timer.test.js`:
  - Test timer creation with 60 seconds
  - Mock setInterval, verify decrements by 1 per second
  - Test calibration correction every 10 seconds

- [ ] T035 [P] [US2] Unit test for text parsing (duration) in `tests/unit/chat.test.js`:
  - "5分鐘" → {type: 'timer', seconds: 300}
  - "30秒" → {type: 'timer', seconds: 30}
  - "2小時" → {type: 'timer', seconds: 7200}

- [ ] T036 [P] [US2] Unit test for voice input fallback in `tests/unit/speech.test.js`:
  - Mock SpeechRecognition
  - Test that text input works even if speech unavailable
  - Test language switching zh-TW ↔ en-US

- [ ] T037 [US2] E2E test for timer creation and countdown in `tests/integration/e2e.test.js`:
  - Create timer via text: "10秒"
  - Verify countdown visually updating
  - Wait for completion, verify event fired
  - (Actual wait time: use fast-forward mocking, not real time)

### Implementation for US2

- [ ] T038 [P] [US2] Extend ChatInput parser for timer patterns in `src/js/chat.js`:
  - Add timer detection: "5分鐘", "30秒", "2小時", "1.5小時"
  - Return {type: 'timer', seconds: <number>}
  - Support both Chinese and English: "5 minutes", "30 seconds"

- [ ] T039 [US2] Implement timer creation handler in `src/js/app.js`:
  - Detect parsed input type === 'timer'
  - Extract optional label from input (e.g., "5分鐘工作" → label="工作")
  - Call `TimerApp.Timer.create(label, seconds, soundId)`
  - Handle user-friendly error messages

- [ ] T040 [P] [US2] Implement timer progress display in `src/js/app.js`:
  - Function `formatTime(seconds)` → "MM:SS" format
  - Example: 245 seconds → "04:05"
  - Update timer item to show `<span class="timer-remaining">{formatted}</span>`

- [ ] T041 [US2] Add timer countdown display updates in `src/js/app.js`:
  - Listen to 'timerUpdated' event (fired every 1 second)
  - For each active timer, update the display with new remainingSeconds
  - Use debouncing to avoid excessive DOM updates

- [ ] T042 [P] [US2] Add timer completion handler in `src/js/app.js`:
  - Listen to 'timerCompleted' event
  - Show notification: "{label} 完成！" with completion time
  - Play sound: `TimerApp.Audio.play(timer.soundId)`
  - Update display to show "已完成"
  - Optionally offer "再來一次" (create same duration again)

- [ ] T043 [US2] Implement pause/resume buttons for timers in `src/components/timerlist.html`:
  - Add pause button (id="pause-btn-{id}") for running timers
  - Add resume button (id="resume-btn-{id}") for paused timers
  - Show time remaining in button tooltip

- [ ] T044 [US2] Connect pause/resume handlers in `src/js/app.js`:
  - Delegated click listeners on pause/resume buttons
  - Call `TimerApp.Timer.pause(id)` or `TimerApp.Timer.resume(id)`
  - Update button state (pause↔resume)
  - Verify state transitions correctly

- [ ] T045 [P] [US2] Implement Web Speech API integration in `src/js/speech.js`:
  - Initialize SpeechRecognition (Chrome/Edge) or polyfill check
  - Function `startVoiceInput(onResult, onError)`
  - Configure: lang='zh-TW', continuous=true, interimResults=true
  - Return recognized text to caller
  - Handle errors gracefully (no microphone, denied permission)

- [ ] T046 [US2] Add voice button functionality in `src/js/app.js`:
  - Click #voice-btn → start listening
  - Visual feedback: button text → "聽中..." or mic icon animation
  - When speech ends, parse text and create timer/alarm
  - If no text recognized: "沒有聽到，請重試"

- [ ] T047 [P] [US2] Add fallback for browsers without Speech API in `src/js/speech.js`:
  - Detect if SpeechRecognition available
  - If not: show toast "您的瀏覽器不支援語音輸入，請使用文字輸入"
  - Ensure text input always works

- [ ] T048 [US2] Extend styles for timer display in `src/css/style.css`:
  - Timer countdown display: large, prominent font (e.g., 2.5rem)
  - Pause/resume buttons styling
  - Countdown color change: green → orange → red as time runs out (optional)
  - Animation: subtle pulse/blink at < 10 seconds remaining

- [ ] T049 [P] [US2] Add media query for mobile responsiveness in `src/css/responsive.css`:
  - Timer display readable on small screens
  - Buttons easily tappable (min 44px height)
  - Chat input full width on mobile
  - Stack buttons vertically if needed

**Checkpoint US2**:
- Users can create timers via text (e.g., "5分鐘") or voice (Chrome/Edge)
- Timers appear in list and count down every second
- Pause/resume functionality working
- Countdown accuracy ±2 seconds verified
- Timer completion triggers notification + sound
- Voice input gracefully degrades on unsupported browsers

---

## Phase 5: User Story 3 - 管理多個計時器 (Priority: P2)

**Goal**: Users can create and manage up to 20 timers/alarms simultaneously in single list, sorted by creation time, type clearly labeled

**Independent Test**:
1. Create 5 timers with different durations
2. Verify all 5 appear in list, most recent at top
3. Each labeled "⏱️ 倒數" or "⏰ 鬧鐘"
4. Verify all count down independently
5. Complete one, verify only that one triggers sound
6. Others continue unaffected

### Tests for US3 (OPTIONAL)

- [ ] T050 [P] [US3] Unit test for list sorting in `tests/unit/timer.test.js`:
  - Create 3 timers with different createdAt values
  - Call `TimerApp.list()` (or getAll())
  - Verify descending order by createdAt
  - Verify most recent first

- [ ] T051 [P] [US3] Unit test for parallel timer management in `tests/unit/timer.test.js`:
  - Create 5 timers, pause 1, resume 1, delete 1
  - Verify operations don't interfere with each other
  - Verify state of each maintained correctly
  - Performance: all ops complete in < 100ms combined

- [ ] T052 [US3] E2E test for multi-timer UI in `tests/integration/e2e.test.js`:
  - Create 3 timers with different durations
  - Verify visual display shows all 3
  - Verify countdowns are independent
  - (Use fast-forward timing, not real seconds)

### Implementation for US3

- [ ] T053 [P] [US3] Implement sorting in list renderer in `src/js/app.js`:
  - Modify `renderList()` to sort by createdAt descending
  - Most recently created appears at top (newest first)
  - Update on every list change

- [ ] T054 [P] [US3] Add type badge to timer item rendering in `src/js/app.js`:
  - For Timer: show "⏱️ 倒數計時"
  - For Alarm: show "⏰ 鬧鐘"
  - Use emoji + text for clarity
  - Different colors: orange for timer, blue for alarm (CSS)

- [ ] T055 [US3] Optimize timer update rendering in `src/js/app.js`:
  - Instead of re-rendering entire list every second:
    - Only update the specific timer item's countdown display
    - Use event delegation and data attributes for targeting
    - Reduces DOM churn, improves performance

- [ ] T056 [P] [US3] Implement efficient interval management in `src/js/timer.js`:
  - Use single shared interval instead of one per timer
  - Update all active timers in one tick
  - Check for completed timers and emit events
  - Stop interval when no active timers remain

- [ ] T057 [US3] Add limit detection in `src/js/app.js`:
  - Before creating new timer, check count
  - If >= 20, show warning: "已達到最大計時器數量（20個），請刪除舊的計時器"
  - Allow user to proceed or cancel

- [ ] T058 [P] [US3] Add metadata display in list header in `src/components/timerlist.html`:
  - Show count: "計時器: X個" (X = active + completed/triggered)
  - Show performance note: "所有計時器獨立運行" if 5+ active

- [ ] T059 [US3] Implement performance monitoring in `src/js/app.js`:
  - Measure time to render list (should be < 50ms)
  - Log warning if > 100ms
  - Helpful for debugging performance issues
  - Optional: show in DevTools only, not user-facing

**Checkpoint US3**:
- Multiple timers/alarms coexist in single list
- List correctly sorted (newest first)
- Type labels clear and distinct
- All timers count down independently
- No performance degradation with 20 items
- Completing one timer doesn't affect others
- Delete/pause operations work on any item

---

## Phase 6: User Story 4 - 編輯和刪除計時器 (Priority: P2)

**Goal**: Users can edit timers/alarms (label, time) and delete, with visual feedback

**Independent Test**:
1. Create timer "5分鐘工作"
2. Click edit, change label to "工作休息"
3. Save, verify label updated
4. Click delete, confirm dialog
5. Verify timer removed from list

### Tests for US4 (OPTIONAL)

- [ ] T060 [P] [US4] Unit test for Timer.update() in `tests/unit/timer.test.js`:
  - Test updating label
  - Test updating soundId
  - Verify state not changed by label update
  - Test rejection of invalid states

- [ ] T061 [P] [US4] Unit test for delete logic in `tests/unit/timer.test.js`:
  - Test Timer.delete() removes from list
  - Test Alarm.delete() removes from list
  - Verify persistence updated
  - Verify 'timerDeleted'/'alarmDeleted' event emitted

- [ ] T062 [US4] E2E test for edit/delete flow in `tests/integration/e2e.test.js`:
  - Create timer, click edit button
  - Verify edit modal appears with current values
  - Change label, save, verify update on page
  - Delete, confirm dialog, verify removal

### Implementation for US4

- [ ] T063 [P] [US4] Create edit button and modal in `src/components/timerlist.html`:
  - Add edit button (id="edit-btn-{id}") to each timer item
  - Modal div (id="edit-modal") with:
    - Input field for label (max 50 chars)
    - Sound selector dropdown (alarm1, alarm2)
    - For timers: duration editor (readonly or editable)
    - Save and Cancel buttons

- [ ] T064 [US4] Implement edit handler in `src/js/app.js`:
  - Click edit button → show modal with current values
  - Populate form with existing data
  - Validation: label max 50 chars
  - Call `TimerApp.Timer.update(id, updates)` on save
  - Close modal and refresh list view

- [ ] T065 [P] [US4] Add label editing capability in `src/js/timer.js`:
  - Update method should accept label change
  - Persist to storage
  - Emit 'timerUpdated' event

- [ ] T066 [P] [US4] Add sound preference change in edit in `src/js/timer.js`:
  - Update method should accept soundId change
  - Only change for alarms that haven't triggered yet
  - Block change if already triggered (Alarm only)

- [ ] T067 [US4] Implement delete button with confirmation in `src/js/app.js`:
  - Click delete button → show confirm dialog
  - Dialog text: "確認刪除 「{label}」嗎？"
  - Options: 確認 / 取消
  - On confirm: call `TimerApp.Timer.delete(id)` or `TimerApp.Alarm.delete(id)`

- [ ] T068 [P] [US4] Clean up running intervals on delete in `src/js/timer.js`:
  - If deleting a running timer, clear its interval
  - If deleting a paused timer, no cleanup needed
  - Persist deletion to storage

- [ ] T069 [US4] Add undo functionality (optional enhancement) in `src/js/app.js`:
  - After delete, show toast: "已刪除 {label}" with "復原" button
  - Undo restores timer to list with state "paused"
  - Timeout: 5 seconds, then auto-dismiss undo option

- [ ] T070 [P] [US4] Style edit modal in `src/css/style.css`:
  - Modal overlay with semi-transparent background
  - Modal box: centered, readable width (400px max)
  - Form inputs: proper spacing, clear labels
  - Buttons: Save (primary), Cancel (secondary)
  - Input styling: border, focus states, validation feedback

- [ ] T071 [US4] Add form validation UI in `src/css/style.css`:
  - Show error state for invalid input (red border)
  - Show character count for label: "X/50"
  - Disable Save button if form invalid
  - Clear error on user correction

**Checkpoint US4**:
- Users can edit label and sound preference
- Edit modal intuitive and accessible
- Delete with confirmation dialog preventing accidental loss
- Undo functionality if implemented
- All changes persist to storage
- UI feedback for all operations clear

---

## Phase 7: UI Polish & Cross-Cutting Concerns (12-16 hours)

**Purpose**: Complete UI/UX, settings, offline support, performance optimization

### Settings & Preferences

- [ ] T072 [P] Create settings modal in `src/components/settings.html`:
  - Theme: Light / Dark toggle
  - Default sound: alarm1 / alarm2 selector
  - Language: 繁體中文 / English selector
  - Clear all data button (with confirm)
  - About / Help link

- [ ] T073 [US?] Implement settings handler in `src/js/app.js`:
  - Load settings on startup from storage
  - Apply theme class to document
  - Save all preference changes
  - Apply language setting (prepare for i18n)

- [ ] T074 [P] Add theme switching in `src/css/style.css`:
  - Define CSS variables for colors (--bg-primary, --text-primary, etc.)
  - Light theme (default): light background, dark text
  - Dark theme: dark background, light text
  - Smooth transition between themes

### Service Worker & Offline Support

- [ ] T075 [P] Complete Service Worker in `service-worker.js`:
  - Register to intercept network requests
  - Cache-First strategy for assets:
    - Cache: index.html, all /src/*, /assets/sounds/*
    - Network fallback if cache miss (online only)
  - Periodic cache cleanup (remove old versions)

- [ ] T076 [P] Add offline indicator in `src/js/app.js`:
  - Detect online/offline state with `navigator.onLine`
  - Show indicator in UI: "離線模式" or checkmark if online
  - Disable voice input indicator if offline (graceful degradation)

- [ ] T077 [P] Add app installation (PWA) prompts in `src/js/app.js`:
  - Listen to `beforeinstallprompt` event
  - Show "安裝應用程式" button if available
  - Handle install flow

### Accessibility & Localization Prep

- [ ] T078 [P] Add ARIA labels in `src/components/timerlist.html` and chat:
  - Buttons: `aria-label="暫停計時器"`
  - Form inputs: `aria-label="輸入時間"`
  - Timer status: `aria-live="polite"` for dynamic updates
  - Ensure keyboard navigation works (Tab, Enter)

- [ ] T079 [P] Prepare localization structure in `src/js/app.js`:
  - Create i18n object with key→translation map
  - Example: `i18n.zh_TW.TIMER_LABEL`, `i18n.en_US.TIMER_LABEL`
  - Use `i18n[lang].KEY` instead of hard-coded strings
  - Switch language: update all text on page

### Performance Optimization

- [ ] T080 [P] Optimize timer interval updates in `src/js/timer.js`:
  - Use `requestAnimationFrame` instead of setInterval for UI updates (smoother)
  - Or keep setInterval for countdown but batch DOM updates
  - Measure and log performance (use `performance.now()`)

- [ ] T081 [P] Minify and optimize CSS in `src/css/`:
  - Remove unused styles
  - Combine style.css + responsive.css or keep separate?
  - Inline critical CSS in index.html for faster first paint

- [ ] T082 [P] Audit bundle size in `src/js/`:
  - Measure total JS size (all files combined)
  - Target: < 200KB uncompressed, < 60KB gzipped
  - Remove debug code before production

- [ ] T083 Optimize initial load in `index.html`:
  - Load critical CSS inline in `<style>` tag
  - Defer non-critical JS with `defer` attribute
  - Use `preload` for audio files: `<link rel="preload" href="/assets/sounds/alarm1.mp3">`

### Documentation

- [ ] T084 [P] Create user guide in `docs/USER_GUIDE.md`:
  - Screenshots of main features
  - How to create timer/alarm (text and voice)
  - How to pause/resume/delete
  - Troubleshooting: "語音不工作怎麼辦？" etc.

- [ ] T085 [P] Update developer documentation in `docs/DEVELOPER.md`:
  - Architecture overview
  - Module descriptions (Timer, Alarm, Chat, Storage, Audio)
  - How to extend (e.g., add new sound, language)
  - Running tests: `npm test`, `npm run e2e`

- [ ] T086 Update README.md in repository root:
  - Quick start: clone → `python -m http.server 3000` → visit localhost
  - Features summary
  - Browser support table
  - Links to detailed docs in `/docs/`

### Testing & QA

- [ ] T087 [P] Add smoke tests in `tests/smoke/`:
  - Basic app startup test
  - All modules load correctly
  - Storage accessible
  - (Can be simple Jest tests checking TimerApp global exists)

- [ ] T088 Run full test suite and coverage report:
  - `npm test` runs all unit + integration tests
  - Generate coverage report: target ≥ 70%
  - Fix any coverage gaps in critical paths

- [ ] T089 Manual cross-browser testing:
  - Chrome 120+: full features ✅
  - Firefox 121+: full features ✅
  - Safari 17+: timer/alarm only (no voice) ✅
  - Edge 120+: full features ✅
  - Document issues found

- [ ] T090 Performance audit with Lighthouse:
  - Run: `npm run build && npm run lighthouse`
  - Or manual: DevTools → Lighthouse
  - Target: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90
  - Fix any critical issues

### Deployment & Release

- [ ] T091 Prepare for GitHub Pages deployment:
  - Verify index.html at repository root (or /docs/)
  - Confirm all paths are relative (no absolute /src/...)
  - Test in local server mimicking Pages setup

- [ ] T092 Set GitHub Pages settings:
  - Repo → Settings → Pages
  - Source: main branch, / (root) directory
  - Or if using /docs/: select docs/ directory
  - Enable custom domain if desired

- [ ] T093 Create GitHub Actions workflow for auto-deploy (optional):
  - `.github/workflows/deploy.yml`
  - Trigger on push to main
  - Run tests, then deploy to Pages
  - (Can skip if manual push acceptable)

- [ ] T094 Create release notes for v1.0.0 in `CHANGELOG.md`:
  - Features: Timer, Alarm, Voice input (Chrome/Edge), Offline support
  - Known limitations: Voice not in Safari, ±2 sec timing accuracy
  - Installation: GitHub Pages URL

---

## Implementation Strategy

### MVP Scope
**Minimum Viable Product = User Story 1 + US2 Core (text input only)**
- Estimated: 20-24 hours
- Users can create timers via text "5分鐘"
- Timers count down and trigger notification
- No voice input, no pause/resume (Phase 1 MVP)

### Incremental Delivery
1. **Iteration 1** (2-3 days): MVP (US1 text + US2 basic timer)
2. **Iteration 2** (2-3 days): Add voice input (US2 full) + multi-timer (US3)
3. **Iteration 3** (2-3 days): Edit/delete (US4) + Polish (Phase 7)
4. **Iteration 4** (1-2 days): Testing, performance, deployment

### Parallel Execution Opportunities
- **T002-T007**: Setup tasks can all run in parallel
- **T008-T017**: All foundational modules (except T018-T019 which depend on others) can run parallel
- **T020-T049**: All US1 tasks except those with explicit dependencies can run parallel
- After Phase 2 complete: US1, US2, US3, US4 implementation can run **fully in parallel** (different features, no cross-dependencies)

### Critical Path
```
T001 → T008 (Storage) → T010 (Timer) 
    → T025-T026 (Chat parsing)
    → T028-T032 (UI rendering)
    ✓ US1 complete
    
T029-T042 (US2 timer display + voice)
    ✓ US2 complete
    
T053-T071 (US3-4 multi-management)
    ✓ Full feature complete
    
T072-T094 (Polish & deployment)
    ✓ Ready for production
```

---

## Dependencies Overview

```
Phase 1: Setup
    ↓
Phase 2: Foundation (T008-T019)
    ├─→ T025-T033 (US1 implementation)
    ├─→ T038-T049 (US2 implementation)
    ├─→ T053-T059 (US3 implementation)
    └─→ T063-T071 (US4 implementation)
    
US1-US4 can run in parallel after Phase 2

All ↓
Phase 7: Polish & QA → Deployment
```

---

## Success Criteria by Phase

### Phase 1 Complete
- [ ] Project structure created and files in place
- [ ] index.html loads without errors
- [ ] All CSS files linked correctly
- [ ] Service Worker registering

### Phase 2 Complete  
- [ ] All 11 Timer operations working
- [ ] All 7 Alarm operations working
- [ ] Storage persisting correctly
- [ ] Events emitting and listening working
- [ ] Audio playback functional
- [ ] No console errors

### Phase 3 (US1) Complete
- [ ] Text input for alarms: "明天9點" → creates alarm
- [ ] Alarms appear in list with "⏰ 鬧鐘" label
- [ ] Alarm triggers at correct time with notification + sound
- [ ] Delete alarm functionality working
- [ ] Independent test passes: Full alarm lifecycle

### Phase 4 (US2) Complete
- [ ] Text input for timers: "5分鐘" → creates timer
- [ ] Timers count down every second, ±2 sec accuracy
- [ ] Pause/resume working
- [ ] Voice input (Chrome/Edge) working, graceful fallback
- [ ] Independent test passes: Full timer lifecycle

### Phase 5 (US3) Complete
- [ ] Create 5 timers simultaneously, all visible in list
- [ ] All timers count down independently
- [ ] Complete one, only that one triggers sound
- [ ] Others unaffected, continue running
- [ ] Delete one, others keep going

### Phase 6 (US4) Complete
- [ ] Edit button opens modal, can change label/sound
- [ ] Changes persist after refresh
- [ ] Delete with confirmation dialog
- [ ] Undo functionality (optional)

### Phase 7 Complete
- [ ] Settings working (theme, language, sound)
- [ ] Service Worker offline mode working
- [ ] Lighthouse audit: Performance ≥90
- [ ] All tests passing
- [ ] Deployed to GitHub Pages, accessible via public URL

---

## Estimated Hours per Phase

| Phase | Tasks | Hours | Notes |
|-------|-------|-------|-------|
| Setup | T001-T007 | 6-8 | Parallel-able |
| Foundation | T008-T019 | 16-20 | Most can be parallel |
| US1 | T020-T033 | 12-16 | After foundation |
| US2 | T034-T049 | 12-16 | Parallel with US1 |
| US3 | T050-T059 | 8-10 | Parallel with US1/US2 |
| US4 | T060-T071 | 6-8 | Parallel with US1-3 |
| Polish | T072-T094 | 12-16 | Testing + deployment |
| **Total** | **T001-T094** | **58-76** | ~2 weeks full-time |

---

## Notes

- Tasks labeled [P] can run in parallel
- Tasks without [P] or explicit depends must run sequentially
- Each user story is independently testable/deployable
- Phase 2 (Foundation) is blocking all user stories
- No back-end development; all local browser APIs
- Testing is optional but highly recommended

**Status**: ✅ READY FOR IMPLEMENTATION

---

**Generated**: 2025-11-05  
**Task Count**: 94 tasks across 7 phases  
**Feature**: 時間管理網站 (Time Management Website)  
**Branch**: `001-time-management`

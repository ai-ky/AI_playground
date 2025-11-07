/**
 * 時間管理網站 - 主應用程式
 * 全域 TimerApp 命名空間初始化
 */

const TimerApp = (() => {
    // 私有變數
    let state = {
        items: [],
        settings: {
            theme: 'light',
            defaultSound: 'alarm1',
            language: 'zh_TW'
        },
        ui: {
            selectedId: null,
            isRecording: false,
            showSettings: false
        }
    };

    const DOM = {
        app: null,
        chatInput: null,
        chatSend: null,
        voiceBtn: null,
        timerList: null,
        settingsBtn: null,
        settingsModal: null,
        editModal: null,
        confirmModal: null,
        toastContainer: null,
        statusIndicator: null,
        inputError: null,
        listInfo: null
    };

    /**
     * 初始化應用程式
     */
    async function init() {
        console.log('時間管理應用程式初始化中...');

        try {
            // 1. 快取 DOM 元素
            cacheDOM();

            // 2. 載入設定和狀態
            await loadSettings();
            await loadState();

            // 3. 應用主題
            applyTheme();

            // 4. 設定事件監聽
            setupEventListeners();
            
            // 4b. 第 3 階段：設置聊天和列表事件
            setupChatInputHandler();
            attachListenerHandlers();

            // 5. 初始化模塊（如需要時）
            await initializeModules();

            // 6. 渲染初始 UI
            render();

            // 7. 設定監控（線上/離線、計時器更新等）
            setupMonitoring();

            console.log('✅ 應用程式已準備就緒');
        } catch (error) {
            console.error('❌ 應用程式初始化失敗:', error);
            showError('應用程式啟動失敗，請重新整理頁面');
        }
    }

    /**
     * 快取 DOM 元素
     */
    function cacheDOM() {
        DOM.app = document.getElementById('app');
        DOM.chatInput = document.getElementById('chat-input');
        DOM.chatSend = document.getElementById('chat-send');
        DOM.voiceBtn = document.getElementById('voice-btn');
        DOM.timerList = document.getElementById('timer-list');
        DOM.settingsBtn = document.getElementById('settings-btn');
        DOM.settingsModal = document.getElementById('settings-modal');
        DOM.editModal = document.getElementById('edit-modal');
        DOM.confirmModal = document.getElementById('confirm-modal');
        DOM.toastContainer = document.getElementById('toast-container');
        DOM.statusIndicator = document.getElementById('status-indicator');
        DOM.inputError = document.getElementById('input-error');
        DOM.listInfo = document.getElementById('list-info');

        if (!DOM.app) {
            throw new Error('應用程式容器未找到 (#app)');
        }
    }

    /**
     * 從儲存載入設定
     */
    async function loadSettings() {
        if (window.TimerApp?.Storage?.load) {
            const savedSettings = await window.TimerApp.Storage.load('settings');
            if (savedSettings) {
                state.settings = { ...state.settings, ...savedSettings };
            }
        }
    }

    /**
     * 從儲存載入狀態
     */
    async function loadState() {
        if (window.TimerApp?.Storage?.load) {
            const savedItems = await window.TimerApp.Storage.load('items');
            if (Array.isArray(savedItems)) {
                state.items = savedItems;
            }
        }
    }

    /**
     * 應用選定的主題
     */
    function applyTheme() {
        if (state.settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    /**
     * 設定事件監聽
     */
    function setupEventListeners() {
        // 聊天框事件
        DOM.chatSend?.addEventListener('click', handleChatSend);
        DOM.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSend();
        });

        // 語音按鈕
        DOM.voiceBtn?.addEventListener('click', handleVoiceInput);

        // 設定按鈕
        DOM.settingsBtn?.addEventListener('click', () => {
            showModal(DOM.settingsModal);
        });

        // 模態視窗關閉按鈕
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // 線上/離線事件
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // 自訂事件監聽
        setupCustomEventListeners();
    }

    /**
     * 設定自訂事件監聽
     */
    function setupCustomEventListeners() {
        // 計時器事件
        document.addEventListener('timerCreated', (e) => {
            console.log('計時器已建立:', e.detail);
            render();
            showToast(`已建立計時器: ${e.detail.label}`, 'success');
        });

        document.addEventListener('timerUpdated', () => {
            render();
        });

        document.addEventListener('timerCompleted', (e) => {
            console.log('計時器已完成:', e.detail);
            render();
            showToast(`${e.detail.label} 已完成！`, 'success');
            playSound(e.detail.soundId);
        });

        document.addEventListener('timerDeleted', () => {
            render();
        });

        // 鬧鐘事件
        document.addEventListener('alarmCreated', (e) => {
            console.log('鬧鐘已建立:', e.detail);
            render();
            showToast(`已建立鬧鐘: ${e.detail.label}`, 'success');
        });

        document.addEventListener('alarmTriggered', (e) => {
            console.log('鬧鐘已觸發:', e.detail);
            render();
            showToast(`鬧鐘已觸發: ${e.detail.label}！`, 'success');
            playSound(e.detail.soundId);
        });

        document.addEventListener('alarmDeleted', () => {
            render();
        });
    }

    /**
     * 初始化模塊
     */
    async function initializeModules() {
        // 待實作：Storage、Timer、Alarm、Audio 等模塊初始化
        console.log('模塊初始化中...');

        try {
            // 1. 初始化儲存 (T008)
            TimerApp.Storage.init();
            console.log('✓ Storage 模塊已初始化');

            // 2. 初始化音頻 (T016)
            TimerApp.Audio.init();
            console.log('✓ Audio 模塊已初始化');

            // 3. 初始化計時器 (T010)
            TimerApp.Timer.init();
            console.log('✓ Timer 模塊已初始化');

            // 4. 初始化鬧鐘 (T013)
            TimerApp.Alarm.init();
            console.log('✓ Alarm 模塊已初始化');

            // 5. 建立事件監聽 (T018)
            setupCustomEventListeners();

            console.log('✓ 所有模塊已初始化');
        } catch (error) {
            console.error('模塊初始化失敗:', error);
            showError('模塊初始化失敗：' + error.message);
        }
    }

    /**
     * 設定自訂事件監聽 (T018)
     */
    function setupCustomEventListeners() {
        // 計時器事件
        document.addEventListener('timerCreated', (e) => {
            console.log('事件監聽: timerCreated', e.detail);
            render();
        });

        document.addEventListener('timerUpdated', (e) => {
            console.log('事件監聽: timerUpdated', e.detail);
            render();
        });

        document.addEventListener('timerPaused', (e) => {
            console.log('事件監聽: timerPaused', e.detail);
            render();
        });

        document.addEventListener('timerCompleted', (e) => {
            console.log('事件監聽: timerCompleted', e.detail);
            const timer = e.detail.timer;
            showToast(`⏱️ ${timer.label} 完成！`, 'success');
            // 播放聲音
            if (TimerApp.Audio) {
                TimerApp.Audio.play(timer.soundId);
            }
            render();
        });

        document.addEventListener('timerDeleted', (e) => {
            console.log('事件監聽: timerDeleted', e.detail);
            render();
        });

        // 鬧鐘事件
        document.addEventListener('alarmCreated', (e) => {
            console.log('事件監聽: alarmCreated', e.detail);
            render();
        });

        document.addEventListener('alarmTriggered', (e) => {
            console.log('事件監聽: alarmTriggered', e.detail);
            const alarm = e.detail.alarm;
            showToast(`🔔 ${alarm.label} - 鬧鐘觸發！`, 'success');
            // 播放聲音
            if (TimerApp.Audio) {
                TimerApp.Audio.play(alarm.soundId);
            }
            render();
        });

        document.addEventListener('alarmDeleted', (e) => {
            console.log('事件監聽: alarmDeleted', e.detail);
            render();
        });
    }

    /**
     * 設定監控
     */
    function setupMonitoring() {
        // 更新線上狀態
        updateOnlineStatus();

        // 每秒更新計時器顯示
        setInterval(() => {
            // 待實作：更新計時器顯示
        }, 1000);

        // 定期保存狀態
        setInterval(saveState, 5000);
    }

    /**
     * 處理聊天傳送
     */
    async function handleChatSend() {
        const text = DOM.chatInput?.value.trim();
        if (!text) {
            showError('請輸入時間或設定');
            return;
        }

        try {
            clearError();
            console.log('輸入:', text);
            // 待實作：解析和建立計時器/鬧鐘

            // 清空輸入
            if (DOM.chatInput) {
                DOM.chatInput.value = '';
            }
        } catch (error) {
            showError(error.message);
        }
    }

    /**
     * 處理語音輸入
     */
    async function handleVoiceInput() {
        if (!navigator.mediaDevices?.getUserUserMedia) {
            showError('您的瀏覽器不支援語音輸入');
            return;
        }

        try {
            console.log('語音輸入已啟用');
            // 待實作：Web Speech API 整合
            showToast('語音輸入已啟用', 'info');
        } catch (error) {
            showError(error.message);
        }
    }

    /**
     * 渲染 UI
     */
    function render() {
        if (!DOM.app) return;

        // 第 3 階段：渲染清單
        renderList();
        updateListInfo();
    }

    /**
     * 更新清單資訊
     */
    function updateListInfo() {
        if (DOM.listInfo) {
            DOM.listInfo.textContent = `計時器: ${state.items.length} 個`;
        }
    }

    /**
     * 播放聲音
     */
    function playSound(soundId) {
        // 待實作：音頻播放
        console.log('播放聲音:', soundId);
    }

    /**
     * 顯示模態視窗
     */
    function showModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * 顯示吐司通知
     */
    function showToast(message, type = 'info') {
        if (!DOM.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        DOM.toastContainer.appendChild(toast);

        // 3 秒後移除
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * 顯示錯誤訊息
     */
    function showError(message) {
        if (DOM.inputError) {
            DOM.inputError.textContent = message;
            DOM.inputError.style.display = 'block';
        }
        showToast(message, 'error');
    }

    /**
     * 清除錯誤訊息
     */
    function clearError() {
        if (DOM.inputError) {
            DOM.inputError.textContent = '';
            DOM.inputError.style.display = 'none';
        }
    }

    /**
     * 更新線上狀態
     */
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        if (DOM.statusIndicator) {
            const statusDot = DOM.statusIndicator.querySelector('.status-dot');
            const statusText = DOM.statusIndicator.querySelector('.status-text');

            if (isOnline) {
                if (statusDot) statusDot.style.backgroundColor = '#22c55e';
                if (statusText) statusText.textContent = '線上';
            } else {
                if (statusDot) statusDot.style.backgroundColor = '#ef4444';
                if (statusText) statusText.textContent = '離線';
            }
        }
        console.log(isOnline ? '✅ 線上' : '❌ 離線');
    }

    /**
     * 保存狀態
     */
    function saveState() {
        // 待實作：保存到 Storage
    }

    // ============ 第 3 階段：用戶故事 1 - 鬧鐘建立與管理 ============

    /**
     * T028 [P] [US1] 計時器/鬧鐘項目渲染器
     * 為單一計時器或鬧鐘建立 HTML
     */
    function renderTimerItem(item) {
        if (!item || !item.id) return '';

        const isAlarm = item.type === 'alarm';
        const isTimer = item.type === 'timer';
        const isCompleted = item.state === 'completed' || item.state === 'triggered';
        const isRunning = item.state === 'running';
        const isPaused = item.state === 'paused';

        // 格式化時間顯示
        let timeDisplay = '';
        if (isAlarm) {
            const triggerDate = new Date(item.triggerTime);
            const now = new Date();
            const isToday = triggerDate.toDateString() === now.toDateString();
            const isTomorrow = triggerDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
            
            if (isToday) {
                timeDisplay = `今天 ${String(triggerDate.getHours()).padStart(2, '0')}:${String(triggerDate.getMinutes()).padStart(2, '0')}`;
            } else if (isTomorrow) {
                timeDisplay = `明天 ${String(triggerDate.getHours()).padStart(2, '0')}:${String(triggerDate.getMinutes()).padStart(2, '0')}`;
            } else {
                timeDisplay = triggerDate.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            }
        } else if (isTimer) {
            const remaining = item.remainingSeconds || item.totalSeconds;
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        // 建立項目 HTML
        const itemHtml = `
            <div class="timer-item ${isCompleted ? 'completed' : ''} ${isRunning ? 'running' : ''} ${isPaused ? 'paused' : ''}" data-id="${item.id}" role="listitem">
                <div class="item-header">
                    <span class="item-type ${isAlarm ? 'alarm-badge' : 'timer-badge'}">
                        ${isAlarm ? '⏰ 鬧鐘' : '⏱️ 倒數'}
                    </span>
                    <span class="item-label">${escapeHtml(item.label || '未命名')}</span>
                </div>
                <div class="item-time">
                    ${timeDisplay}
                </div>
                <div class="item-state">
                    ${isCompleted ? '<span class="state-badge completed">已' + (isAlarm ? '觸發' : '完成') + '</span>' : ''}
                    ${isRunning ? '<span class="state-badge running">運行中</span>' : ''}
                    ${isPaused ? '<span class="state-badge paused">已暫停</span>' : ''}
                </div>
                <div class="item-actions">
                    ${!isCompleted && isTimer ? `
                        <button class="btn btn-sm pause-resume-btn" data-id="${item.id}" aria-label="${isPaused ? '恢復' : '暫停'}">
                            ${isPaused ? '▶ 恢復' : '⏸ 暫停'}
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-secondary delete-btn" data-id="${item.id}" aria-label="刪除">
                        🗑️ 刪除
                    </button>
                </div>
            </div>
        `;

        return itemHtml;
    }

    /**
     * T029 [US1] 清單渲染器
     * 從儲存中獲取排序的項目，渲染整個清單
     */
    function renderList() {
        if (!DOM.timerList) return;

        // 獲取所有項目（這裡假設從全域狀態或 Alarm/Timer 模塊）
        // 臨時使用 state.items，之後改為從 TimerApp.Alarm 和 TimerApp.Timer 獲取
        const items = state.items || [];
        
        // 按 createdAt 降序排序（最新優先）
        const sortedItems = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // 清空清單
        DOM.timerList.innerHTML = '';

        if (sortedItems.length === 0) {
            DOM.timerList.innerHTML = '<div class="empty-state">尚無計時器，開始建立一個吧</div>';
            if (DOM.listInfo) DOM.listInfo.textContent = '計時器: 0 個';
            return;
        }

        // 為每個項目建立 HTML
        const itemsHtml = sortedItems.map(item => renderTimerItem(item)).join('');
        DOM.timerList.innerHTML = itemsHtml;

        // 更新計數
        if (DOM.listInfo) {
            DOM.listInfo.textContent = `計時器: ${sortedItems.length} 個`;
        }

        // 綁定刪除按鈕事件（事件委派）
        attachDeleteHandlers();

        // 綁定暫停/恢復按鈕
        attachPauseResumeHandlers();
    }

    /**
     * T030 [US1] 將清單更新連接到事件
     * 監聽 alarm/timer 事件並更新清單
     */
    function attachListenerHandlers() {
        // 監聽 alarmCreated 事件
        document.addEventListener('alarmCreated', (e) => {
            console.log('alarmCreated 事件接收:', e.detail);
            state.items = state.items || [];
            state.items.push(e.detail);
            renderList();
        });

        // 監聽 alarmTriggered 事件
        document.addEventListener('alarmTriggered', (e) => {
            console.log('alarmTriggered 事件接收:', e.detail);
            const alarm = e.detail;
            state.items = state.items || [];
            const idx = state.items.findIndex(item => item.id === alarm.id);
            if (idx >= 0) {
                state.items[idx].state = 'triggered';
            }
            renderList();
            showAlarmNotification(alarm);
        });

        // 監聽 alarmDeleted 事件
        document.addEventListener('alarmDeleted', (e) => {
            console.log('alarmDeleted 事件接收:', e.detail);
            state.items = state.items || [];
            state.items = state.items.filter(item => item.id !== e.detail.id);
            renderList();
        });

        // 監聽 timerCreated 事件
        document.addEventListener('timerCreated', (e) => {
            console.log('timerCreated 事件接收:', e.detail);
            state.items = state.items || [];
            state.items.push(e.detail);
            renderList();
        });

        // 監聽 timerCompleted 事件
        document.addEventListener('timerCompleted', (e) => {
            console.log('timerCompleted 事件接收:', e.detail);
            const timer = e.detail;
            state.items = state.items || [];
            const idx = state.items.findIndex(item => item.id === timer.id);
            if (idx >= 0) {
                state.items[idx].state = 'completed';
                state.items[idx].remainingSeconds = 0;
            }
            renderList();
            showTimerNotification(timer);
        });

        // 監聽 timerUpdated 事件
        document.addEventListener('timerUpdated', (e) => {
            console.log('timerUpdated 事件接收:', e.detail);
            state.items = state.items || [];
            const idx = state.items.findIndex(item => item.id === e.detail.id);
            if (idx >= 0) {
                Object.assign(state.items[idx], e.detail);
            }
            renderList();
        });

        // 監聽 timerDeleted 事件
        document.addEventListener('timerDeleted', (e) => {
            console.log('timerDeleted 事件接收:', e.detail);
            state.items = state.items || [];
            state.items = state.items.filter(item => item.id !== e.detail.id);
            renderList();
        });
    }

    /**
     * T031 [US1] 刪除功能
     * 處理刪除按鈕點擊（委派）
     */
    function attachDeleteHandlers() {
        DOM.timerList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (!deleteBtn) return;

            const id = deleteBtn.dataset.id;
            const item = (state.items || []).find(i => i.id === id);
            if (!item) return;

            // 顯示確認對話框
            const confirmed = confirm(`確認刪除『${item.label}』嗎?`);
            if (confirmed) {
                // 根據類型調用刪除函數
                if (item.type === 'alarm') {
                    TimerApp.Alarm && TimerApp.Alarm.delete(id);
                } else if (item.type === 'timer') {
                    TimerApp.Timer && TimerApp.Timer.delete(id);
                }
            }
        });
    }

    /**
     * 暫停/恢復按鈕處理
     */
    function attachPauseResumeHandlers() {
        DOM.timerList.addEventListener('click', (e) => {
            const btn = e.target.closest('.pause-resume-btn');
            if (!btn) return;

            const id = btn.dataset.id;
            const item = (state.items || []).find(i => i.id === id);
            if (!item || item.type !== 'timer') return;

            if (item.state === 'running') {
                TimerApp.Timer && TimerApp.Timer.pause(id);
            } else if (item.state === 'paused') {
                TimerApp.Timer && TimerApp.Timer.resume(id);
            }
        });
    }

    /**
     * T032 [US1] 鬧鐘觸發通知
     */
    function showAlarmNotification(alarm) {
        const notification = document.createElement('div');
        notification.className = 'notification alarm-notification';
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <div class="notification-content">
                <h3>🔔 鬧鐘觸發</h3>
                <p>${escapeHtml(alarm.label || '鬧鐘')}</p>
                <button class="btn btn-primary notification-close">完成</button>
            </div>
        `;

        document.body.appendChild(notification);

        // 播放聲音
        if (TimerApp.Audio && typeof TimerApp.Audio.play === 'function') {
            try {
                TimerApp.Audio.play(alarm.soundId || 'alarm1');
            } catch (e) {
                console.error('播放聲音失敗:', e);
            }
        }

        // 關閉按鈕
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // 5 秒後自動關閉
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * T042 的補充：計時器完成通知
     */
    function showTimerNotification(timer) {
        const notification = document.createElement('div');
        notification.className = 'notification timer-notification';
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <div class="notification-content">
                <h3>⏱️ 計時器完成</h3>
                <p>${escapeHtml(timer.label || '計時器')} 完成！</p>
                <button class="btn btn-primary notification-close">確認</button>
            </div>
        `;

        document.body.appendChild(notification);

        // 播放聲音
        if (TimerApp.Audio && typeof TimerApp.Audio.play === 'function') {
            try {
                TimerApp.Audio.play(timer.soundId || 'alarm1');
            } catch (e) {
                console.error('播放聲音失敗:', e);
            }
        }

        // 關閉按鈕
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // 5 秒後自動關閉
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * HTML 轉義（防止 XSS）
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * T027 [US1] 聊天輸入處理器
     * 監聽聊天按鈕並建立鬧鐘/計時器
     */
    function setupChatInputHandler() {
        if (!DOM.chatSend || !DOM.chatInput) return;

        DOM.chatSend.addEventListener('click', handleChatSubmit);
        DOM.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleChatSubmit();
            }
        });
    }

    /**
     * 處理聊天提交
     */
    function handleChatSubmit() {
        const text = DOM.chatInput.value.trim();
        if (!text) return;

        try {
            // 使用 ChatParser 解析輸入
            if (typeof ChatParser === 'undefined') {
                showError('聊天解析器未載入');
                return;
            }

            const parsed = ChatParser.parseTimeInput(text);
            if (!parsed) {
                showError('無法識別輸入格式。請嘗試：「明天 9 點」或「5 分鐘」');
                return;
            }

            clearError();

            if (parsed.type === 'alarm') {
                // 建立鬧鐘
                createAlarm(parsed.data);
            } else if (parsed.type === 'timer') {
                // 建立計時器
                createTimer(parsed.data);
            }

            // 清空輸入
            DOM.chatInput.value = '';
            DOM.chatInput.focus();
        } catch (error) {
            console.error('聊天輸入錯誤:', error);
            showError(error.message || '建立失敗，請重試');
        }
    }

    /**
     * 建立鬧鐘
     */
    function createAlarm(alarmData) {
        if (!TimerApp.Alarm) {
            showError('鬧鐘模塊未初始化');
            return;
        }

        try {
            const timestamp = ChatParser.convertAlarmToTimestamp(alarmData);
            const alarm = TimerApp.Alarm.create(
                alarmData.label || '鬧鐘',
                timestamp,
                state.settings.defaultSound || 'alarm1'
            );

            showToast(`✅ 已建立鬧鐘：${alarmData.label || '鬧鐘'}`);
            console.log('鬧鐘已建立:', alarm);
        } catch (error) {
            showError(`建立鬧鐘失敗: ${error.message}`);
        }
    }

    /**
     * 建立計時器
     */
    function createTimer(timerData) {
        if (!TimerApp.Timer) {
            showError('計時器模塊未初始化');
            return;
        }

        try {
            const timer = TimerApp.Timer.create(
                timerData.label || '計時器',
                timerData.seconds,
                state.settings.defaultSound || 'alarm1'
            );

            showToast(`✅ 已建立計時器：${timerData.label || '計時器'}`);
            console.log('計時器已建立:', timer);
        } catch (error) {
            showError(`建立計時器失敗: ${error.message}`);
        }
    }

    // ============ 第 3 階段結束 ============

    /**
     * 公開 API
     */
    return {
        init,
        getState: () => state,
        setState: (updates) => {
            state = { ...state, ...updates };
        },
        render,
        showToast,
        showError,
        clearError,
        renderList,
        attachListenerHandlers,
        // 事件分派器 (T018)
        emitEvent: (eventName, detail) => {
            try {
                const event = new CustomEvent(eventName, { detail });
                document.dispatchEvent(event);
                console.log(`事件發送: ${eventName}`, detail);
            } catch (error) {
                console.error(`事件發送失敗 (${eventName}):`, error);
            }
        }
    };
})();

// 當 DOM 準備就緒時初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    TimerApp.init();
});

// 對於已緩存的頁面，直接初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TimerApp.init();
    });
} else {
    TimerApp.init();
}

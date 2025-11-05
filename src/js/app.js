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
        if (!DOM.timerList) return;

        // 待實作：完整 UI 渲染
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
        clearError
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

/**
 * 計時器模塊 - 倒數計時管理
 * 負責計時器建立、更新、刪除、倒數邏輯、驗證
 */

const TimerApp = (typeof TimerApp !== 'undefined') ? TimerApp : {};

TimerApp.Timer = (() => {
    const timers = new Map();
    const intervals = new Map();
    let globalInterval = null;
    let isRunning = false;

    /**
     * 自訂錯誤類
     */
    class TimerError extends Error {
        constructor(message) {
            super(message);
            this.name = 'TimerError';
        }
    }

    class NotFoundError extends TimerError {
        constructor(id) {
            super(`計時器不存在: ${id}`);
            this.name = 'NotFoundError';
        }
    }

    class ValidationError extends TimerError {
        constructor(message) {
            super(message);
            this.name = 'ValidationError';
        }
    }

    /**
     * 初始化計時器模塊（從儲存載入）
     */
    function init() {
        try {
            const savedTimers = TimerApp.Storage.load('items', []);
            
            // 只載入類型為 'timer' 的項目
            savedTimers.forEach(item => {
                if (item.type === 'timer') {
                    timers.set(item.id, item);
                }
            });

            console.log(`計時器初始化完成，載入 ${timers.size} 個計時器`);
            startGlobalInterval();
        } catch (error) {
            console.error('計時器初始化失敗:', error);
        }
    }

    /**
     * 驗證計時器資料
     */
    function validateTimer(timer, isNew = false) {
        const errors = [];

        if (isNew) {
            if (typeof timer.label !== 'string' || !timer.label.trim()) {
                errors.push('標籤不能為空');
            }
            if (typeof timer.totalSeconds !== 'number' || timer.totalSeconds <= 0) {
                errors.push('總秒數必須 > 0');
            }
        }

        // 檢查狀態轉移
        if (timer.state && !['running', 'paused', 'completed'].includes(timer.state)) {
            errors.push('無效的計時器狀態');
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join('; '));
        }
    }

    /**
     * 建立新計時器
     * @param {string} label - 計時器標籤（例如 "工作"）
     * @param {number} totalSeconds - 總秒數
     * @param {string} soundId - 聲音 ID（預設 "alarm1"）
     * @returns {object} 建立的計時器物件
     */
    function create(label, totalSeconds, soundId = 'alarm1') {
        try {
            // 驗證輸入
            if (typeof label !== 'string' || !label.trim()) {
                throw new ValidationError('標籤不能為空');
            }
            if (typeof totalSeconds !== 'number' || totalSeconds <= 0) {
                throw new ValidationError('持續時間必須 > 0');
            }

            // 建立計時器物件
            const timer = {
                id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'timer',
                label: label.trim(),
                totalSeconds: Math.round(totalSeconds),
                remainingSeconds: Math.round(totalSeconds),
                state: 'running',
                createdAt: Date.now(),
                pausedAt: null,
                soundId: soundId
            };

            validateTimer(timer, true);
            timers.set(timer.id, timer);
            persist();
            emitEvent('timerCreated', { timer });
            console.log(`建立計時器: ${timer.id} (${timer.label})`);
            return timer;
        } catch (error) {
            console.error('建立計時器失敗:', error);
            throw error;
        }
    }

    /**
     * 暫停計時器
     */
    function pause(id) {
        try {
            const timer = get(id);
            if (timer.state !== 'running') {
                throw new ValidationError('只有執行中的計時器可暫停');
            }

            timer.state = 'paused';
            timer.pausedAt = Date.now();
            persist();
            emitEvent('timerPaused', { timer });
            console.log(`暫停計時器: ${id}`);
            return timer;
        } catch (error) {
            console.error('暫停計時器失敗:', error);
            throw error;
        }
    }

    /**
     * 恢復計時器
     */
    function resume(id) {
        try {
            const timer = get(id);
            if (timer.state !== 'paused') {
                throw new ValidationError('只有暫停的計時器可恢復');
            }

            // 調整剩餘時間，移除暫停期間
            const pausedDuration = Date.now() - timer.pausedAt;
            timer.pausedAt = null;
            timer.state = 'running';
            persist();
            emitEvent('timerResumed', { timer });
            console.log(`恢復計時器: ${id}`);
            return timer;
        } catch (error) {
            console.error('恢復計時器失敗:', error);
            throw error;
        }
    }

    /**
     * 更新計時器屬性（標籤、聲音等）
     */
    function update(id, updates) {
        try {
            const timer = get(id);
            
            // 允許更新的欄位
            if (updates.label !== undefined) {
                timer.label = String(updates.label).trim();
            }
            if (updates.soundId !== undefined) {
                timer.soundId = String(updates.soundId);
            }

            persist();
            emitEvent('timerUpdated', { timer });
            console.log(`更新計時器: ${id}`);
            return timer;
        } catch (error) {
            console.error('更新計時器失敗:', error);
            throw error;
        }
    }

    /**
     * 完成計時器（標記為已完成）
     */
    function complete(id) {
        try {
            const timer = get(id);
            timer.state = 'completed';
            timer.remainingSeconds = 0;
            persist();
            emitEvent('timerCompleted', { timer });
            console.log(`完成計時器: ${id}`);
            return timer;
        } catch (error) {
            console.error('完成計時器失敗:', error);
            throw error;
        }
    }

    /**
     * 刪除計時器
     */
    function remove(id) {
        try {
            const timer = get(id);
            
            // 清除任何執行中的間隔
            if (intervals.has(id)) {
                clearInterval(intervals.get(id));
                intervals.delete(id);
            }

            timers.delete(id);
            persist();
            emitEvent('timerDeleted', { timer });
            console.log(`刪除計時器: ${id}`);
            return timer;
        } catch (error) {
            console.error('刪除計時器失敗:', error);
            throw error;
        }
    }

    /**
     * 取得單一計時器
     */
    function get(id) {
        if (!timers.has(id)) {
            throw new NotFoundError(id);
        }
        return timers.get(id);
    }

    /**
     * 取得所有計時器（按 createdAt 降序）
     */
    function list() {
        return Array.from(timers.values())
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * 取得執行中的計時器
     */
    function getActive() {
        return Array.from(timers.values())
            .filter(t => t.state === 'running')
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * 開始全域倒數間隔
     */
    function startGlobalInterval() {
        if (globalInterval) return;

        globalInterval = setInterval(() => {
            const now = Date.now();
            let hasActive = false;

            for (const timer of timers.values()) {
                if (timer.state !== 'running') continue;
                
                hasActive = true;
                const elapsed = Math.floor((now - timer.createdAt) / 1000);
                const newRemaining = Math.max(0, timer.totalSeconds - elapsed);

                // 每秒觸發 timerUpdated 事件
                if (newRemaining !== timer.remainingSeconds) {
                    timer.remainingSeconds = newRemaining;
                    emitEvent('timerUpdated', { timer });
                }

                // 檢查是否完成
                if (newRemaining === 0 && timer.state === 'running') {
                    complete(timer.id);
                }

                // 每 10 秒校準
                if (elapsed % 10 === 0 && newRemaining > 0) {
                    // 檢查漂移
                    const expectedCreatedAt = now - (timer.totalSeconds - newRemaining) * 1000;
                    const drift = timer.createdAt - expectedCreatedAt;
                    if (Math.abs(drift) > 500) {
                        console.warn(`計時器 ${timer.id} 漂移調整: ${drift}ms`);
                        timer.createdAt = expectedCreatedAt;
                    }
                }
            }

            // 如果沒有活躍計時器，可停止間隔（可選最佳化）
            // 目前保持執行以簡化邏輯
        }, 1000);

        isRunning = true;
        console.log('全域計時器間隔已啟動');
    }

    /**
     * 停止全域倒數間隔
     */
    function stopGlobalInterval() {
        if (globalInterval) {
            clearInterval(globalInterval);
            globalInterval = null;
            isRunning = false;
            console.log('全域計時器間隔已停止');
        }
    }

    /**
     * 持久化到儲存
     */
    function persist() {
        try {
            const items = TimerApp.Storage.load('items', []);
            
            // 移除所有現有計時器項目
            const nonTimerItems = items.filter(item => item.type !== 'timer');
            
            // 新增目前計時器
            const allTimers = Array.from(timers.values());
            const updated = [...nonTimerItems, ...allTimers];
            
            TimerApp.Storage.save('items', updated);
        } catch (error) {
            console.error('計時器持久化失敗:', error);
        }
    }

    /**
     * 觸發自訂事件
     */
    function emitEvent(eventName, detail) {
        if (window.TimerApp && window.TimerApp.emitEvent) {
            TimerApp.emitEvent(eventName, detail);
        }
    }

    // 公開 API
    return {
        init,
        create,
        pause,
        resume,
        update,
        complete,
        remove,
        get,
        list,
        getActive,
        startGlobalInterval,
        stopGlobalInterval,
        // 錯誤類
        TimerError,
        NotFoundError,
        ValidationError
    };
})();

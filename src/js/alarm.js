/**
 * 鬧鐘模塊 - 鬧鐘管理
 * 負責鬧鐘建立、更新、刪除、觸發偵測、驗證
 */

const TimerApp = (typeof TimerApp !== 'undefined') ? TimerApp : {};

TimerApp.Alarm = (() => {
    const alarms = new Map();
    let globalCheckInterval = null;
    let isRunning = false;

    /**
     * 自訂錯誤類
     */
    class AlarmError extends Error {
        constructor(message) {
            super(message);
            this.name = 'AlarmError';
        }
    }

    class NotFoundError extends AlarmError {
        constructor(id) {
            super(`鬧鐘不存在: ${id}`);
            this.name = 'NotFoundError';
        }
    }

    class ValidationError extends AlarmError {
        constructor(message) {
            super(message);
            this.name = 'ValidationError';
        }
    }

    /**
     * 初始化鬧鐘模塊（從儲存載入）
     */
    function init() {
        try {
            const savedItems = TimerApp.Storage.load('items', []);
            
            // 只載入類型為 'alarm' 的項目
            savedItems.forEach(item => {
                if (item.type === 'alarm') {
                    alarms.set(item.id, item);
                }
            });

            console.log(`鬧鐘初始化完成，載入 ${alarms.size} 個鬧鐘`);
            startGlobalCheckInterval();
        } catch (error) {
            console.error('鬧鐘初始化失敗:', error);
        }
    }

    /**
     * 驗證鬧鐘資料
     */
    function validateAlarm(alarm, isNew = false) {
        const errors = [];

        if (isNew) {
            if (typeof alarm.label !== 'string' || !alarm.label.trim()) {
                errors.push('標籤不能為空');
            }
            if (typeof alarm.triggerTime !== 'number' || alarm.triggerTime <= 0) {
                errors.push('觸發時間必須為有效的時間戳');
            }
            if (alarm.triggerTime <= Date.now()) {
                errors.push('觸發時間必須在未來');
            }
        }

        // 檢查狀態
        if (alarm.state && !['pending', 'triggered', 'cancelled'].includes(alarm.state)) {
            errors.push('無效的鬧鐘狀態');
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join('; '));
        }
    }

    /**
     * 建立新鬧鐘
     * @param {string} label - 鬧鐘標籤（例如 "起床"）
     * @param {number} triggerTime - 觸發時間（unix 時間戳，毫秒）
     * @param {string} soundId - 聲音 ID（預設 "alarm1"）
     * @returns {object} 建立的鬧鐘物件
     */
    function create(label, triggerTime, soundId = 'alarm1') {
        try {
            // 驗證輸入
            if (typeof label !== 'string' || !label.trim()) {
                throw new ValidationError('標籤不能為空');
            }
            if (typeof triggerTime !== 'number') {
                throw new ValidationError('觸發時間必須為數字');
            }
            if (triggerTime <= Date.now()) {
                throw new ValidationError('觸發時間必須在未來');
            }

            // 建立鬧鐘物件
            const alarm = {
                id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'alarm',
                label: label.trim(),
                triggerTime: Math.round(triggerTime),
                state: 'pending',
                createdAt: Date.now(),
                soundId: soundId,
                isRecurring: false
            };

            validateAlarm(alarm, true);
            alarms.set(alarm.id, alarm);
            persist();
            emitEvent('alarmCreated', { alarm });
            console.log(`建立鬧鐘: ${alarm.id} (${alarm.label})`);
            return alarm;
        } catch (error) {
            console.error('建立鬧鐘失敗:', error);
            throw error;
        }
    }

    /**
     * 更新鬧鐘屬性（標籤、聲音等）
     * 已觸發的鬧鐘只允許更新某些欄位
     */
    function update(id, updates) {
        try {
            const alarm = get(id);
            
            // 已觸發的鬧鐘限制更新
            if (alarm.state === 'triggered') {
                if (updates.label !== undefined || updates.triggerTime !== undefined) {
                    throw new ValidationError('已觸發的鬧鐘不可更新時間或標籤');
                }
            }

            // 允許更新的欄位
            if (updates.label !== undefined) {
                alarm.label = String(updates.label).trim();
            }
            if (updates.soundId !== undefined) {
                alarm.soundId = String(updates.soundId);
            }
            if (updates.triggerTime !== undefined && alarm.state !== 'triggered') {
                const newTriggerTime = Math.round(updates.triggerTime);
                if (newTriggerTime <= Date.now()) {
                    throw new ValidationError('觸發時間必須在未來');
                }
                alarm.triggerTime = newTriggerTime;
            }

            persist();
            emitEvent('alarmUpdated', { alarm });
            console.log(`更新鬧鐘: ${id}`);
            return alarm;
        } catch (error) {
            console.error('更新鬧鐘失敗:', error);
            throw error;
        }
    }

    /**
     * 取消鬧鐘
     */
    function cancel(id) {
        try {
            const alarm = get(id);
            if (alarm.state === 'cancelled') {
                throw new ValidationError('鬧鐘已取消');
            }

            alarm.state = 'cancelled';
            persist();
            emitEvent('alarmCancelled', { alarm });
            console.log(`取消鬧鐘: ${id}`);
            return alarm;
        } catch (error) {
            console.error('取消鬧鐘失敗:', error);
            throw error;
        }
    }

    /**
     * 刪除鬧鐘
     */
    function remove(id) {
        try {
            const alarm = get(id);
            alarms.delete(id);
            persist();
            emitEvent('alarmDeleted', { alarm });
            console.log(`刪除鬧鐘: ${id}`);
            return alarm;
        } catch (error) {
            console.error('刪除鬧鐘失敗:', error);
            throw error;
        }
    }

    /**
     * 取得單一鬧鐘
     */
    function get(id) {
        if (!alarms.has(id)) {
            throw new NotFoundError(id);
        }
        return alarms.get(id);
    }

    /**
     * 取得所有鬧鐘（按 createdAt 降序）
     */
    function list() {
        return Array.from(alarms.values())
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * 取得待觸發的鬧鐘
     */
    function getPending() {
        return Array.from(alarms.values())
            .filter(a => a.state === 'pending' && a.triggerTime > Date.now())
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * 標記鬧鐘為已觸發
     */
    function markTriggered(id) {
        try {
            const alarm = get(id);
            if (alarm.state === 'pending') {
                alarm.state = 'triggered';
                persist();
                emitEvent('alarmTriggered', { alarm });
                console.log(`鬧鐘觸發: ${id} (${alarm.label})`);
            }
            return alarm;
        } catch (error) {
            console.error('標記鬧鐘失敗:', error);
            throw error;
        }
    }

    /**
     * 開始全域觸發檢查間隔
     */
    function startGlobalCheckInterval() {
        if (globalCheckInterval) return;

        globalCheckInterval = setInterval(() => {
            const now = Date.now();

            for (const alarm of alarms.values()) {
                if (alarm.state === 'pending' && alarm.triggerTime <= now) {
                    markTriggered(alarm.id);
                }
            }
        }, 1000); // 每秒檢查一次

        isRunning = true;
        console.log('全域鬧鐘檢查間隔已啟動');
    }

    /**
     * 停止全域觸發檢查間隔
     */
    function stopGlobalCheckInterval() {
        if (globalCheckInterval) {
            clearInterval(globalCheckInterval);
            globalCheckInterval = null;
            isRunning = false;
            console.log('全域鬧鐘檢查間隔已停止');
        }
    }

    /**
     * 持久化到儲存
     */
    function persist() {
        try {
            const items = TimerApp.Storage.load('items', []);
            
            // 移除所有現有鬧鐘項目
            const nonAlarmItems = items.filter(item => item.type !== 'alarm');
            
            // 新增目前鬧鐘
            const allAlarms = Array.from(alarms.values());
            const updated = [...nonAlarmItems, ...allAlarms];
            
            TimerApp.Storage.save('items', updated);
        } catch (error) {
            console.error('鬧鐘持久化失敗:', error);
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
        update,
        cancel,
        remove,
        get,
        list,
        getPending,
        markTriggered,
        startGlobalCheckInterval,
        stopGlobalCheckInterval,
        // 錯誤類
        AlarmError,
        NotFoundError,
        ValidationError
    };
})();

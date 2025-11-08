/**
 * 儲存模塊 - LocalStorage 抽象層
 * 負責資料持久化、序列化、版本管理
 */

const TimerApp = (typeof TimerApp !== 'undefined') ? TimerApp : {};

TimerApp.Storage = (() => {
    const VERSION = '1.0';
    const STORAGE_KEY_PREFIX = 'timerapp_';
    const VERSION_KEY = STORAGE_KEY_PREFIX + 'version';
    const ITEMS_KEY = STORAGE_KEY_PREFIX + 'items';
    const SETTINGS_KEY = STORAGE_KEY_PREFIX + 'settings';

    /**
     * 自訂 Storage 錯誤
     */
    class StorageError extends Error {
        constructor(message) {
            super(message);
            this.name = 'StorageError';
        }
    }

    /**
     * 初始化儲存，檢查版本相容性
     */
    function init() {
        try {
            // 檢查 localStorage 可用性
            if (!isLocalStorageAvailable()) {
                throw new StorageError('LocalStorage 不可用。您的瀏覽器可能已停用或在隱私模式');
            }

            const storedVersion = localStorage.getItem(VERSION_KEY);
            
            if (storedVersion && storedVersion !== VERSION) {
                // 版本不匹配，可執行遷移邏輯（目前未實作）
                console.warn(`Storage 版本不匹配: ${storedVersion} → ${VERSION}. 保留現有資料`);
            }

            if (!storedVersion) {
                // 首次初始化
                localStorage.setItem(VERSION_KEY, VERSION);
            }

            return true;
        } catch (error) {
            console.error('Storage 初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 檢查 localStorage 是否可用
     */
    function isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 儲存鍵值對
     * @param {string} key - 儲存鍵（自動加入前綴）
     * @param {any} value - 要儲存的值（自動 JSON 序列化）
     */
    function save(key, value) {
        try {
            const fullKey = STORAGE_KEY_PREFIX + key;
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                throw new StorageError('儲存空間已滿。請刪除一些資料');
            }
            throw new StorageError(`儲存失敗 (${key}): ${error.message}`);
        }
    }

    /**
     * 從 LocalStorage 檢索值
     * @param {string} key - 儲存鍵
     * @param {any} defaultValue - 鍵不存在時的預設值
     * @returns {any} 儲存的值或預設值
     */
    function load(key, defaultValue = null) {
        try {
            const fullKey = STORAGE_KEY_PREFIX + key;
            const value = localStorage.getItem(fullKey);
            
            if (value === null) {
                return defaultValue;
            }

            return JSON.parse(value);
        } catch (error) {
            console.error(`載入失敗 (${key}):`, error);
            throw new StorageError(`載入失敗 (${key}): ${error.message}`);
        }
    }

    /**
     * 清除單一鍵
     * @param {string} key - 要清除的鍵
     */
    function remove(key) {
        try {
            const fullKey = STORAGE_KEY_PREFIX + key;
            localStorage.removeItem(fullKey);
        } catch (error) {
            throw new StorageError(`移除失敗 (${key}): ${error.message}`);
        }
    }

    /**
     * 清除所有應用程式資料（保留設定或完全清除）
     * @param {boolean} includeSettings - 是否也清除設定
     */
    function clear(includeSettings = false) {
        try {
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
                    if (includeSettings || key !== STORAGE_KEY_PREFIX + 'settings') {
                        keysToRemove.push(key);
                    }
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            throw new StorageError(`清除失敗: ${error.message}`);
        }
    }

    /**
     * 清除 items 清單（用於重設所有計時器/鬧鐘）
     */
    function clearItems() {
        remove('items');
    }

    /**
     * 匯出所有資料為 JSON 物件（備份用途）
     */
    function exportData() {
        try {
            const data = {
                version: VERSION,
                exportedAt: new Date().toISOString(),
                items: load('items', []),
                settings: load('settings', {})
            };
            return data;
        } catch (error) {
            throw new StorageError(`匯出失敗: ${error.message}`);
        }
    }

    /**
     * 從 JSON 物件匯入資料（還原備份）
     * @param {object} data - 匯出的資料物件
     */
    function importData(data) {
        try {
            if (!data || typeof data !== 'object') {
                throw new StorageError('無效的備份格式');
            }

            if (data.version !== VERSION) {
                console.warn(`備份版本 (${data.version}) 與目前版本 (${VERSION}) 不匹配`);
            }

            // 匯入資料
            if (data.items) {
                save('items', data.items);
            }
            if (data.settings) {
                save('settings', data.settings);
            }

            return true;
        } catch (error) {
            throw new StorageError(`匯入失敗: ${error.message}`);
        }
    }

    /**
     * 取得儲存使用統計
     */
    function getStats() {
        try {
            let totalSize = 0;
            const keyStats = {};

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
                    const value = localStorage.getItem(key);
                    const size = value ? value.length : 0;
                    totalSize += size;
                    keyStats[key] = {
                        size: size,
                        sizeKB: (size / 1024).toFixed(2)
                    };
                }
            }

            return {
                totalBytes: totalSize,
                totalKB: (totalSize / 1024).toFixed(2),
                itemCount: Object.keys(keyStats).length,
                details: keyStats
            };
        } catch (error) {
            console.error('統計失敗:', error);
            return null;
        }
    }

    // 公開 API
    return {
        init,
        save,
        load,
        remove,
        clear,
        clearItems,
        exportData,
        importData,
        getStats,
        StorageError,
        // 常數
        VERSION,
        STORAGE_KEY_PREFIX
    };
})();

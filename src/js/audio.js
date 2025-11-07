/**
 * 音頻模塊 - 聲音播放與管理
 * 負責鬧鐘提示音播放、聲音選擇、錯誤處理
 */

const TimerApp = (typeof TimerApp !== 'undefined') ? TimerApp : {};

TimerApp.Audio = (() => {
    // 聲音註冊表
    const soundRegistry = {
        'alarm1': '/assets/sounds/alarm1.wav',
        'alarm2': '/assets/sounds/alarm2.wav'
    };

    let currentAudio = null;
    let defaultSoundId = 'alarm1';
    let audioContext = null;
    let isAudioSupported = true;

    /**
     * 初始化音頻模塊
     */
    function init() {
        try {
            // 檢查音頻支援
            const testAudio = new Audio();
            isAudioSupported = !!testAudio.play;

            // 嘗試初始化 Web Audio API（後備）
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioContext = new AudioContext();
            }

            // 載入預設聲音偏好
            const settings = TimerApp.Storage.load('settings', {});
            if (settings.defaultSound && soundRegistry[settings.defaultSound]) {
                defaultSoundId = settings.defaultSound;
            }

            console.log(`音頻模塊初始化完成，預設聲音: ${defaultSoundId}`);
            return true;
        } catch (error) {
            console.warn('音頻初始化警告:', error);
            isAudioSupported = false;
            return false;
        }
    }

    /**
     * 播放聲音
     * @param {string} soundId - 聲音 ID（預設使用預設聲音）
     */
    function play(soundId = null) {
        try {
            if (!isAudioSupported) {
                console.warn('此瀏覽器不支援音頻播放');
                return false;
            }

            const effectiveSoundId = soundId || defaultSoundId;
            const soundPath = soundRegistry[effectiveSoundId];

            if (!soundPath) {
                console.warn(`聲音不存在: ${effectiveSoundId}`);
                return false;
            }

            // 停止任何現有播放
            stop();

            // 建立新音頻元素
            currentAudio = new Audio(soundPath);
            currentAudio.volume = 0.8;
            currentAudio.play().catch(error => {
                console.warn(`音頻播放失敗: ${error.message}`);
                // 嘗試使用 Web Audio API 後備（簡化版，生成音調）
                playFallbackTone();
            });

            console.log(`播放聲音: ${effectiveSoundId}`);
            return true;
        } catch (error) {
            console.error('播放聲音異常:', error);
            return false;
        }
    }

    /**
     * 停止播放
     */
    function stop() {
        try {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }
        } catch (error) {
            console.error('停止播放異常:', error);
        }
    }

    /**
     * 設定預設聲音
     * @param {string} soundId - 聲音 ID
     */
    function setSoundId(soundId) {
        try {
            if (!soundRegistry[soundId]) {
                throw new Error(`聲音不存在: ${soundId}`);
            }

            defaultSoundId = soundId;
            
            // 儲存到設定
            const settings = TimerApp.Storage.load('settings', {});
            settings.defaultSound = soundId;
            TimerApp.Storage.save('settings', settings);

            console.log(`預設聲音已設定為: ${soundId}`);
            return true;
        } catch (error) {
            console.error('設定聲音失敗:', error);
            return false;
        }
    }

    /**
     * 取得預設聲音
     */
    function getSoundId() {
        return defaultSoundId;
    }

    /**
     * 註冊自訂聲音
     * @param {string} soundId - 聲音 ID
     * @param {string} path - 聲音檔案路徑
     */
    function registerSound(soundId, path) {
        try {
            if (!soundId || !path) {
                throw new Error('soundId 和 path 為必填');
            }

            soundRegistry[soundId] = path;
            console.log(`已註冊聲音: ${soundId} → ${path}`);
            return true;
        } catch (error) {
            console.error('註冊聲音失敗:', error);
            return false;
        }
    }

    /**
     * 取得所有可用聲音
     */
    function getAvailableSounds() {
        return Object.keys(soundRegistry);
    }

    /**
     * 播放降級版本 - 使用 Web Audio API 生成簡單音調
     */
    function playFallbackTone() {
        try {
            if (!audioContext) {
                console.warn('Web Audio API 不可用');
                return false;
            }

            // 恢復 audioContext 如果處於 suspended 狀態（某些瀏覽器的自動播放限制）
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    playSimpleTone();
                });
            } else {
                playSimpleTone();
            }

            return true;
        } catch (error) {
            console.warn('Web Audio API 失敗:', error);
            return false;
        }

        function playSimpleTone() {
            const now = audioContext.currentTime;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // 設定音調參數
            oscillator.frequency.value = 800; // 800 Hz 音調
            oscillator.type = 'sine';

            // 設定音量漸變（避免突兀）
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1); // 1 秒內衰減

            oscillator.start(now);
            oscillator.stop(now + 1);
        }
    }

    /**
     * 測試聲音播放
     */
    function test(soundId = null) {
        console.log('播放測試音：');
        return play(soundId);
    }

    /**
     * 取得音頻支援狀態
     */
    function isSupported() {
        return isAudioSupported;
    }

    // 公開 API
    return {
        init,
        play,
        stop,
        setSoundId,
        getSoundId,
        registerSound,
        getAvailableSounds,
        test,
        isSupported
    };
})();

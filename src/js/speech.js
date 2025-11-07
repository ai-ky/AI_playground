/**
 * Speech Recognition Module
 * Provides Web Speech API integration for voice input
 */

const SpeechRecognition = (() => {
  // Browser compatibility check
  const recognition = (() => {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition || 
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;
    
    if (!SpeechRecognitionAPI) return null;
    return new SpeechRecognitionAPI();
  })();

  let isListening = false;
  let currentCallback = null;
  let currentErrorCallback = null;

  /**
   * T045: Initialize and start voice input
   * @param {Function} onResult - Callback when speech is recognized
   * @param {Function} onError - Callback on error
   */
  function startVoiceInput(onResult, onError) {
    if (!recognition) {
      const error = {
        name: 'NotSupportedError',
        message: '您的瀏覽器不支援語音輸入'
      };
      if (onError) onError(error);
      return false;
    }

    if (isListening) {
      return false;
    }

    isListening = true;
    currentCallback = onResult;
    currentErrorCallback = onError;

    try {
      // Configure speech recognition
      recognition.lang = 'zh-TW';
      recognition.continuous = false;  // Stop after one phrase
      recognition.interimResults = true;  // Show interim results
      recognition.maxAlternatives = 1;

      // Handle results
      recognition.onresult = (event) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const isInterim = !event.results[i].isFinal;
          transcript += event.results[i][0].transcript;
          isFinal = event.results[i].isFinal;
        }

        if (isFinal && transcript && onResult) {
          onResult(transcript.trim());
        }
      };

      // Handle errors
      recognition.onerror = (event) => {
        const errorMap = {
          'no-speech': '沒有聽到語音，請重試',
          'audio-capture': '無法存取麥克風，請檢查權限',
          'network': '網路連線錯誤',
          'permission-denied': '語音輸入權限被拒'
        };

        const errorMessage = errorMap[event.error] || `語音識別錯誤: ${event.error}`;
        console.error('語音識別錯誤:', event.error);
        
        if (onError) {
          onError({
            name: event.error,
            message: errorMessage
          });
        }
      };

      // Handle end
      recognition.onend = () => {
        isListening = false;
      };

      // Start recognition
      recognition.start();
      return true;

    } catch (error) {
      console.error('啟動語音識別失敗:', error);
      isListening = false;
      if (onError) onError(error);
      return false;
    }
  }

  /**
   * Stop voice input
   */
  function stopVoiceInput() {
    if (!recognition || !isListening) return false;
    
    try {
      recognition.stop();
      isListening = false;
      currentCallback = null;
      currentErrorCallback = null;
      return true;
    } catch (error) {
      console.error('停止語音識別失敗:', error);
      return false;
    }
  }

  /**
   * Check if voice input is supported
   */
  function isSupported() {
    return recognition !== null;
  }

  /**
   * Check if currently listening
   */
  function isActive() {
    return isListening;
  }

  /**
   * T047: Show browser support notification
   */
  function showUnsupportedMessage() {
    if (typeof TimerApp !== 'undefined' && TimerApp.showToast) {
      TimerApp.showToast('您的瀏覽器不支援語音輸入，請使用文字輸入', 'warning');
    }
  }

  // Public API
  return {
    startVoiceInput,
    stopVoiceInput,
    isSupported,
    isActive,
    showUnsupportedMessage
  };
})();

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpeechRecognition;
}

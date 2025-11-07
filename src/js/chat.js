/**
 * Chat Input Parser Module
 * Parses user input to identify alarm and timer patterns
 */

const ChatParser = (() => {
  // Regular expressions for parsing Chinese time expressions
  const patterns = {
    // Alarm patterns: "明天 9 點", "下午 3 點半", "23:45", "明日 8:30"
    alarm: {
      relative: /^(明天|後天|明日|今天|晚上|下午|早上|早晨)?\s*(\d{1,2})\s*點\s*(?:(\d{1,2})\s*分)?\s*(.+)?$/,
      time24: /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(.+)?$/,
      chinese_relative: /^(明天|後天|明日|今晚|今天晚上|明天下午|明天早上|明天晚上|今天|今早|今晚)\s+(\d{1,2})(?:[:：](\d{1,2}))?\s*(.+)?$/
    },
    // Timer patterns: "5 分鐘", "30 秒", "2 小時", "1.5 小時"
    timer: {
      basic: /^(\d+(?:\.\d+)?)\s*(分鐘|秒|小時|分|秒鐘|小時)?(?:\s+(.+))?$/,
      english: /^(\d+(?:\.\d+)?)\s*(minutes?|hours?|seconds?|mins?|secs?|hrs?)?(?:\s+(.+))?$/,
      combined: /^(\d+)\s*小時\s*(\d+)\s*分鐘(?:\s+(.+))?$/
    }
  };

  /**
   * Parse time input to identify type (alarm/timer) and extract parameters
   * @param {string} text - User input text
   * @returns {object|null} - {type: 'alarm'|'timer', data: {...}, raw: text}
   */
  function parseTimeInput(text) {
    if (!text || typeof text !== 'string') return null;

    text = text.trim();
    if (text.length === 0) return null;

    // Try alarm patterns first
    const alarmMatch = parseAlarmPattern(text);
    if (alarmMatch) {
      return {
        type: 'alarm',
        data: alarmMatch,
        raw: text
      };
    }

    // Try timer patterns
    const timerMatch = parseTimerPattern(text);
    if (timerMatch) {
      return {
        type: 'timer',
        data: timerMatch,
        raw: text
      };
    }

    return null;
  }

  /**
   * Parse alarm patterns
   * @param {string} text
   * @returns {object|null}
   */
  function parseAlarmPattern(text) {
    // Try 24-hour format first: "23:45"
    const time24Match = text.match(patterns.alarm.time24);
    if (time24Match) {
      const hour = parseInt(time24Match[1]);
      const minute = parseInt(time24Match[2]);
      const label = (time24Match[4] || '').trim();
      
      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        return {
          hour,
          minute,
          day: 'today',
          label: label || `${hour}:${String(minute).padStart(2, '0')}`
        };
      }
    }

    // Try Chinese relative time: "明天 9 點", "下午 3 點半"
    const relativeMatch = text.match(patterns.alarm.relative);
    if (relativeMatch) {
      const relativeDay = relativeMatch[1] || '';
      const hour = parseInt(relativeMatch[2]);
      const minute = parseInt(relativeMatch[3] || '0');
      const label = (relativeMatch[4] || '').trim();

      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        const dayMap = {
          '明天': 'tomorrow',
          '明日': 'tomorrow',
          '後天': 'day-after-tomorrow',
          '今天': 'today',
          '今晚': 'today-evening',
          '晚上': 'evening',
          '下午': 'afternoon',
          '早上': 'morning',
          '早晨': 'morning'
        };

        let finalHour = hour;
        // Handle period shifts (早上/下午/晚上)
        if (relativeDay === '下午' || relativeDay === '晚上') {
          if (hour < 12) finalHour += 12;
        } else if (relativeDay === '早上' || relativeDay === '早晨') {
          if (hour >= 12) finalHour -= 12;
        }

        return {
          hour: finalHour,
          minute,
          day: dayMap[relativeDay] || 'today',
          label: label || `${relativeDay}${hour}:${String(minute).padStart(2, '0')}`
        };
      }
    }

    // Try combined Chinese relative: "明天下午 3 點半"
    const chineseMatch = text.match(patterns.alarm.chinese_relative);
    if (chineseMatch) {
      const relativeDay = chineseMatch[1];
      let hour = parseInt(chineseMatch[2]);
      const minute = parseInt(chineseMatch[3] || '0');
      const label = (chineseMatch[4] || '').trim();

      const dayMap = {
        '明天': 'tomorrow',
        '明日': 'tomorrow',
        '後天': 'day-after-tomorrow',
        '今天': 'today',
        '今晚': 'today-evening',
        '明天下午': 'tomorrow-afternoon',
        '明天早上': 'tomorrow-morning',
        '明天晚上': 'tomorrow-evening',
        '今天晚上': 'today-evening',
        '今早': 'morning',
        '今晚': 'today-evening'
      };

      // PM time adjustment
      if (relativeDay.includes('下午') && hour < 12) {
        hour += 12;
      }

      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        return {
          hour,
          minute,
          day: dayMap[relativeDay] || 'today',
          label: label || relativeDay
        };
      }
    }

    return null;
  }

  /**
   * Parse timer patterns
   * @param {string} text
   * @returns {object|null}
   */
  function parseTimerPattern(text) {
    // Try combined hours + minutes: "1 小時 30 分鐘"
    const combinedMatch = text.match(patterns.timer.combined);
    if (combinedMatch) {
      const hours = parseInt(combinedMatch[1]);
      const minutes = parseInt(combinedMatch[2]);
      const label = (combinedMatch[3] || '').trim();
      const seconds = hours * 3600 + minutes * 60;

      if (seconds > 0) {
        return {
          seconds,
          label: label || `${hours}小時${minutes}分鐘`,
          isTimer: true
        };
      }
    }

    // Try basic format: "5 分鐘", "30 秒", "2 小時"
    const basicMatch = text.match(patterns.timer.basic);
    if (basicMatch) {
      const value = parseFloat(basicMatch[1]);
      const unit = basicMatch[2] || '分鐘';
      const label = (basicMatch[3] || '').trim();

      let seconds = 0;
      switch (unit) {
        case '秒':
        case '秒鐘':
          seconds = value;
          break;
        case '分':
        case '分鐘':
          seconds = value * 60;
          break;
        case '小時':
        case '小時':
          seconds = value * 3600;
          break;
        default:
          seconds = value * 60; // default to minutes
      }

      if (seconds > 0 && seconds < 86400) { // max 24 hours
        return {
          seconds: Math.floor(seconds),
          label: label || `${value}${unit}`,
          isTimer: true
        };
      }
    }

    // Try English format: "5 minutes", "30 seconds", "2 hours"
    const englishMatch = text.match(patterns.timer.english);
    if (englishMatch) {
      const value = parseFloat(englishMatch[1]);
      const unit = (englishMatch[2] || 'minutes').toLowerCase();
      const label = (englishMatch[3] || '').trim();

      let seconds = 0;
      if (unit.startsWith('sec')) {
        seconds = value;
      } else if (unit.startsWith('min')) {
        seconds = value * 60;
      } else if (unit.startsWith('hr')) {
        seconds = value * 3600;
      }

      if (seconds > 0 && seconds < 86400) {
        return {
          seconds: Math.floor(seconds),
          label: label || `${value} ${unit}`,
          isTimer: true
        };
      }
    }

    return null;
  }

  /**
   * Convert parsed alarm data to Unix timestamp
   * @param {object} alarmData - Result from parseAlarmPattern
   * @returns {number} - Unix timestamp (milliseconds)
   */
  function convertAlarmToTimestamp(alarmData) {
    if (!alarmData) throw new Error('Invalid alarm data');

    const now = new Date();
    let targetDate = new Date(now);
    targetDate.setHours(alarmData.hour, alarmData.minute, 0, 0);

    // Handle relative days
    switch (alarmData.day) {
      case 'tomorrow':
      case 'tomorrow-morning':
      case 'tomorrow-afternoon':
      case 'tomorrow-evening':
        targetDate.setDate(targetDate.getDate() + 1);
        break;
      case 'day-after-tomorrow':
        targetDate.setDate(targetDate.getDate() + 2);
        break;
      case 'today':
      default:
        // If time has passed today, move to tomorrow
        if (targetDate <= now) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        break;
    }

    return targetDate.getTime();
  }

  return {
    parseTimeInput,
    parseAlarmPattern,
    parseTimerPattern,
    convertAlarmToTimestamp
  };
})();

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatParser;
}

import { BREAK_LIMITS } from '../constants/autoCoachingConfig';

/**
 * Start a break for a user
 */
export const startBreakService = async (db, type, currentUser, addToFeed) => {
  try {
    const now = new Date();
    const breakData = await db.get('breaks') || {};
    const today = now.toDateString();

    if (!breakData[today]) breakData[today] = {};
    if (!breakData[today][currentUser.employeeId]) {
      breakData[today][currentUser.employeeId] = [];
    }

    const newBreak = {
      type,
      start: now.toISOString(),
      end: null,
      approved: false,
      username: currentUser.username,
      name: currentUser.name
    };

    breakData[today][currentUser.employeeId].push(newBreak);
    await db.set('breaks', breakData);

    const emoji = type === 'lunch' ? '🍕' : type === 'rr' ? '🚽' : '☕';
    await addToFeed(`${currentUser.name} is on ${type}! ${emoji}`, 'break', currentUser);

    return {
      success: true,
      breaks: breakData,
      breakInfo: {
        index: breakData[today][currentUser.employeeId].length - 1,
        start: now,
        type,
        date: today
      }
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to start break: ' + err.message
    };
  }
};

/**
 * End a break for a user
 */
export const endBreakService = async (db, activeBreak, currentUser, addToFeed) => {
  try {
    if (!activeBreak) {
      return { success: false, error: 'No active break found' };
    }

    const now = new Date();
    const breakData = await db.get('breaks') || {};
    const today = activeBreak.date || now.toDateString();

    if (!breakData[today] || !breakData[today][currentUser.employeeId]) {
      return { success: false, error: 'Break data not found!' };
    }

    const userBreaks = breakData[today][currentUser.employeeId];

    if (!userBreaks[activeBreak.index]) {
      return { success: false, error: 'Break record not found!' };
    }

    userBreaks[activeBreak.index].end = now.toISOString();

    const duration = (now - new Date(activeBreak.start)) / 60000;
    const limit = BREAK_LIMITS[activeBreak.type];

    if (limit && duration > limit) {
      await addToFeed(
        `⚠️ ${currentUser.name} exceeded ${activeBreak.type} by ${Math.round(duration - limit)} mins!`, 
        'alert', 
        currentUser
      );
    }

    await db.set('breaks', breakData);
    await addToFeed(`${currentUser.name} is back from ${activeBreak.type}! 🔙`, 'break', currentUser);

    return {
      success: true,
      breaks: breakData
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to end break: ' + err.message
    };
  }
};

/**
 * Approve a break
 */
export const approveBreakService = async (db, date, employeeId, breakIndex) => {
  try {
    const breakData = await db.get('breaks') || {};
    
    if (breakData[date] && breakData[date][employeeId] && breakData[date][employeeId][breakIndex]) {
      breakData[date][employeeId][breakIndex].approved = true;
      await db.set('breaks', breakData);
      
      return {
        success: true,
        breaks: breakData
      };
    }
    
    return {
      success: false,
      error: 'Break not found'
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to approve break: ' + err.message
    };
  }
};

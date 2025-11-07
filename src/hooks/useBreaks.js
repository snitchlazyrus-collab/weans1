import { useState } from 'react';

const useBreaks = (db, currentUser, addToFeed) => {
  const [breaks, setBreaks] = useState({});
  const [activeBreak, setActiveBreak] = useState(null);

  const startBreak = async (type) => {
    const now = new Date();
    const breakData = await db.get('breaks') || {};
    const today = now.toDateString();

    if (!breakData[today]) breakData[today] = {};
    if (!breakData[today][currentUser.employeeId]) breakData[today][currentUser.employeeId] = [];

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
    setBreaks(breakData);
    setActiveBreak({ type, start: now, index: breakData[today][currentUser.employeeId].length - 1 });

    const emoji = type === 'lunch' ? '🍕' : type === 'rr' ? '🚽' : '☕';
    addToFeed(`${currentUser.name} is on ${type}! ${emoji}`, 'break');
  };

  const endBreak = async () => {
    if (!activeBreak) return;

    const now = new Date();
    const breakData = await db.get('breaks') || {};
    const today = now.toDateString();

    const userBreaks = breakData[today][currentUser.employeeId];
    userBreaks[activeBreak.index].end = now.toISOString();

    const duration = (now - new Date(activeBreak.start)) / 60000;
    const limits = { 'break1': 15, 'break2': 15, 'lunch': 60 };

    if (limits[activeBreak.type] && duration > limits[activeBreak.type]) {
      addToFeed(`⚠️ ${currentUser.name} exceeded ${activeBreak.type} by ${Math.round(duration - limits[activeBreak.type])} mins!`, 'alert');
    }

    await db.set('breaks', breakData);
    setBreaks(breakData);
    setActiveBreak(null);
    addToFeed(`${currentUser.name} is back from ${activeBreak.type}! 🔙`, 'break');
  };

  const approveBreak = async (date, employeeId, breakIndex) => {
    const breakData = await db.get('breaks') || {};
    if (breakData[date] && breakData[date][employeeId] && breakData[date][employeeId][breakIndex]) {
      breakData[date][employeeId][breakIndex].approved = true;
      await db.set('breaks', breakData);
      setBreaks(breakData);
      return { success: 'Break approved! ✅' };
    }
    return { error: 'Break record not found!' };
  };

  const loadBreaks = async () => {
    const data = await db.get('breaks') || {};
    setBreaks(data);
  };

  return {
    breaks,
    activeBreak,
    startBreak,
    endBreak,
    approveBreak,
    loadBreaks,
    setBreaks,
  };
};

export default useBreaks;

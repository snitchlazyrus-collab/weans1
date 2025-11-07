import { useState } from 'react';

const useCoaching = (db, addToFeed) => {
  const [coachingLogs, setCoachingLogs] = useState([]);

  const postCoachingLog = async (employeeId, content, category) => {
    try {
      const logsData = await db.get('coaching-logs') || [];
      logsData.push({
        id: Date.now(),
        employeeId,
        content,
        category: category || 'general',
        date: new Date().toISOString(),
        acknowledged: false,
        signature: null,
        comment: ''
      });
      await db.set('coaching-logs', logsData);
      setCoachingLogs(logsData);
      addToFeed(`📋 New coaching log posted for ${employeeId} (${category})`, 'coaching');
      return { success: 'Coaching log posted! ✅' };
    } catch (error) {
      return { error: 'Failed to post coaching log: ' + error.message };
    }
  };

  const acknowledgeCoachingLog = async (logId, comment, signature) => {
    try {
      const data = await db.get('coaching-logs') || [];
      const item = data.find(i => i.id === logId);
      if (item) {
        item.acknowledged = true;
        item.signature = signature;
        item.comment = comment;
        await db.set('coaching-logs', data);
        setCoachingLogs(data);
        return { success: 'Acknowledged! ✅' };
      }
      return { error: 'Coaching log not found!' };
    } catch (error) {
      return { error: 'Failed to acknowledge: ' + error.message };
    }
  };

  const loadCoachingLogs = async () => {
    const data = await db.get('coaching-logs') || [];
    setCoachingLogs(data);
  };

  return {
    coachingLogs,
    postCoachingLog,
    acknowledgeCoachingLog,
    loadCoachingLogs,
    setCoachingLogs,
  };
};

export default useCoaching;

/**
 * Post a coaching log
 */
export const postCoachingLogService = async (db, employeeId, content, category, currentUser, metadata = {}, addToFeed) => {
  try {
    const logsDataFromDB = await db.get('coaching-logs');
    const logsData = Array.isArray(logsDataFromDB) ? logsDataFromDB : [];

    logsData.push({
      id: Date.now(),
      employeeId,
      content,
      category: category || 'general',
      date: new Date().toISOString(),
      acknowledged: false,
      signature: null,
      comment: '',
      issuedBy: currentUser?.name || 'System',
      ...metadata
    });
    
    await db.set('coaching-logs', logsData);
    await addToFeed(`📋 New coaching log posted for ${employeeId} (${category})`, 'coaching', currentUser);
    
    return {
      success: true,
      logs: logsData
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to post coaching log: ' + err.message
    };
  }
};

/**
 * Delete a coaching log
 */
export const deleteCoachingLogService = async (db, logId) => {
  try {
    const logsData = await db.get('coaching-logs') || [];
    const updated = logsData.filter(log => log.id !== logId);
    await db.set('coaching-logs', updated);
    
    return {
      success: true,
      logs: updated
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to delete: ' + err.message
    };
  }
};

/**
 * Acknowledge a coaching log with signature
 */
export const acknowledgeCoachingService = async (db, logId, comment, signature, currentUser) => {
  try {
    const dataFromDB = await db.get('coaching-logs');
    const data = Array.isArray(dataFromDB) ? dataFromDB : [];
    const item = data.find(i => i.id === logId);

    if (!item) {
      return { success: false, error: 'Coaching log not found!' };
    }

    item.acknowledged = true;
    item.signature = signature;
    item.comment = comment;

    await db.set('coaching-logs', data);
    
    return {
      success: true,
      logs: data
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to acknowledge: ' + err.message
    };
  }
};

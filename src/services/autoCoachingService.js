import { VIOLATION_RULES } from '../constants/autoCoachingConfig';
import { formatDateToYMD } from '../utils/dateHelpers';

/**
 * Generate coaching content for a violation
 */
export const generateCoachingContent = (violation, employeeName) => {
  const rule = VIOLATION_RULES[violation.type];

  const coachingContent = `
COACHING NOTICE - ${rule.label}

Employee: ${employeeName}
Violation Type: ${rule.label}
Detection Date: ${new Date().toLocaleDateString()}
Incidents Detected: ${violation.count} in the last 30 days

HANDBOOK REFERENCE:
${rule.handbook}

CONSEQUENCES:
${rule.consequence}

INCIDENT DETAILS:
${violation.incidents.map((inc, i) => {
  if (violation.type === 'tardiness') {
    return `${i + 1}. ${inc.date} - ${inc.minutesLate} minutes late`;
  } else if (violation.type === 'overbreak') {
    return `${i + 1}. ${inc.date} - ${inc.type} exceeded by ${inc.exceeded} minutes (${inc.duration} min total)`;
  } else if (violation.type === 'absence') {
    return `${i + 1}. ${inc.date} - ${inc.type}`;
  }
  return '';
}).join('\n')}

${violation.type === 'absence' && violation.consecutiveAbsences >= 3 ?
  '\n⚠️ WARNING: THREE CONSECUTIVE ABSENCES DETECTED - THIS MAY RESULT IN IMMEDIATE DISMISSAL' : ''}

ACTION REQUIRED:
Employee must respond to this coaching notice within 24 hours with:
1. Explanation of circumstances
2. Action plan to prevent future violations
3. Acknowledgment of handbook policy

Coaching issued by: System (Auto-Generated)
Date: ${new Date().toLocaleString()}
  `.trim();

  return coachingContent;
};

/**
 * Extract incident dates from violation
 */
export const extractIncidentDates = (violation) => {
  return violation.incidents.map(inc => {
    const dateObj = new Date(inc.date);
    return formatDateToYMD(dateObj);
  });
};

/**
 * Create pending auto-coaching object
 */
export const createPendingCoaching = (violation, employeeName, currentUser) => {
  const content = generateCoachingContent(violation, employeeName);
  const incidentDates = extractIncidentDates(violation);

  console.log(`💾 Creating pending coaching with ${incidentDates.length} incident dates`);

  return {
    id: Date.now(),
    employeeId: violation.employeeId,
    employeeName: employeeName,
    content: content,
    category: violation.type,
    incidentDates: incidentDates,
    violationData: {
      count: violation.count,
      type: violation.type,
      ...(violation.accumulatedMinutes && { accumulatedMinutes: violation.accumulatedMinutes }),
      ...(violation.consecutiveAbsences && { consecutiveAbsences: violation.consecutiveAbsences })
    },
    detectedAt: new Date().toISOString(),
    currentUser: currentUser
  };
};

/**
 * Clean up old auto-coaching logs (before cutoff date)
 */
export const cleanupOldLogs = async (db, cutoffDate) => {
  try {
    const logsDataFromDB = await db.get('coaching-logs');
    const logsData = Array.isArray(logsDataFromDB) ? logsDataFromDB : [];

    const cleanedLogs = logsData.filter(log => {
      const isAutoCoaching = ['tardiness', 'overbreak', 'absence'].includes(log.category);
      if (!isAutoCoaching) return true;

      const logDate = new Date(log.date);
      return logDate >= cutoffDate;
    });

    const removedCount = logsData.length - cleanedLogs.length;

    if (removedCount > 0) {
      await db.set('coaching-logs', cleanedLogs);
      console.log(`🧹 Cleaned up ${removedCount} old auto-coaching logs`);
      return { success: true, removed: removedCount, logs: cleanedLogs };
    }

    return { success: true, removed: 0, logs: logsData };
  } catch (err) {
    console.error('Error cleaning up old logs:', err);
    return { success: false, error: err };
  }
};

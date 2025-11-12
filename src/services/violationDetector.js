import { BREAK_LIMITS, VIOLATION_RULES } from '../constants/autoCoachingConfig';
import { getAutoCoachingStartDate, getDayName, formatDateToYMD } from '../utils/dateHelpers';

/**
 * Check if an incident should be ignored based on stored preferences
 */
export const shouldIgnoreIncident = async (db, employeeId, category, incidentDate) => {
  try {
    const ignoredIncidents = await db.get('ignored-coaching-incidents') || {};
    const ignoredKey = `${employeeId}_${category}`;

    if (!ignoredIncidents[ignoredKey]) {
      return false;
    }

    const dateStr = formatDateToYMD(incidentDate);
    return ignoredIncidents[ignoredKey].dates.includes(dateStr);
  } catch (error) {
    console.error('Error checking ignored incidents:', error);
    return false;
  }
};

/**
 * Check for tardiness violations
 */
export const checkTardiness = async (employeeId, attendance, schedules, db) => {
  const startDate = getAutoCoachingStartDate();
  const incidents = [];

  Object.entries(attendance).forEach(([date, records]) => {
    const recordDate = new Date(date);
    if (recordDate >= startDate && records[employeeId]) {
      const record = records[employeeId];
      const dayName = getDayName(date);
      const scheduleStart = schedules[employeeId]?.[dayName]?.start || '09:00:00';
      const actualTime = record.time;

      const scheduledTime = new Date(`${date} ${scheduleStart}`);
      const actualDateTime = new Date(`${date} ${actualTime}`);
      const minutesLate = (actualDateTime - scheduledTime) / 60000;

      if (minutesLate > 0) {
        incidents.push({ date, minutesLate: Math.round(minutesLate) });
      }
    }
  });

  // Filter out ignored incidents
  const filteredIncidents = [];
  for (const incident of incidents) {
    const shouldIgnore = await shouldIgnoreIncident(db, employeeId, 'tardiness', incident.date);
    if (!shouldIgnore) {
      filteredIncidents.push(incident);
    }
  }

  console.log(`📊 ${employeeId} - Found ${filteredIncidents.length} tardiness incidents`);

  const filteredCount = filteredIncidents.length;
  const filteredMinutes = filteredIncidents.reduce((sum, inc) => sum + inc.minutesLate, 0);

  const thresholds = VIOLATION_RULES.tardiness.thresholds;
  if (filteredCount >= thresholds.count || filteredMinutes >= thresholds.minutes) {
    return {
      type: 'tardiness',
      employeeId,
      count: filteredCount,
      accumulatedMinutes: Math.round(filteredMinutes),
      incidents: filteredIncidents,
      triggered: true
    };
  }
  return null;
};

/**
 * Check for overbreak violations
 */
export const checkOverbreak = async (employeeId, breaks, db) => {
  const startDate = getAutoCoachingStartDate();
  const incidents = [];

  Object.entries(breaks).forEach(([date, records]) => {
    const recordDate = new Date(date);
    if (recordDate >= startDate && records[employeeId]) {
      records[employeeId].forEach(brk => {
        if (brk.end) {
          const duration = (new Date(brk.end) - new Date(brk.start)) / 60000;
          const limit = BREAK_LIMITS[brk.type];

          if (limit && duration > limit) {
            incidents.push({
              date,
              type: brk.type,
              duration: Math.round(duration),
              exceeded: Math.round(duration - limit)
            });
          }
        }
      });
    }
  });

  // Filter out ignored incidents
  const filteredIncidents = [];
  for (const incident of incidents) {
    const shouldIgnore = await shouldIgnoreIncident(db, employeeId, 'overbreak', incident.date);
    if (!shouldIgnore) {
      filteredIncidents.push(incident);
    }
  }

  console.log(`📊 ${employeeId} - Found ${filteredIncidents.length} overbreak incidents`);

  const thresholds = VIOLATION_RULES.overbreak.thresholds;
  if (filteredIncidents.length >= thresholds.count) {
    return {
      type: 'overbreak',
      employeeId,
      count: filteredIncidents.length,
      incidents: filteredIncidents,
      triggered: true
    };
  }
  return null;
};

/**
 * Check for absence/NCNS violations
 */
export const checkAbsence = async (employeeId, attendance, schedules, db) => {
  const startDate = getAutoCoachingStartDate();
  const absences = [];

  for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toDateString();
    const dayName = getDayName(dateStr);
    const userSchedule = schedules[employeeId]?.[dayName];

    if (userSchedule && userSchedule.start && userSchedule.end && !attendance[dateStr]?.[employeeId]) {
      absences.push({ date: dateStr, type: 'NCNS' });
    }
  }

  // Filter out ignored incidents
  const filteredIncidents = [];
  for (const incident of absences) {
    const shouldIgnore = await shouldIgnoreIncident(db, employeeId, 'absence', incident.date);
    if (!shouldIgnore) {
      filteredIncidents.push(incident);
    }
  }

  console.log(`📊 ${employeeId} - Found ${filteredIncidents.length} absence incidents`);

  // Calculate consecutive absences
  let consecutiveAbsences = 0;
  let maxConsecutive = 0;
  const sortedIncidents = filteredIncidents.sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  for (let i = 0; i < sortedIncidents.length; i++) {
    if (i === 0) {
      consecutiveAbsences = 1;
    } else {
      const prevDate = new Date(sortedIncidents[i - 1].date);
      const currDate = new Date(sortedIncidents[i].date);
      const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 3) {
        consecutiveAbsences++;
      } else {
        consecutiveAbsences = 1;
      }
    }
    maxConsecutive = Math.max(maxConsecutive, consecutiveAbsences);
  }

  if (filteredIncidents.length > 0) {
    const thresholds = VIOLATION_RULES.absence.thresholds;
    return {
      type: 'absence',
      employeeId,
      count: filteredIncidents.length,
      consecutiveAbsences: maxConsecutive,
      incidents: filteredIncidents,
      triggered: true,
      severity: maxConsecutive >= thresholds.consecutiveForSerious ? 'serious' : 'less-serious'
    };
  }
  return null;
};

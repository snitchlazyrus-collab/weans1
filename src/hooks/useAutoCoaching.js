// hooks/useAutoCoaching.js
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const INFRACTION_RULES = {
  tardiness: {
    label: 'Tardiness',
    ruleCode: 'IV-2',
    threshold: 3, // 3 instances in 30 days
    timeWindow: 30, // days
    handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 2a: Tardiness – Three (3) instances of tardiness or at least thirty (30) minutes of accumulated tardiness within 30 days shall warrant a first notice. (Minor Infraction)',
    consequence: 'Progressive discipline will be applied: First Formal Warning → Written Warning → Final Written Warning → Notice of Dismissal'
  },
  overbreak: {
    label: 'Over Break',
    ruleCode: 'IV-2b',
    threshold: 3,
    timeWindow: 30,
    handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 2b: Over Break – Three (3) instances of over break within 30 days shall warrant a first notice. (Minor Infraction)',
    consequence: 'Progressive discipline will be applied: First Formal Warning → Written Warning → Final Written Warning → Notice of Dismissal'
  },
  absence: {
    label: 'Absence / NCNS',
    ruleCode: 'IV-3',
    threshold: 1, // Even one NCNS is serious
    timeWindow: 30,
    handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 3: No Call No Show (NCNS) / Absence Without Official Leave (AWOL) or failure to report for work and advise immediate superior regarding the absence within 2 hours before the scheduled shift. (Less Serious Infraction)',
    consequence: 'Progressive discipline will be applied: Written Warning → Final Written Warning → Notice of Dismissal. Three (3) consecutive days of absence without official leave is considered a Serious Infraction and may result in immediate dismissal.'
  },
  undertime: {
    label: 'Undertime',
    ruleCode: 'IV-2c',
    threshold: 3,
    timeWindow: 30,
    handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 2c: Under Time – Failure to complete the required number of work hours. This includes leaving work area, assignment, duty station or going outside Company premises during designated work hours without proper authorization. (Minor Infraction)',
    consequence: 'Progressive discipline will be applied: First Formal Warning → Written Warning → Final Written Warning → Notice of Dismissal'
  }
};

export const useAutoCoaching = () => {
  const { attendance, breaks, postCoachingLog, addToFeed } = useApp();
  const [detectedInfractions, setDetectedInfractions] = useState([]);

  // Check for tardiness violations
  const checkTardiness = (employeeId) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    let tardinessCount = 0;
    let accumulatedMinutes = 0;
    const incidents = [];

    Object.entries(attendance).forEach(([date, records]) => {
      const recordDate = new Date(date);
      if (recordDate >= last30Days && records[employeeId]) {
        const record = records[employeeId];
        const scheduleStart = '09:00:00'; // You can get this from schedules
        const actualTime = record.time;
        
        // Calculate if late
        const scheduledTime = new Date(`${date} ${scheduleStart}`);
        const actualDateTime = new Date(`${date} ${actualTime}`);
        const minutesLate = (actualDateTime - scheduledTime) / 60000;
        
        if (minutesLate > 0) {
          tardinessCount++;
          accumulatedMinutes += minutesLate;
          incidents.push({ date, minutesLate: Math.round(minutesLate) });
        }
      }
    });

    if (tardinessCount >= 3 || accumulatedMinutes >= 30) {
      return {
        type: 'tardiness',
        employeeId,
        count: tardinessCount,
        accumulatedMinutes: Math.round(accumulatedMinutes),
        incidents,
        triggered: true
      };
    }
    return null;
  };

  // Check for overbreak violations
  const checkOverbreak = (employeeId) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    let overbreakCount = 0;
    const incidents = [];
    const breakLimits = { 'break1': 15, 'break2': 15, 'lunch': 60 };

    Object.entries(breaks).forEach(([date, records]) => {
      const recordDate = new Date(date);
      if (recordDate >= last30Days && records[employeeId]) {
        records[employeeId].forEach(brk => {
          if (brk.end) {
            const duration = (new Date(brk.end) - new Date(brk.start)) / 60000;
            const limit = breakLimits[brk.type];
            
            if (limit && duration > limit) {
              overbreakCount++;
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

    if (overbreakCount >= 3) {
      return {
        type: 'overbreak',
        employeeId,
        count: overbreakCount,
        incidents,
        triggered: true
      };
    }
    return null;
  };

  // Check for absence/NCNS
  const checkAbsence = (employeeId, schedules) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const absences = [];
    let consecutiveAbsences = 0;
    let lastAbsenceDate = null;

    // Check each day in last 30 days
    for (let d = new Date(last30Days); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toDateString();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const userSchedule = schedules[employeeId]?.[dayName];
      
      // If scheduled to work but no attendance record
      if (userSchedule && userSchedule.start && !attendance[dateStr]?.[employeeId]) {
        absences.push({ date: dateStr, type: 'NCNS' });
        
        // Check for consecutive absences
        if (lastAbsenceDate) {
          const dayDiff = (d - new Date(lastAbsenceDate)) / (1000 * 60 * 60 * 24);
          if (dayDiff === 1) {
            consecutiveAbsences++;
          } else {
            consecutiveAbsences = 1;
          }
        } else {
          consecutiveAbsences = 1;
        }
        lastAbsenceDate = dateStr;
      }
    }

    if (absences.length > 0) {
      return {
        type: 'absence',
        employeeId,
        count: absences.length,
        consecutiveAbsences,
        incidents: absences,
        triggered: true,
        severity: consecutiveAbsences >= 3 ? 'serious' : 'less-serious'
      };
    }
    return null;
  };

  // Auto-generate coaching log when violation detected
  const triggerAutoCoaching = async (violation, employeeName, currentUser) => {
    const rule = INFRACTION_RULES[violation.type];
    
    const coachingContent = `
AUTOMATIC COACHING NOTICE - ${rule.label}

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

Coaching issued by: ${currentUser.name}
Date: ${new Date().toLocaleString()}
    `.trim();

    await postCoachingLog(
      violation.employeeId,
      coachingContent,
      violation.type,
      currentUser
    );

    await addToFeed(
      `🚨 AUTO-COACHING: ${employeeName} triggered ${rule.label} threshold (${violation.count} incidents)`,
      'auto-coaching',
      currentUser
    );

    return {
      success: true,
      message: `Auto-coaching triggered for ${employeeName} - ${rule.label}`
    };
  };

  return {
    checkTardiness,
    checkOverbreak,
    checkAbsence,
    triggerAutoCoaching,
    INFRACTION_RULES,
    detectedInfractions
  };
};

export default useAutoCoaching;

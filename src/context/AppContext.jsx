import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseDB } from '../firebase/FirebaseDB';
import { firebaseConfig } from '../firebase/firebaseConfig';
import { INFRACTION_RULES } from '../constants/infractionRules';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  console.log('useApp called, context:', context);
  if (!context) {
    console.error('Context is undefined! Make sure AppProvider wraps your component tree.');
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const db = new FirebaseDB(firebaseConfig);

  // State management
  const [users, setUsers] = useState({});
  const [attendance, setAttendance] = useState({});
  const [breaks, setBreaks] = useState({});
  const [coachingLogs, setCoachingLogs] = useState([]);
  const [infractions, setInfractions] = useState([]);
  const [memos, setMemos] = useState([]);
  const [feed, setFeed] = useState([]);
  const [media, setMedia] = useState([]);
  const [snitchMessages, setSnitchMessages] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [clients, setClients] = useState({});
  const [clientAssignments, setClientAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoCoachingEnabled, setAutoCoachingEnabledState] = useState(true);

  // Load all data from Firebase
  const loadAllData = async () => {
    try {
      const [
        loadedUsers,
        loadedAttendance,
        loadedBreaks,
        loadedCoaching,
        loadedInfractions,
        loadedMemos,
        loadedFeed,
        loadedMedia,
        loadedSnitch,
        loadedSchedules,
        loadedClients,
        loadedAssignments,
        loadedAutoCoachingSetting
      ] = await Promise.all([
        db.get('users'),
        db.get('attendance'),
        db.get('breaks'),
        db.get('coaching-logs'),
        db.get('infractions'),
        db.get('memos'),
        db.get('feed'),
        db.get('media'),
        db.get('snitch'),
        db.get('schedules'),
        db.get('clients'),
        db.get('client-assignments'),
        db.get('settings/auto-coaching-enabled')
      ]);

      setUsers(loadedUsers || {});
      setAttendance(loadedAttendance || {});
      setBreaks(loadedBreaks || {});
      setCoachingLogs(Array.isArray(loadedCoaching) ? loadedCoaching : []);
      setInfractions(Array.isArray(loadedInfractions) ? loadedInfractions : []);
      setMemos(Array.isArray(loadedMemos) ? loadedMemos : []);
      setFeed(Array.isArray(loadedFeed) ? loadedFeed : []);
      setMedia(Array.isArray(loadedMedia) ? loadedMedia : []);
      setSnitchMessages(Array.isArray(loadedSnitch) ? loadedSnitch : []);
      setSchedules(loadedSchedules || {});
      setClients(loadedClients || {});
      setClientAssignments(loadedAssignments || {});
      setAutoCoachingEnabledState(loadedAutoCoachingSetting !== false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from database');
    }
  };

  // Initialize app and create admin if needed
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const existingUsers = await db.get('users');
        if (!existingUsers) {
          const adminUser = {
            Username: {
              password: 'Password123',
              role: 'admin',
              employeeId: 'ADMIN001',
              name: 'Administrator',
              loginHistory: []
            }
          };
          await db.set('users', adminUser);
        }
        await loadAllData();
      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to initialize app');
      }
      setLoading(false);
    };
    initApp();
  }, []);

  // Feed management
  const addToFeed = async (message, type, currentUser) => {
    try {
      const feedDataFromDB = await db.get('feed');
      const feedData = Array.isArray(feedDataFromDB) ? feedDataFromDB : [];

      feedData.unshift({
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toISOString(),
        author: currentUser?.name || 'System'
      });

      if (feedData.length > 100) feedData.pop();

      await db.set('feed', feedData);
      setFeed(feedData);
    } catch (err) {
      console.error('Error adding to feed:', err);
    }
  };

  // Attendance operations
  const markPresent = async (currentUser) => {
    try {
      const today = new Date().toDateString();
      const attendanceData = await db.get('attendance') || {};

      if (!attendanceData[today]) attendanceData[today] = {};

      attendanceData[today][currentUser.employeeId] = {
        status: 'present',
        time: new Date().toLocaleTimeString(),
        approved: false,
        username: currentUser.username,
        name: currentUser.name
      };

      await db.set('attendance', attendanceData);
      setAttendance(attendanceData);
      await addToFeed(`${currentUser.name} has arrived! 🎯`, 'attendance', currentUser);
      setSuccess('Marked present! Waiting for admin approval... ⏳');
    } catch (err) {
      setError('Failed to mark attendance: ' + err.message);
    }
  };

  const approveAttendance = async (date, employeeId) => {
    try {
      const attendanceData = await db.get('attendance') || {};
      if (attendanceData[date] && attendanceData[date][employeeId]) {
        attendanceData[date][employeeId].approved = true;
        await db.set('attendance', attendanceData);
        setAttendance(attendanceData);
        setSuccess('Attendance approved! ✅');
      }
    } catch (err) {
      setError('Failed to approve attendance: ' + err.message);
    }
  };

  // Break operations - FIXED
  const startBreak = async (type, currentUser) => {
    try {
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

      const emoji = type === 'lunch' ? '🍕' : type === 'rr' ? '🚽' : '☕';
      await addToFeed(`${currentUser.name} is on ${type}! ${emoji}`, 'break', currentUser);

      // FIXED: Return date along with other info
      return {
        index: breakData[today][currentUser.employeeId].length - 1,
        start: now,
        type,
        date: today
      };
    } catch (err) {
      setError('Failed to start break: ' + err.message);
      return null;
    }
  };

  // FIXED: Use stored date from activeBreak
  const endBreak = async (activeBreak, currentUser) => {
    try {
      if (!activeBreak) return;

      const now = new Date();
      const breakData = await db.get('breaks') || {};
      const today = activeBreak.date || now.toDateString(); // Use stored date

      if (!breakData[today] || !breakData[today][currentUser.employeeId]) {
        setError('Break data not found!');
        return;
      }

      const userBreaks = breakData[today][currentUser.employeeId];

      if (!userBreaks[activeBreak.index]) {
        setError('Break record not found!');
        return;
      }

      userBreaks[activeBreak.index].end = now.toISOString();

      const duration = (now - new Date(activeBreak.start)) / 60000;
      const limits = { 'break1': 15, 'break2': 15, 'lunch': 60 };

      if (limits[activeBreak.type] && duration > limits[activeBreak.type]) {
        await addToFeed(`⚠️ ${currentUser.name} exceeded ${activeBreak.type} by ${Math.round(duration - limits[activeBreak.type])} mins!`, 'alert', currentUser);
      }

      await db.set('breaks', breakData);
      setBreaks(breakData);
      await addToFeed(`${currentUser.name} is back from ${activeBreak.type}! 🔙`, 'break', currentUser);
    } catch (err) {
      setError('Failed to end break: ' + err.message);
    }
  };

  const approveBreak = async (date, employeeId, breakIndex) => {
    try {
      const breakData = await db.get('breaks') || {};
      if (breakData[date] && breakData[date][employeeId] && breakData[date][employeeId][breakIndex]) {
        breakData[date][employeeId][breakIndex].approved = true;
        await db.set('breaks', breakData);
        setBreaks(breakData);
        setSuccess('Break approved! ✅');
      }
    } catch (err) {
      setError('Failed to approve break: ' + err.message);
    }
  };

  // Coaching log operations
  const postCoachingLog = async (employeeId, content, category, currentUser) => {
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
        issuedBy: currentUser?.name || 'System'
      });
      await db.set('coaching-logs', logsData);
      setCoachingLogs(logsData);
      await addToFeed(`📋 New coaching log posted for ${employeeId} (${category})`, 'coaching', currentUser);
      setSuccess('Coaching log posted! ✅');
    } catch (err) {
      setError('Failed to post coaching log: ' + err.message);
    }
  };

  // AUTO-COACHING LOGIC
  const checkAndTriggerAutoCoaching = async (adminUser) => {
    if (!autoCoachingEnabled || !adminUser) return;

    const systemUser = adminUser || { name: 'Auto-Coaching System', employeeId: 'SYSTEM' };

    // Get all employees
    const employeeList = Object.entries(users)
      .filter(([username, user]) => user.role === 'employee')
      .map(([username, user]) => ({ username, ...user }));

    for (const employee of employeeList) {
      // Check if already coached in last 30 days
      const hasRecentCoaching = (type) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return coachingLogs.some(log =>
          log.employeeId === employee.employeeId &&
          log.category === type &&
          new Date(log.date) > thirtyDaysAgo
        );
      };

      // CHECK TARDINESS
      if (!hasRecentCoaching('tardiness')) {
        const tardinessViolation = checkTardiness(employee.employeeId);
        if (tardinessViolation?.triggered) {
          await triggerAutoCoaching(tardinessViolation, employee.name, systemUser);
        }
      }

      // CHECK OVERBREAK
      if (!hasRecentCoaching('overbreak')) {
        const overbreakViolation = checkOverbreak(employee.employeeId);
        if (overbreakViolation?.triggered) {
          await triggerAutoCoaching(overbreakViolation, employee.name, systemUser);
        }
      }

      // CHECK ABSENCE
      if (!hasRecentCoaching('absence')) {
        const absenceViolation = checkAbsence(employee.employeeId);
        if (absenceViolation?.triggered) {
          await triggerAutoCoaching(absenceViolation, employee.name, systemUser);
        }
      }
    }
  };

  // Check for tardiness violations
  const checkTardiness = (employeeId) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Don't check anything before Nov 9, 2025
    const cutoffDate = new Date('2025-11-09');
    const startDate = last30Days > cutoffDate ? last30Days : cutoffDate;

    let tardinessCount = 0;
    let accumulatedMinutes = 0;
    const incidents = [];

    Object.entries(attendance).forEach(([date, records]) => {
      const recordDate = new Date(date);
      if (recordDate >= startDate && records[employeeId]) {
        const record = records[employeeId];
        const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const scheduleStart = schedules[employeeId]?.[dayName]?.start || '09:00:00';
        const actualTime = record.time;

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

    // Don't check anything before Nov 9, 2025
    const cutoffDate = new Date('2025-11-09');
    const startDate = last30Days > cutoffDate ? last30Days : cutoffDate;

    let overbreakCount = 0;
    const incidents = [];
    const breakLimits = { 'break1': 15, 'break2': 15, 'lunch': 60 };

    Object.entries(breaks).forEach(([date, records]) => {
      const recordDate = new Date(date);
      if (recordDate >= startDate && records[employeeId]) {
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
  const checkAbsence = (employeeId) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Don't check anything before Nov 9, 2025
    const cutoffDate = new Date('2025-11-09');
    const startDate = last30Days > cutoffDate ? last30Days : cutoffDate;

    const absences = [];
    let consecutiveAbsences = 0;
    let lastAbsenceDate = null;

    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toDateString();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const userSchedule = schedules[employeeId]?.[dayName];

      // Only check if they have a schedule set for this day AND the schedule has start/end times
      if (userSchedule && userSchedule.start && userSchedule.end && !attendance[dateStr]?.[employeeId]) {
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

  // FIXED: Removed 'AUTOMATIC' from coaching log content
  const triggerAutoCoaching = async (violation, employeeName, currentUser) => {
    const rules = {
      tardiness: {
        label: 'Tardiness',
        ruleCode: 'IV-2',
        handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 2a: Tardiness – Three (3) instances of tardiness or at least thirty (30) minutes of accumulated tardiness within 30 days shall warrant a first notice. (Minor Infraction)',
        consequence: 'Progressive discipline will be applied: First Formal Warning → Written Warning → Final Written Warning → Notice of Dismissal'
      },
      overbreak: {
        label: 'Over Break',
        ruleCode: 'IV-2b',
        handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 2b: Over Break – Three (3) instances of over break within 30 days shall warrant a first notice. (Minor Infraction)',
        consequence: 'Progressive discipline will be applied: First Formal Warning → Written Warning → Final Written Warning → Notice of Dismissal'
      },
      absence: {
        label: 'Absence / NCNS',
        ruleCode: 'IV-3',
        handbook: 'RULE IV: ATTENDANCE AND PUNCTUALITY - Section 3: No Call No Show (NCNS) / Absence Without Official Leave (AWOL) or failure to report for work and advise immediate superior regarding the absence within 2 hours before the scheduled shift. (Less Serious Infraction)',
        consequence: 'Progressive discipline will be applied: Written Warning → Final Written Warning → Notice of Dismissal. Three (3) consecutive days of absence without official leave is considered a Serious Infraction and may result in immediate dismissal.'
      }
    };

    const rule = rules[violation.type];

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
  };

  // Run auto-coaching checks when data changes
  useEffect(() => {
    if (!loading && autoCoachingEnabled && Object.keys(users).length > 0) {
      const adminUser = Object.entries(users).find(([_, user]) => user.role === 'admin');
      if (adminUser) {
        checkAndTriggerAutoCoaching({ name: adminUser[1].name, employeeId: adminUser[1].employeeId });
      }
    }
  }, [attendance, breaks, autoCoachingEnabled, loading]);

  // Infraction operations
  const postInfraction = async (employeeId, ruleCode, additionalNotes, currentUser) => {
    try {
      const rule = INFRACTION_RULES[ruleCode];
      if (!rule) {
        setError('Invalid infraction rule code!');
        return;
      }

      const existingIrsData = await db.get('infractions');
      const existingIrs = Array.isArray(existingIrsData) ? existingIrsData : [];

      const employeeInfractions = existingIrs.filter(ir =>
        ir.employeeId === employeeId && ir.ruleCode === ruleCode
      );

      const occurrenceCount = employeeInfractions.length + 1;

      const irsData = [...existingIrs];
      irsData.push({
        id: Date.now(),
        employeeId,
        ruleCode,
        rule: rule.rule,
        section: rule.section,
        description: rule.description,
        level: rule.level,
        additionalNotes: additionalNotes || '',
        occurrenceCount,
        date: new Date().toISOString(),
        acknowledged: false,
        signature: null,
        comment: ''
      });

      await db.set('infractions', irsData);
      setInfractions(irsData);
      await addToFeed(`⚠️ Infraction report issued to ${employeeId} (${rule.level} - ${occurrenceCount}${occurrenceCount === 1 ? 'st' : occurrenceCount === 2 ? 'nd' : occurrenceCount === 3 ? 'rd' : 'th'} offense)`, 'infraction', currentUser);
      setSuccess(`Infraction issued! This is the ${occurrenceCount}${occurrenceCount === 1 ? 'st' : occurrenceCount === 2 ? 'nd' : occurrenceCount === 3 ? 'rd' : 'th'} offense for this rule.`);
    } catch (err) {
      setError('Failed to post infraction: ' + err.message);
    }
  };

  // Memo operations
  const postMemo = async (title, content, currentUser) => {
    try {
      const memoDataFromDB = await db.get('memos');
      const memoData = Array.isArray(memoDataFromDB) ? memoDataFromDB : [];

      memoData.push({
        id: Date.now(),
        title,
        content,
        date: new Date().toISOString(),
        acknowledgedBy: {}
      });

      await db.set('memos', memoData);
      setMemos(memoData);
      await addToFeed(`📢 New memo: ${title}`, 'memo', currentUser);
      setSuccess('Memo posted! ✅');
    } catch (err) {
      setError('Failed to post memo: ' + err.message);
    }
  };

  // Acknowledgment with signature
  const acknowledgeWithSignature = async (type, id, comment, signature, currentUser) => {
    try {
      let data;
      let item;

      if (type === 'coaching') {
        const dataFromDB = await db.get('coaching-logs');
        data = Array.isArray(dataFromDB) ? dataFromDB : [];
        item = data.find(i => i.id === id);

        if (!item) {
          setError('Coaching log not found!');
          return { error: 'Coaching log not found!' };
        }

        item.acknowledged = true;
        item.signature = signature;
        item.comment = comment;

        await db.set('coaching-logs', data);
        setCoachingLogs(data);

      } else if (type === 'infraction') {
        const dataFromDB = await db.get('infractions');
        data = Array.isArray(dataFromDB) ? dataFromDB : [];
        item = data.find(i => i.id === id);

        if (!item) {
          setError('Infraction not found!');
          return { error: 'Infraction not found!' };
        }

        item.acknowledged = true;
        item.signature = signature;
        item.comment = comment;

        await db.set('infractions', data);
        setInfractions(data);

      } else if (type === 'memo') {
        const dataFromDB = await db.get('memos');
        data = Array.isArray(dataFromDB) ? dataFromDB : [];
        item = data.find(i => i.id === id);

        if (!item) {
          setError('Memo not found!');
          return { error: 'Memo not found!' };
        }

        if (!item.acknowledgedBy) {
          item.acknowledgedBy = {};
        }

        item.acknowledgedBy[currentUser.employeeId] = {
          signature,
          date: new Date().toISOString(),
          name: currentUser.name
        };

        await db.set('memos', data);
        setMemos(data);

      } else {
        setError('Invalid acknowledgment type!');
        return { error: 'Invalid acknowledgment type!' };
      }

      setSuccess('Acknowledged! ✅');
      return { success: true };

    } catch (err) {
      const errorMsg = 'Failed to acknowledge: ' + err.message;
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  // Snitch message
  const sendSnitchMessage = async (message, currentUser) => {
    try {
      const messagesFromDB = await db.get('snitch');
      const messages = Array.isArray(messagesFromDB) ? messagesFromDB : [];

      messages.push({
        id: Date.now(),
        employeeId: currentUser.employeeId,
        message,
        date: new Date().toISOString(),
        read: false
      });

      await db.set('snitch', messages);
      setSnitchMessages(messages);
      setSuccess('Message sent confidentially! 🤫');
    } catch (err) {
      setError('Failed to send message: ' + err.message);
    }
  };

  // Schedule operations
  const setUserSchedule = async (employeeId, schedule, currentUser) => {
    try {
      const scheduleData = await db.get('schedules') || {};
      scheduleData[employeeId] = {
        ...schedule,
        updatedBy: currentUser.username,
        updatedAt: new Date().toISOString()
      };
      await db.set('schedules', scheduleData);
      setSchedules(scheduleData);
      await addToFeed(`📅 Schedule updated for ${employeeId}`, 'schedule', currentUser);
      setSuccess('Schedule updated successfully! ✅');
    } catch (err) {
      setError('Failed to update schedule: ' + err.message);
    }
  };

  // Client operations
  const addClient = async (name, businessHours, currentUser) => {
    try {
      const clientData = await db.get('clients') || {};
      const clientId = 'CLIENT-' + Date.now();
      clientData[clientId] = {
        name,
        businessHours,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.username
      };
      await db.set('clients', clientData);
      setClients(clientData);
      await addToFeed(`🏢 New client added: ${name}`, 'client', currentUser);
      setSuccess('Client added successfully! ✅');
    } catch (err) {
      setError('Failed to add client: ' + err.message);
    }
  };

  const updateClient = async (clientId, clientName, businessHours, currentUser) => {
    try {
      const clientData = await db.get('clients') || {};
      if (clientData[clientId]) {
        clientData[clientId].name = clientName;
        clientData[clientId].businessHours = businessHours;
        clientData[clientId].updatedAt = new Date().toISOString();
        clientData[clientId].updatedBy = currentUser.username;

        await db.set('clients', clientData);
        setClients(clientData);
        await addToFeed(`🏢 Client ${clientName} updated`, 'client', currentUser);
        setSuccess('Client updated successfully! ✅');
      } else {
        setError('Client not found!');
      }
    } catch (err) {
      setError('Failed to update client: ' + err.message);
    }
  };

  const deleteClient = async (clientId, currentUser) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      const clientData = await db.get('clients') || {};
      const assignmentData = await db.get('client-assignments') || {};

      if (clientData[clientId]) {
        const clientName = clientData[clientId].name;
        delete clientData[clientId];
        await db.set('clients', clientData);
        setClients(clientData);

        if (assignmentData[clientId]) {
          delete assignmentData[clientId];
          await db.set('client-assignments', assignmentData);
          setClientAssignments(assignmentData);
        }

        await addToFeed(`🗑️ Client ${clientName} deleted`, 'client', currentUser);
        setSuccess('Client deleted successfully! ✅');
      }
    } catch (err) {
      setError('Failed to delete client: ' + err.message);
    }
  };

  const assignUserToClient = async (employeeId, clientId, currentUser) => {
    try {
      const assignmentData = await db.get('client-assignments') || {};

      if (!assignmentData[clientId]) {
        assignmentData[clientId] = [];
      }

      if (!assignmentData[clientId].includes(employeeId)) {
        assignmentData[clientId].push(employeeId);
        await db.set('client-assignments', assignmentData);
        setClientAssignments(assignmentData);
        await addToFeed(`👤 User ${employeeId} assigned to client`, 'assignment', currentUser);
        setSuccess('User assigned to client! ✅');
      } else {
        setError('User already assigned to this client!');
      }
    } catch (err) {
      setError('Failed to assign user: ' + err.message);
    }
  };

  const removeUserFromClient = async (employeeId, clientId, currentUser) => {
    try {
      const assignmentData = await db.get('client-assignments') || {};

      if (assignmentData[clientId]) {
        assignmentData[clientId] = assignmentData[clientId].filter(id => id !== employeeId);
        await db.set('client-assignments', assignmentData);
        setClientAssignments(assignmentData);
        await addToFeed(`👤 User ${employeeId} removed from client`, 'assignment', currentUser);
        setSuccess('User removed from client! ✅');
      }
    } catch (err) {
      setError('Failed to remove user: ' + err.message);
    }
  };

  // User management
  const blockUser = async (username, currentUser) => {
    if (!window.confirm(`Block user ${username}?`)) return;
    try {
      const userData = await db.get('users') || {};

      if (userData[username]) {
        userData[username].blocked = true;
        await db.set('users', userData);
        setUsers(userData);
        await addToFeed(`🚫 User ${username} blocked`, 'admin', currentUser);
        setSuccess('User blocked! 🚫');
      } else {
        setError('User not found!');
      }
    } catch (err) {
      setError('Failed to block user: ' + err.message);
    }
  };

  const unblockUser = async (username, currentUser) => {
    try {
      const userData = await db.get('users') || {};

      if (userData[username]) {
        userData[username].blocked = false;
        await db.set('users', userData);
        setUsers(userData);
        await addToFeed(`✅ User ${username} unblocked`, 'admin', currentUser);
        setSuccess('User unblocked! ✅');
      } else {
        setError('User not found!');
      }
    } catch (err) {
      setError('Failed to unblock user: ' + err.message);
    }
  };

  const deleteUser = async (username, currentUser) => {
    if (!window.confirm(`Delete user ${username}? This cannot be undone!`)) return;
    try {
      const userData = await db.get('users') || {};

      if (userData[username]) {
        const userName = userData[username].name;
        delete userData[username];
        await db.set('users', userData);
        setUsers(userData);
        await addToFeed(`🗑️ User ${userName} deleted`, 'admin', currentUser);
        setSuccess('User deleted! 🗑️');
      } else {
        setError('User not found!');
      }
    } catch (err) {
      setError('Failed to delete user: ' + err.message);
    }
  };

  // Coverage report calculation
  const calculateCoverageReport = (clientId, date) => {
    const client = clients[clientId];
    if (!client) return null;

    const assignments = clientAssignments[clientId] || [];
    const dateStr = new Date(date).toDateString();
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const businessHours = client.businessHours?.[dayName];

    if (!businessHours || !businessHours.start || !businessHours.end) {
      return { error: 'No business hours set for this day' };
    }

    const report = {
      clientName: client.name,
      date: dateStr,
      dayName,
      businessHours,
      coverage: [],
      totalCoverage: 0
    };

    assignments.forEach(empId => {
      const userSchedule = schedules[empId]?.[dayName];
      const userAttendance = attendance[dateStr]?.[empId];
      const userBreaks = breaks[dateStr]?.[empId] || [];

      let coverageMinutes = 0;
      let adherence = 0;

      if (userSchedule && userSchedule.start && userSchedule.end && userAttendance) {
        const schedStart = new Date(`${dateStr} ${userSchedule.start}`);
        const schedEnd = new Date(`${dateStr} ${userSchedule.end}`);
        const bizStart = new Date(`${dateStr} ${businessHours.start}`);
        const bizEnd = new Date(`${dateStr} ${businessHours.end}`);

        const overlapStart = new Date(Math.max(schedStart, bizStart));
        const overlapEnd = new Date(Math.min(schedEnd, bizEnd));

        if (overlapStart < overlapEnd) {
          coverageMinutes = (overlapEnd - overlapStart) / 60000;

          userBreaks.forEach(brk => {
            if (brk.end) {
              const breakDuration = (new Date(brk.end) - new Date(brk.start)) / 60000;
              coverageMinutes -= breakDuration;
            }
          });
        }

        const totalBizMinutes = (bizEnd - bizStart) / 60000;
        adherence = totalBizMinutes > 0 ? (coverageMinutes / totalBizMinutes) * 100 : 0;
      }

      report.coverage.push({
        employeeId: empId,
        scheduled: userSchedule,
        attended: userAttendance,
        breaks: userBreaks,
        coverageMinutes: Math.max(0, coverageMinutes),
        adherence: Math.max(0, Math.min(100, adherence))
      });
    });

    const totalBizMinutes = (new Date(`${dateStr} ${businessHours.end}`) -
                            new Date(`${dateStr} ${businessHours.start}`)) / 60000;
    const totalCovered = report.coverage.reduce((sum, c) => sum + c.coverageMinutes, 0);
    report.totalCoverage = totalBizMinutes > 0 ? (totalCovered / totalBizMinutes) * 100 : 0;

    return report;
  };

  // Test database connection
  const testConnection = async () => {
    try {
      await db.set('test', { working: true });
      const result = await db.get('test');
      alert('Database connection: ' + (result ? 'WORKING ✅' : 'FAILED ❌'));
    } catch (e) {
      alert('Database error: ' + e.message);
    }
  };

  // Manual trigger for auto-coaching (for testing/admin use)
  const manualTriggerAutoCoaching = async (currentUser) => {
    await checkAndTriggerAutoCoaching(currentUser);
    setSuccess('Auto-coaching check completed! ✅');
  };

  const setAutoCoachingEnabled = async (enabled) => {
    try {
      await db.set('settings/auto-coaching-enabled', enabled);
      setAutoCoachingEnabledState(enabled);
      setSuccess(`Auto-coaching ${enabled ? 'enabled' : 'disabled'}! ✅`);
    } catch (err) {
      setError('Failed to update auto-coaching setting: ' + err.message);
    }
  };

  const value = {
    // State
    users,
    attendance,
    breaks,
    coachingLogs,
    infractions,
    memos,
    feed,
    media,
    snitchMessages,
    schedules,
    clients,
    clientAssignments,
    loading,
    error,
    success,
    setError,
    setSuccess,

    // Methods
    markPresent,
    approveAttendance,
    startBreak,
    endBreak,
    approveBreak,
    postCoachingLog,
    postInfraction,
    postMemo,
    acknowledgeWithSignature,
    sendSnitchMessage,
    setUserSchedule,
    addClient,
    updateClient,
    deleteClient,
    assignUserToClient,
    removeUserFromClient,
    blockUser,
    unblockUser,
    deleteUser,
    calculateCoverageReport,
    addToFeed,
    testConnection,
    loadAllData,

    // Auto-coaching
    autoCoachingEnabled,
    setAutoCoachingEnabled,
    manualTriggerAutoCoaching,
    checkTardiness,
    checkOverbreak,
    checkAbsence,

    // DB instance
    db
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

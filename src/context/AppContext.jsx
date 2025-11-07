import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseDB } from '../firebase/FirebaseDB';
import { firebaseConfig } from '../firebase/firebaseConfig';
import { INFRACTION_RULES } from '../constants/infractionRules';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
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
        loadedAssignments
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
        db.get('client-assignments')
      ]);

      setUsers(loadedUsers || {});
      setAttendance(loadedAttendance || {});
      setBreaks(loadedBreaks || {});
      setCoachingLogs(loadedCoaching || []);
      setInfractions(loadedInfractions || []);
      setMemos(loadedMemos || []);
      setFeed(loadedFeed || []);
      setMedia(loadedMedia || []);
      setSnitchMessages(loadedSnitch || []);
      setSchedules(loadedSchedules || {});
      setClients(loadedClients || {});
      setClientAssignments(loadedAssignments || {});
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
      const feedData = await db.get('feed') || [];
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

  // Break operations
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

      return { index: breakData[today][currentUser.employeeId].length - 1, start: now, type };
    } catch (err) {
      setError('Failed to start break: ' + err.message);
      return null;
    }
  };

  const endBreak = async (activeBreak, currentUser) => {
    try {
      if (!activeBreak) return;

      const now = new Date();
      const breakData = await db.get('breaks') || {};
      const today = now.toDateString();

      const userBreaks = breakData[today][currentUser.employeeId];
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
      await addToFeed(`📋 New coaching log posted for ${employeeId} (${category})`, 'coaching', currentUser);
      setSuccess('Coaching log posted! ✅');
    } catch (err) {
      setError('Failed to post coaching log: ' + err.message);
    }
  };

  // Infraction operations
  const postInfraction = async (employeeId, ruleCode, additionalNotes, currentUser) => {
    try {
      const rule = INFRACTION_RULES[ruleCode];
      if (!rule) {
        setError('Invalid infraction rule code!');
        return;
      }

      const existingIrs = await db.get('infractions') || [];
      const employeeInfractions = existingIrs.filter(ir =>
        ir.employeeId === employeeId && ir.ruleCode === ruleCode
      );

      const occurrenceCount = employeeInfractions.length + 1;

      const irsData = await db.get('infractions') || [];
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
      const memoData = await db.get('memos') || [];
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
      if (type === 'coaching') {
        data = await db.get('coaching-logs') || [];
        const item = data.find(i => i.id === id);
        if (item) {
          item.acknowledged = true;
          item.signature = signature;
          item.comment = comment;
        }
        await db.set('coaching-logs', data);
        setCoachingLogs(data);
      } else if (type === 'infraction') {
        data = await db.get('infractions') || [];
        const item = data.find(i => i.id === id);
        if (item) {
          item.acknowledged = true;
          item.signature = signature;
          item.comment = comment;
        }
        await db.set('infractions', data);
        setInfractions(data);
      } else if (type === 'memo') {
        data = await db.get('memos') || [];
        const item = data.find(i => i.id === id);
        if (item) {
          item.acknowledgedBy[currentUser.employeeId] = {
            signature,
            date: new Date().toISOString(),
            name: currentUser.name
          };
        }
        await db.set('memos', data);
        setMemos(data);
      }
      setSuccess('Acknowledged! ✅');
    } catch (err) {
      setError('Failed to acknowledge: ' + err.message);
    }
  };

  // Snitch message
  const sendSnitchMessage = async (message, currentUser) => {
    try {
      const messages = await db.get('snitch') || [];
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
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
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
      const result = await db.test();
      alert('Database connection: ' + result);
    } catch (e) {
      alert('Database error: ' + e.message);
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

    // DB instance
    db
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

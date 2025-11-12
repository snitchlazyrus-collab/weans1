import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseDB } from '../firebase/FirebaseDB';
import { firebaseConfig } from '../firebase/firebaseConfig';
import { INFRACTION_RULES } from '../constants/infractionRules';
import { AUTO_COACHING_CUTOFF_DATE } from '../constants/autoCoachingConfig';
import { useAutoCoaching } from '../hooks/useAutoCoaching';
import { cleanupOldLogs } from '../services/autoCoachingService';
import {
  markPresentService,
  approveAttendanceService
} from '../services/attendanceService';
import {
  startBreakService,
  endBreakService,
  approveBreakService
} from '../services/breakService';
import {
  postCoachingLogService,
  deleteCoachingLogService
} from '../services/coachingService';

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

  // Core state
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

  // Auto-coaching hook
  const autoCoaching = useAutoCoaching(db);

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
      setCoachingLogs(Array.isArray(loadedCoaching) ? loadedCoaching : []);
      setInfractions(Array.isArray(loadedInfractions) ? loadedInfractions : []);
      setMemos(Array.isArray(loadedMemos) ? loadedMemos : []);
      setFeed(Array.isArray(loadedFeed) ? loadedFeed : []);
      setMedia(Array.isArray(loadedMedia) ? loadedMedia : []);
      setSnitchMessages(Array.isArray(loadedSnitch) ? loadedSnitch : []);
      setSchedules(loadedSchedules || {});
      setClients(loadedClients || {});
      setClientAssignments(loadedAssignments || {});

      // Load auto-coaching data
      await autoCoaching.loadPendingAutoCoaching();
      await autoCoaching.loadAutoCoachingSetting();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from database');
    }
  };

  // Initialize app
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

        // Clean up old auto-coaching logs
        const result = await cleanupOldLogs(db, AUTO_COACHING_CUTOFF_DATE);
        if (result.success && result.removed > 0) {
          setCoachingLogs(result.logs);
        }
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
    const result = await markPresentService(db, currentUser, addToFeed);
    if (result.success) {
      setAttendance(result.attendance);
      setSuccess(result.message);
    } else {
      setError(result.error);
    }
  };

  const approveAttendance = async (date, employeeId) => {
    const result = await approveAttendanceService(db, date, employeeId);
    if (result.success) {
      setAttendance(result.attendance);
      setSuccess('Attendance approved! ✅');
    } else {
      setError(result.error);
    }
  };

  // Break operations
  const startBreak = async (type, currentUser) => {
    const result = await startBreakService(db, type, currentUser, addToFeed);
    if (result.success) {
      setBreaks(result.breaks);
      return result.breakInfo;
    } else {
      setError(result.error);
      return null;
    }
  };

  const endBreak = async (activeBreak, currentUser) => {
    const result = await endBreakService(db, activeBreak, currentUser, addToFeed);
    if (result.success) {
      setBreaks(result.breaks);
    } else {
      setError(result.error);
    }
  };

  const approveBreak = async (date, employeeId, breakIndex) => {
    const result = await approveBreakService(db, date, employeeId, breakIndex);
    if (result.success) {
      setBreaks(result.breaks);
      setSuccess('Break approved! ✅');
    } else {
      setError(result.error);
    }
  };

  // Coaching operations
  const postCoachingLog = async (employeeId, content, category, currentUser, metadata = {}) => {
    const result = await postCoachingLogService(db, employeeId, content, category, currentUser, metadata, addToFeed);
    if (result.success) {
      setCoachingLogs(result.logs);
      setSuccess('Coaching log posted! ✅');
    } else {
      setError(result.error);
    }
  };

  const deleteCoachingLog = async (logId, currentUser) => {
    const result = await deleteCoachingLogService(db, logId);
    if (result.success) {
      setCoachingLogs(result.logs);
      setSuccess('Coaching log deleted! ✅');
    } else {
      setError(result.error);
    }
  };

  // Wrapper methods for auto-coaching
  const manualTriggerAutoCoaching = async (currentUser) => {
    await autoCoaching.checkAndTriggerAutoCoaching(
      users,
      attendance,
      breaks,
      schedules,
      addToFeed,
      currentUser
    );
    setSuccess('Auto-coaching check completed! ✅');
  };

  const approvePendingCoaching = async (pendingId, currentUser) => {
    try {
      await autoCoaching.approvePendingCoaching(pendingId, postCoachingLog, addToFeed, currentUser);
      setSuccess('Auto-coaching approved! ✅');
    } catch (err) {
      setError('Failed to approve: ' + err.message);
    }
  };

  const rejectPendingCoaching = async (pendingId, currentUser) => {
    try {
      await autoCoaching.rejectPendingCoaching(pendingId, addToFeed, currentUser);
      setSuccess('Auto-coaching rejected! 🚫');
    } catch (err) {
      setError('Failed to reject: ' + err.message);
    }
  };

  // ... (Keep other methods like postInfraction, postMemo, etc. - they can be extracted similarly)
  // For now, I'll include placeholders

  const postInfraction = async (employeeId, ruleCode, additionalNotes, currentUser) => {
    // TODO: Extract to infractionService
    console.log('postInfraction - to be extracted');
  };

  const postMemo = async (title, content, currentUser) => {
    // TODO: Extract to memoService
    console.log('postMemo - to be extracted');
  };

  // Test connection
  const testConnection = async () => {
    try {
      await db.set('test', { working: true });
      const result = await db.get('test');
      alert('Database connection: ' + (result ? 'WORKING ✅' : 'FAILED ❌'));
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

    // Core methods
    markPresent,
    approveAttendance,
    startBreak,
    endBreak,
    approveBreak,
    postCoachingLog,
    deleteCoachingLog,
    postInfraction,
    postMemo,
    addToFeed,
    testConnection,
    loadAllData,

    // Auto-coaching (from hook)
    autoCoachingEnabled: autoCoaching.autoCoachingEnabled,
    setAutoCoachingEnabled: autoCoaching.setAutoCoachingEnabled,
    pendingAutoCoaching: autoCoaching.pendingAutoCoaching,
    manualTriggerAutoCoaching,
    approvePendingCoaching,
    rejectPendingCoaching,
    checkTardiness: autoCoaching.checkTardiness,
    checkOverbreak: autoCoaching.checkOverbreak,
    checkAbsence: autoCoaching.checkAbsence,

    // Constants
    AUTO_COACHING_CUTOFF_DATE,

    // DB instance
    db
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

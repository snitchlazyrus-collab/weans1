import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Users, Coffee, FileText, MessageSquare, Image, Send, Download, CheckCircle, Clock, UserCheck, AlertTriangle, Megaphone, Eye, LogOut, Calendar, TrendingUp } from 'lucide-react';

// Firebase configuration placeholder - YOU WILL REPLACE THIS
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
};

// Simple Firebase Realtime Database wrapper
class FirebaseDB {
  constructor(config) {
    this.baseUrl = config.databaseURL;
    this.initialized = false;
  }

  async get(path) {
    try {
      const response = await fetch(`${this.baseUrl}/${path}.json`);
      return await response.json();
    } catch (e) {
      console.error('Firebase get error:', e);
      return null;
    }
  }

  async set(path, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${path}.json`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (e) {
      console.error('Firebase set error:', e);
      return null;
    }
  }

  async update(path, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${path}.json`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (e) {
      console.error('Firebase update error:', e);
      return null;
    }
  }
}

const db = new FirebaseDB(firebaseConfig);

const WeAnswerDispatch = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
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

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', employeeId: '', name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeBreak, setActiveBreak] = useState(null);
  const [loading, setLoading] = useState(true);

  const signatureRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize admin account and load data
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);

      // Check if admin exists, if not create it
      const existingUsers = await db.get('users');
      if (!existingUsers) {
        const adminUser = {
          Username: {
            password: 'Password12#',
            role: 'admin',
            employeeId: 'ADMIN001',
            name: 'Administrator',
            loginHistory: []
          }
        };
        await db.set('users', adminUser);

      }

      await loadAllData();
      setLoading(false);
    };

    initApp();
  }, []);

const loadAllData = async () => {
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
    loadedClients,          // ADD THIS
    loadedAssignments       // ADD THIS
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
    db.get('clients'),      // ADD THIS
    db.get('client-assignments')  // ADD THIS
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
  setClients(loadedClients || {});              // ADD THIS
  setClientAssignments(loadedAssignments || {}); // ADD THIS
};


  const handleLogin = async () => {
    const userData = await db.get('users');
    if (!userData || !userData[loginForm.username]) {
      setError('Invalid username or password! 🚫');
      return;
    }

    if (user.password !== loginForm.password) {
  setError('Wrong password, try again! 🔐');
  return;
}

if (user.blocked) {
  setError('Account is blocked! Contact admin. 🚫');
  return;
}

    // Check IP restriction for employees
    const today = new Date().toDateString();
    const userIP = 'DESKTOP-' + Math.random().toString(36).substr(2, 9);

    if (user.role !== user.role) {
      const lastLogin = user.loginHistory?.[user.loginHistory.length - 1];
      if (lastLogin && lastLogin.date === today && lastLogin.ip !== userIP) {
        setError('Already logged in from another device today! 🖥️');
        return;
      }
    }

    user.loginHistory = user.loginHistory || [];
    user.loginHistory.push({ date: today, ip: userIP, time: new Date().toLocaleTimeString() });
    userData[loginForm.username] = user;
    await db.set('users', userData);

    setCurrentUser({ username: loginForm.username, ...user });
    setView('home');
    setError('');
    setSuccess('Welcome back! 🎉');
  };

  const handleRegister = async () => {
    if (!registerForm.username || !registerForm.password || !registerForm.employeeId || !registerForm.name) {
      setError('Fill all fields! 📝');
      return;
    }

    const userData = await db.get('users') || {};
    if (userData[registerForm.username]) {
      setError('Username already exists! 👥');
      return;
    }

    userData[registerForm.username] = {
      password: registerForm.password,
      role: 'employee',
      employeeId: registerForm.employeeId,
      name: registerForm.name,
      loginHistory: []
    };

    await db.set('users', userData);
    setSuccess('Account created! Login now! 🎊');
    setError('');
    setRegisterForm({ username: '', password: '', employeeId: '', name: '' });
  };

  const markPresent = async () => {
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
    addToFeed(`${currentUser.name} has arrived! 🎯`, 'attendance');
    setSuccess('Marked present! Waiting for admin approval... ⏳');
  };

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

  const addToFeed = async (message, type) => {
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
  };

  const postCoachingLog = async (employeeId, content, category) => {
  try {
    const logsRef = ref(database, 'coaching-logs');
    const newLogRef = push(logsRef);

    await set(newLogRef, {
      id: Date.now(),
      employeeId,
      content,
      category: category || 'general',
      date: new Date().toISOString(),
      acknowledged: false,
      signature: null,
      comment: ''
    });

    addToFeed(`📋 New coaching log posted for ${employeeId} (${category})`, 'coaching');
  } catch (error) {
    setError('Failed to post coaching log: ' + error.message);
  }
};


  const postInfraction = async (employeeId, ruleCode, additionalNotes) => {
  try {
    const rule = INFRACTION_RULES[ruleCode];
    if (!rule) {
      setError('Invalid infraction rule code!');
      return;
    }

    // Check for repeat offenses
    const existingIrs = await get(ref(database, 'infractions'));
    const employeeInfractions = existingIrs.val()
      ? Object.values(existingIrs.val()).filter(ir =>
          ir.employeeId === employeeId && ir.ruleCode === ruleCode
        )
      : [];

    const occurrenceCount = employeeInfractions.length + 1;

    const irsRef = ref(database, 'infractions');
    const newIrRef = push(irsRef);

    await set(newIrRef, {
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

    addToFeed(`⚠️ Infraction report issued to ${employeeId} (${rule.level} - ${occurrenceCount}${occurrenceCount === 1 ? 'st' : occurrenceCount === 2 ? 'nd' : occurrenceCount === 3 ? 'rd' : 'th'} offense)`, 'infraction');
    setSuccess(`Infraction issued! This is the ${occurrenceCount}${occurrenceCount === 1 ? 'st' : occurrenceCount === 2 ? 'nd' : occurrenceCount === 3 ? 'rd' : 'th'} offense for this rule.`);
  } catch (error) {
    setError('Failed to post infraction: ' + error.message);
  }
};

  const postMemo = async (title, content) => {
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
    addToFeed(`📢 New memo: ${title}`, 'memo');
  };

  const acknowledgeWithSignature = async (type, id, comment, signature) => {
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
  };

  const sendSnitchMessage = async (message) => {
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
  };

  const approveAttendance = async (date, employeeId) => {
    const attendanceData = await db.get('attendance') || {};
    if (attendanceData[date] && attendanceData[date][employeeId]) {
      attendanceData[date][employeeId].approved = true;
      await db.set('attendance', attendanceData);
      setAttendance(attendanceData);
      setSuccess('Attendance approved! ✅');
    }
  };

  const approveBreak = async (date, employeeId, breakIndex) => {
    const breakData = await db.get('breaks') || {};
    if (breakData[date] && breakData[date][employeeId] && breakData[date][employeeId][breakIndex]) {
      breakData[date][employeeId][breakIndex].approved = true;
      await db.set('breaks', breakData);
      setBreaks(breakData);
      setSuccess('Break approved! ✅');
    }
  };

  // Schedule Management
const setUserSchedule = async (employeeId, schedule) => {
  const scheduleData = await db.get('schedules') || {};
  scheduleData[employeeId] = {
    ...schedule,
    updatedBy: currentUser.username,
    updatedAt: new Date().toISOString()
  };
  await db.set('schedules', scheduleData);
  setSchedules(scheduleData);
  addToFeed(`📅 Schedule updated for ${employeeId}`, 'schedule');
  setSuccess('Schedule updated successfully! ✅');
};

// Client Management
const addClient = async (clientName, businessHours) => {
  const clientData = await db.get('clients') || {};
  const clientId = 'CLIENT_' + Date.now();
  clientData[clientId] = {
    name: clientName,
    businessHours: businessHours, // { monday: {start: '08:00', end: '17:00'}, ... }
    createdAt: new Date().toISOString(),
    createdBy: currentUser.username
  };
  await db.set('clients', clientData);
  setClients(clientData);
  addToFeed(`🏢 New client added: ${clientName}`, 'client');
  setSuccess('Client added successfully! ✅');
};

// Assign users to clients
const assignUserToClient = async (employeeId, clientId) => {
  const assignments = await db.get('client-assignments') || {};
  if (!assignments[clientId]) assignments[clientId] = [];
  if (!assignments[clientId].includes(employeeId)) {
    assignments[clientId].push(employeeId);
  }
  await db.set('client-assignments', assignments);
  setClientAssignments(assignments);
  addToFeed(`👤 User ${employeeId} assigned to client`, 'assignment');
  setSuccess('User assigned to client! ✅');
};

// Generate coverage report
const generateCoverageReport = (clientId, date) => {
  const client = clients[clientId];
  const assignments = clientAssignments[clientId] || [];
  const dateStr = new Date(date).toDateString();

  const report = {
    clientName: client?.name,
    date: dateStr,
    businessHours: client?.businessHours,
    coverage: []
  };

  assignments.forEach(empId => {
    const userSchedule = schedules[empId];
    const userAttendance = attendance[dateStr]?.[empId];
    const userBreaks = breaks[dateStr]?.[empId] || [];

    report.coverage.push({
      employeeId: empId,
      scheduled: userSchedule,
      attended: userAttendance,
      breaks: userBreaks,
      adherence: calculateAdherence(userSchedule, userAttendance, userBreaks)
    });
  });

  return report;
};

const calculateAdherence = (schedule, attendance, breaks) => {
  if (!schedule || !attendance) return 0;
  // Add logic to calculate schedule adherence percentage
  return 100; // Placeholder
};

  // Signature pad functions
  const startDrawing = (e) => {
    if (!signatureRef.current) return;
    setIsDrawing(true);
    const rect = signatureRef.current.getBoundingClientRect();
    const ctx = signatureRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing || !signatureRef.current) return;
    const rect = signatureRef.current.getBoundingClientRect();
    const ctx = signatureRef.current.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!signatureRef.current) return;
    const ctx = signatureRef.current.getContext('2d');
    ctx.clearRect(0, 0, signatureRef.current.width, signatureRef.current.height);
  };

  const getSignature = () => {
    return signatureRef.current ? signatureRef.current.toDataURL() : null;
  };



  const setUserSchedule = async (employeeId, schedule) => {
  try {
    await update(ref(database, `schedules/${employeeId}`), {
      ...schedule,
      updatedBy: currentUser.username,
      updatedAt: new Date().toISOString()
    });
    addToFeed(`📅 Schedule updated for ${employeeId}`, 'schedule');
    setSuccess('Schedule updated successfully! ✅');
  } catch (error) {
    setError('Failed to update schedule: ' + error.message);
  }
};

const updateClient = async (clientId, clientName, businessHours) => {
  try {
    await update(ref(database, `clients/${clientId}`), {
      name: clientName,
      businessHours: businessHours,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.username
    });
    setSuccess('Client updated successfully! ✅');
  } catch (error) {
    setError('Failed to update client: ' + error.message);
  }
};

const deleteClient = async (clientId) => {
  if (!window.confirm('Are you sure you want to delete this client?')) return;
  try {
    await set(ref(database, `clients/${clientId}`), null);
    await set(ref(database, `client-assignments/${clientId}`), null);
    setSuccess('Client deleted successfully! ✅');
  } catch (error) {
    setError('Failed to delete client: ' + error.message);
  }
};

const assignUserToClient = async (employeeId, clientId) => {
  try {
    const assignRef = ref(database, `client-assignments/${clientId}`);
    const snapshot = await get(assignRef);
    const assignments = snapshot.val() || [];

    if (!assignments.includes(employeeId)) {
      assignments.push(employeeId);
      await set(assignRef, assignments);
      addToFeed(`👤 User ${employeeId} assigned to client`, 'assignment');
      setSuccess('User assigned to client! ✅');
    }
  } catch (error) {
    setError('Failed to assign user: ' + error.message);
  }
};

const removeUserFromClient = async (employeeId, clientId) => {
  try {
    const assignRef = ref(database, `client-assignments/${clientId}`);
    const snapshot = await get(assignRef);
    const assignments = snapshot.val() || [];

    const filtered = assignments.filter(id => id !== employeeId);
    await set(assignRef, filtered);
    setSuccess('User removed from client! ✅');
  } catch (error) {
    setError('Failed to remove user: ' + error.message);
  }
};

const blockUser = async (username) => {
  if (!window.confirm(`Block user ${username}?`)) return;
  try {
    await update(ref(database, `users/${username}`), { blocked: true });
    setSuccess('User blocked! 🚫');
  } catch (error) {
    setError('Failed to block user: ' + error.message);
  }
};

const unblockUser = async (username) => {
  try {
    await update(ref(database, `users/${username}`), { blocked: false });
    setSuccess('User unblocked! ✅');
  } catch (error) {
    setError('Failed to unblock user: ' + error.message);
  }
};

const deleteUser = async (username) => {
  if (!window.confirm(`Delete user ${username}? This cannot be undone!`)) return;
  try {
    await set(ref(database, `users/${username}`), null);
    setSuccess('User deleted! 🗑️');
  } catch (error) {
    setError('Failed to delete user: ' + error.message);
  }
};

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

  // Export functions
  const exportAttendanceCSV = () => {
    let csv = 'Date,Employee ID,Name,Status,Time,Approved\n';
    Object.entries(attendance).forEach(([date, records]) => {
      Object.entries(records).forEach(([empId, record]) => {
        csv += `${date},${empId},${record.name},${record.status},${record.time},${record.approved}\n`;
      });
    });
    downloadFile(csv, 'attendance.csv', 'text/csv');
  };

  const exportBreaksCSV = () => {
    let csv = 'Date,Employee ID,Name,Break Type,Start,End,Duration (min),Approved\n';
    Object.entries(breaks).forEach(([date, records]) => {
      Object.entries(records).forEach(([empId, breakList]) => {
        breakList.forEach(b => {
          const duration = b.end ? ((new Date(b.end) - new Date(b.start)) / 60000).toFixed(2) : 'Ongoing';
          csv += `${date},${empId},${b.name},${b.type},${new Date(b.start).toLocaleTimeString()},${b.end ? new Date(b.end).toLocaleTimeString() : 'N/A'},${duration},${b.approved}\n`;
        });
      });
    });
    downloadFile(csv, 'breaks.csv', 'text/csv');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Loading WeAnswer Dispatch...</h2>
          <p className="text-gray-600 mt-2">Connecting to Firebase 🚀</p>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              WeAnswer Dispatch 🚀
            </h1>
            <p className="text-gray-600">Maximum Chaos, Maximum Productivity</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 border rounded mb-3"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border rounded mb-3"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
            />
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded font-bold hover:shadow-lg transition"
            >
              Let's Go! 🎯
            </button>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold mb-4">Register</h2>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 border rounded mb-3"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border rounded mb-3"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
            />
            <input
              type="text"
              placeholder="Employee ID"
              className="w-full p-3 border rounded mb-3"
              value={registerForm.employeeId}
              onChange={(e) => setRegisterForm({...registerForm, employeeId: e.target.value})}
            />
            <input
              type="text"
              placeholder="Full Name"
              className="w-full p-3 border rounded mb-3"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
            />
            <button
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white p-3 rounded font-bold hover:shadow-lg transition"
            >
              Join the Team! 🎊
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">WeAnswer Dispatch 🚀</h1>
          <div className="flex items-center gap-4">
            <span className="font-semibold">{currentUser.name} ({currentUser.role})</span>
            <button
              onClick={() => {
                setCurrentUser(null);
                setView('login');
              }}
              className="bg-white text-purple-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition flex items-center gap-2"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-6 flex-wrap">
          <button onClick={() => setView('home')} className="bg-purple-500 text-white px-4 py-2 rounded font-bold hover:bg-purple-600 transition">
            🏠 Home Feed
          </button>
          <button onClick={() => setView('attendance')} className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition">
            📅 Attendance
          </button>
          <button onClick={() => setView('breaks')} className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 transition">
            ☕ Breaks
          </button>
          {currentUser.role === 'admin' && (
            <>
              <button onClick={() => setView('coaching')} className="bg-yellow-500 text-white px-4 py-2 rounded font-bold hover:bg-yellow-600 transition">
                📋 Coaching
              </button>
              <button onClick={() => setView('infractions')} className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition">
                ⚠️ Infractions
              </button>
              <button onClick={() => setView('memos')} className="bg-indigo-500 text-white px-4 py-2 rounded font-bold hover:bg-indigo-600 transition">
                📢 Memos
              </button>

              <button onClick={() => setView('snitch')} className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition">
                🤫 Snitch Line
              </button>
              <button onClick={() => setView('clients')} className="bg-teal-500 text-white px-4 py-2 rounded font-bold hover:bg-teal-600 transition">
  🏢 Clients
</button>
<button onClick={() => setView('users')} className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600 transition">
  👥 Manage Users
</button>
              <button onClick={() => setView('schedules')} className="bg-cyan-500 text-white px-4 py-2 rounded font-bold hover:bg-cyan-600 transition">
                📅 Schedules
              </button>
            </>
          )}
          {currentUser.role !== 'admin' && (
            <>
              <button onClick={() => setView('my-docs')} className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600 transition">
                📄 My Documents
              </button>
              <button onClick={() => setView('snitch')} className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition">
                🤫 Report Issue
              </button>
            </>
          )}
          <button onClick={() => setView('media')} className="bg-pink-500 text-white px-4 py-2 rounded font-bold hover:bg-pink-600 transition">
            📸 Team Gallery
          </button>
        </div>

        {/* Home view with simplified content */}
        {view === 'home' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-3xl font-bold mb-4">🎉 Welcome to WeAnswer Dispatch!</h2>
            <p className="text-lg mb-6">Maximum Chaos, Maximum Productivity! Use the menu above to navigate. 🚀</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <button onClick={markPresent} className="bg-green-500 text-white p-4 rounded-lg font-bold hover:bg-green-600">
                ✅ Mark Present
              </button>
              <button onClick={() => setView('breaks')} className="bg-purple-500 text-white p-4 rounded-lg font-bold hover:bg-purple-600">
                ☕ Take Break
              </button>
              <button onClick={() => setView('attendance')} className="bg-blue-500 text-white p-4 rounded-lg font-bold hover:bg-blue-600">
                📅 View Attendance
              </button>
              <button onClick={() => setView('media')} className="bg-pink-500 text-white p-4 rounded-lg font-bold hover:bg-pink-600">
                📸 Team Gallery
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xl font-bold mb-3">Recent Activity 📣</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {feed.slice(0, 10).map(item => (
                  <div key={item.id} className="p-3 bg-white rounded border-l-4 border-purple-500">
                    <p className="font-semibold">{item.message}</p>
                    <p className="text-sm text-gray-600">{item.author} • {new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                ))}
                {feed.length === 0 && <p className="text-gray-500 text-center py-4">No activity yet!</p>}
              </div>
            </div>
          </div>
        )}
 {view === 'attendance' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📅 Attendance Management</h2>
              {currentUser.role === 'admin' && (
                <button
                  onClick={exportAttendanceCSV}
                  className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition flex items-center gap-2"
                >
                  <Download size={16} /> Export CSV
                </button>
              )}
            </div>

            {currentUser.role !== 'admin' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <button
                  onClick={markPresent}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition"
                >
                  ✅ Mark Present for Today
                </button>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(attendance).reverse().map(([date, records]) => (
                <div key={date} className="border rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3">{date}</h3>
                  <div className="space-y-2">
                    {Object.entries(records).map(([empId, record]) => (
                      <div key={empId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">{record.name} ({empId})</p>
                          <p className="text-sm text-gray-600">Time: {record.time}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {record.approved ? (
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                              ✅ Approved
                            </span>
                          ) : (
                            <>
                              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                ⏳ Pending
                              </span>
                              {currentUser.role === 'admin' && (
                                <button
                                  onClick={() => approveAttendance(date, empId)}
                                  className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600 transition"
                                >
                                  Approve
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(attendance).length === 0 && (
                <p className="text-gray-500 text-center py-8">No attendance records yet. 📝</p>
              )}
            </div>
          </div>
        )}

        {view === 'breaks' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">☕ Break Management</h2>
              {currentUser.role === 'admin' && (
                <button
                  onClick={exportBreaksCSV}
                  className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition flex items-center gap-2"
                >
                  <Download size={16} /> Export CSV
                </button>
              )}
            </div>

            {currentUser.role !== 'admin' && !activeBreak && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => startBreak('break1')}
                  className="bg-blue-500 text-white p-4 rounded-lg font-bold hover:bg-blue-600 transition"
                >
                  ☕ Break 1<br/><span className="text-sm">(15 min)</span>
                </button>
                <button
                  onClick={() => startBreak('break2')}
                  className="bg-purple-500 text-white p-4 rounded-lg font-bold hover:bg-purple-600 transition"
                >
                  ☕ Break 2<br/><span className="text-sm">(15 min)</span>
                </button>
                <button
                  onClick={() => startBreak('lunch')}
                  className="bg-orange-500 text-white p-4 rounded-lg font-bold hover:bg-orange-600 transition"
                >
                  🍕 Lunch<br/><span className="text-sm">(60 min)</span>
                </button>
                <button
                  onClick={() => startBreak('rr')}
                  className="bg-teal-500 text-white p-4 rounded-lg font-bold hover:bg-teal-600 transition"
                >
                  🚽 RR<br/><span className="text-sm">(No limit)</span>
                </button>
              </div>
            )}

            {activeBreak && (
              <div className="mb-6 p-6 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
                <h3 className="text-xl font-bold mb-3">⏱️ Currently on {activeBreak.type.toUpperCase()}</h3>
                <p className="mb-4">Started at: {new Date(activeBreak.start).toLocaleTimeString()}</p>
                <button
                  onClick={endBreak}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition"
                >
                  🔙 End Break
                </button>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(breaks).reverse().map(([date, records]) => (
                <div key={date} className="border rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3">{date}</h3>
                  {Object.entries(records).map(([empId, breakList]) => (
                    <div key={empId} className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">
                        {breakList[0]?.name} ({empId})
                      </h4>
                      <div className="space-y-2">
                        {breakList.map((brk, idx) => {
                          const duration = brk.end ?
                            ((new Date(brk.end) - new Date(brk.start)) / 60000).toFixed(2) :
                            'Ongoing';
                          const limits = { 'break1': 15, 'break2': 15, 'lunch': 60 };
                          const exceeded = brk.end && limits[brk.type] &&
                            ((new Date(brk.end) - new Date(brk.start)) / 60000) > limits[brk.type];

                          return (
                            <div key={idx} className={`p-3 rounded ${exceeded ? 'bg-red-50' : 'bg-gray-50'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold capitalize">{brk.type}</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(brk.start).toLocaleTimeString()} -
                                    {brk.end ? new Date(brk.end).toLocaleTimeString() : 'In Progress'}
                                  </p>
                                  <p className="text-sm">Duration: {duration} min {exceeded && '⚠️ EXCEEDED'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {brk.approved ? (
                                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                                      ✅ Approved
                                    </span>
                                  ) : (
                                    <>
                                      <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                                        ⏳ Pending
                                      </span>
                                      {currentUser.role === 'admin' && (
                                        <button
                                          onClick={() => approveBreak(date, empId, idx)}
                                          className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-green-600"
                                        >
                                          Approve
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {Object.keys(breaks).length === 0 && (
                <p className="text-gray-500 text-center py-8">No break records yet. ☕</p>
              )}
            </div>
          </div>
        )}

        {view === 'coaching' && currentUser.role === 'admin' && (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-2xl font-bold mb-6">📋 Coaching Logs</h2>

    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-bold mb-3">Create New Coaching Log</h3>
      <select
        id="coachingEmpId"
        className="w-full p-2 border rounded mb-2"
      >
        <option value="">Select Employee</option>
        {Object.entries(users).filter(([u, data]) => data.role !== 'admin').map(([username, data]) => (
          <option key={data.employeeId} value={data.employeeId}>
            {data.name} ({data.employeeId})
          </option>
        ))}
      </select>

      <select
        id="coachingCategory"
        className="w-full p-2 border rounded mb-2"
      >
        <option value="">Select Category</option>
        <option value="attendance">Attendance</option>
        <option value="performance">Performance</option>
        <option value="behavior">Behavior</option>
        <option value="company-policy">Company Policy</option>
      </select>

      <textarea
        id="coachingContent"
        placeholder="Coaching log content..."
        className="w-full p-2 border rounded mb-2"
        rows="4"
      />
      <button
        onClick={() => {
          const empId = document.getElementById('coachingEmpId').value;
          const category = document.getElementById('coachingCategory').value;
          const content = document.getElementById('coachingContent').value;
          if (empId && category && content) {
            postCoachingLog(empId, content, category);
            document.getElementById('coachingEmpId').value = '';
            document.getElementById('coachingCategory').value = '';
            document.getElementById('coachingContent').value = '';
          } else {
            setError('Fill all fields!');
          }
        }}
        className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600"
      >
        Post Coaching Log
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-yellow-500 text-white">
            <th className="border p-3 text-left">Employee Name</th>
            <th className="border p-3 text-left">Coaching For</th>
            <th className="border p-3 text-left">Coaching Logs</th>
            <th className="border p-3 text-center">Acknowledged</th>
            <th className="border p-3 text-center">Signed</th>
            <th className="border p-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {coachingLogs.map(log => {
            const employee = Object.values(users).find(u => u.employeeId === log.employeeId);
            const employeeName = employee?.name || log.employeeId;

            return (
              <tr key={log.id} className="hover:bg-yellow-50">
                <td className="border p-3 font-semibold">{employeeName}</td>
                <td className="border p-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    log.category === 'attendance' ? 'bg-blue-100 text-blue-800' :
                    log.category === 'performance' ? 'bg-green-100 text-green-800' :
                    log.category === 'behavior' ? 'bg-orange-100 text-orange-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {log.category ? log.category.replace('-', ' ').toUpperCase() : 'N/A'}
                  </span>
                </td>
                <td className="border p-3">
                  <p className="text-sm">{log.content}</p>
                  {log.comment && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <strong>Employee Comment:</strong> {log.comment}
                    </div>
                  )}
                </td>
                <td className="border p-3 text-center">
                  {log.acknowledged ? (
                    <span className="text-green-600 font-bold text-2xl">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold text-2xl">✗</span>
                  )}
                </td>
                <td className="border p-3 text-center">
                  {log.signature ? (
                    <button
                      onClick={() => {
                        const win = window.open();
                        win.document.write(`<img src="${log.signature}" />`);
                      }}
                      className="text-green-600 font-bold text-2xl hover:text-green-800"
                    >
                      ✓
                    </button>
                  ) : (
                    <span className="text-red-600 font-bold text-2xl">✗</span>
                  )}
                </td>
                <td className="border p-3 text-sm">
                  {new Date(log.date).toLocaleDateString()}<br/>
                  <span className="text-gray-500">{new Date(log.date).toLocaleTimeString()}</span>
                </td>
              </tr>
            );
          })}
          {coachingLogs.length === 0 && (
            <tr>
              <td colSpan="6" className="border p-8 text-center text-gray-500">
                No coaching logs yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
        )}

        {view === 'infractions' && currentUser.role === 'admin' && (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-2xl font-bold mb-6">⚠️ Infraction Reports</h2>

    <div className="mb-6 p-4 bg-red-50 rounded-lg">
      <h3 className="font-bold mb-3">Create New Infraction Report</h3>

      <select
        id="irEmpId"
        className="w-full p-2 border rounded mb-2"
      >
        <option value="">Select Employee</option>
        {Object.entries(users).filter(([u, data]) => data.role !== 'admin').map(([username, data]) => (
          <option key={data.employeeId} value={data.employeeId}>
            {data.name} ({data.employeeId})
          </option>
        ))}
      </select>

      <select id="irRuleCode" className="w-full p-2 border rounded mb-2">
        <option value="">Select Infraction Rule</option>
        {Object.entries(INFRACTION_RULES).map(([code, rule]) => (
          <option key={code} value={code}>
            {rule.rule} - Section {rule.section}: {rule.description.substring(0, 80)}...
          </option>
        ))}
      </select>

      <textarea
        id="irAdditionalNotes"
        placeholder="Additional notes/context (optional)..."
        className="w-full p-2 border rounded mb-2"
        rows="3"
      />

      <button
        onClick={() => {
          const empId = document.getElementById('irEmpId').value;
          const ruleCode = document.getElementById('irRuleCode').value;
          const notes = document.getElementById('irAdditionalNotes').value;

          if (empId && ruleCode) {
            postInfraction(empId, ruleCode, notes);
            document.getElementById('irEmpId').value = '';
            document.getElementById('irRuleCode').value = '';
            document.getElementById('irAdditionalNotes').value = '';
          } else {
            setError('Select employee and rule!');
          }
        }}
        className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600"
      >
        Issue Infraction Report
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-red-500 text-white">
            <th className="border p-2 text-left">Employee</th>
            <th className="border p-2 text-left">Rule</th>
            <th className="border p-2 text-left">Section</th>
            <th className="border p-2 text-left">Description</th>
            <th className="border p-2">Level</th>
            <th className="border p-2">Occurrence</th>
            <th className="border p-2">Ack</th>
            <th className="border p-2">Signed</th>
            <th className="border p-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {infractions.map(ir => {
            const employee = Object.values(users).find(u => u.employeeId === ir.employeeId);
            const employeeName = employee?.name || ir.employeeId;

            return (
              <tr key={ir.id} className={`hover:bg-red-50 ${
                ir.level === 'Serious Infraction' ? 'bg-red-100' :
                ir.level === 'Less Serious Infraction' ? 'bg-orange-50' :
                'bg-yellow-50'
              }`}>
                <td className="border p-2 font-semibold">{employeeName}</td>
                <td className="border p-2 text-sm">{ir.rule}</td>
                <td className="border p-2 text-center font-bold">{ir.section}</td>
                <td className="border p-2 text-sm">
                  {ir.description}
                  {ir.additionalNotes && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <strong>Notes:</strong> {ir.additionalNotes}
                    </div>
                  )}
                  {ir.comment && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <strong>Employee Comment:</strong> {ir.comment}
                    </div>
                  )}
                </td>
                <td className="border p-2 text-center">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    ir.level === 'Serious Infraction' ? 'bg-red-500 text-white' :
                    ir.level === 'Less Serious Infraction' ? 'bg-orange-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {ir.level}
                  </span>
                </td>
                <td className="border p-2 text-center">
                  <span className="font-bold text-lg">
                    {ir.occurrenceCount}{ir.occurrenceCount === 1 ? 'st' : ir.occurrenceCount === 2 ? 'nd' : ir.occurrenceCount === 3 ? 'rd' : 'th'}
                  </span>
                </td>
                <td className="border p-2 text-center">
                  {ir.acknowledged ? (
                    <span className="text-green-600 font-bold text-2xl">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold text-2xl">✗</span>
                  )}
                </td>
                <td className="border p-2 text-center">
                  {ir.signature ? (
                    <button
                      onClick={() => {
                        const win = window.open();
                        win.document.write(`<img src="${ir.signature}" />`);
                      }}
                      className="text-green-600 font-bold text-2xl hover:text-green-800"
                    >
                      ✓
                    </button>
                  ) : (
                    <span className="text-red-600 font-bold text-2xl">✗</span>
                  )}
                </td>
                <td className="border p-2 text-xs">
                  {new Date(ir.date).toLocaleDateString()}<br/>
                  {new Date(ir.date).toLocaleTimeString()}
                </td>
              </tr>
            );
          })}
          {infractions.length === 0 && (
            <tr>
              <td colSpan="9" className="border p-8 text-center text-gray-500">
                No infractions issued yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

        {view === 'memos' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">📢 Company Memos</h2>

            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-bold mb-3">Post New Memo</h3>
              <input
                id="memoTitle"
                type="text"
                placeholder="Memo title..."
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                id="memoContent"
                placeholder="Memo content..."
                className="w-full p-2 border rounded mb-2"
                rows="4"
              />
              <button
                onClick={() => {
                  const title = document.getElementById('memoTitle').value;
                  const content = document.getElementById('memoContent').value;
                  if (title && content) {
                    postMemo(title, content);
                    document.getElementById('memoTitle').value = '';
                    document.getElementById('memoContent').value = '';
                  }
                }}
                className="bg-indigo-500 text-white px-4 py-2 rounded font-bold hover:bg-indigo-600"
              >
                Post Memo
              </button>
            </div>

            <div className="space-y-4">
              {memos.map(memo => (
                <div key={memo.id} className="border rounded-lg p-4 bg-indigo-50">
                  <h3 className="text-lg font-bold mb-2">{memo.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{new Date(memo.date).toLocaleString()}</p>
                  <p className="mb-3">{memo.content}</p>
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Acknowledged by:</p>
                    <div className="space-y-2">
                      {Object.entries(memo.acknowledgedBy).map(([empId, ack]) => (
                        <div key={empId} className="p-2 bg-white rounded flex items-center gap-2">
                          <CheckCircle className="text-green-500" size={16} />
                          <span className="text-sm">{ack.name} - {new Date(ack.date).toLocaleString()}</span>
                        </div>
                      ))}
                      {Object.keys(memo.acknowledgedBy).length === 0 && (
                        <p className="text-sm text-gray-500">No acknowledgments yet</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'my-docs' && currentUser.role !== 'admin' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">📄 My Documents</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4 text-yellow-600">📋 Coaching Logs</h3>
                <div className="space-y-4">
                  {coachingLogs.filter(log => log.employeeId === currentUser.employeeId).map(log => (
                    <div key={log.id} className="border rounded-lg p-4 bg-yellow-50">
                      <p className="text-sm text-gray-600 mb-2">{new Date(log.date).toLocaleString()}</p>
                      <p className="mb-3">{log.content}</p>

                      {!log.acknowledged && (
                        <div className="mt-4 p-4 bg-white rounded">
                          <p className="font-semibold mb-2">Please acknowledge this log:</p>
                          <textarea
                            id={`log-comment-${log.id}`}
                            placeholder="Your comment/explanation..."
                            className="w-full p-2 border rounded mb-2"
                            rows="3"
                          />
                          <p className="font-semibold mb-2">Sign below:</p>
                          <canvas
                            ref={signatureRef}
                            width="400"
                            height="150"
                            className="border rounded mb-2 cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={clearSignature}
                              className="bg-gray-500 text-white px-3 py-1 rounded font-bold hover:bg-gray-600"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const comment = document.getElementById(`log-comment-${log.id}`).value;
                                const signature = getSignature();
                                if (signature && comment) {
                                  acknowledgeWithSignature('coaching', log.id, comment, signature);
                                  clearSignature();
                                }
                              }}
                              className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600"
                            >
                              Submit Acknowledgment
                            </button>
                          </div>
                        </div>
                      )}

                      {log.acknowledged && (
                        <div className="mt-3">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            ✅ Acknowledged
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Infraction Reports</h3>
                <div className="space-y-4">
                  {infractions.filter(ir => ir.employeeId === currentUser.employeeId).map(ir => (
                    <div key={ir.id} className={`border-2 rounded-lg p-4 ${
                      ir.severity === 'severe' ? 'bg-red-100 border-red-500' :
                      ir.severity === 'moderate' ? 'bg-orange-100 border-orange-500' :
                      'bg-yellow-100 border-yellow-500'
                    }`}>
                      <p className="text-sm text-gray-600 mb-2">{new Date(ir.date).toLocaleString()}</p>
                      <span className={`inline-block mb-2 px-2 py-1 rounded text-xs font-bold ${
                        ir.severity === 'severe' ? 'bg-red-500 text-white' :
                        ir.severity === 'moderate' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {ir.severity.toUpperCase()}
                      </span>
                      <p className="mb-3">{ir.content}</p>

                      {!ir.acknowledged && (
                        <div className="mt-4 p-4 bg-white rounded">
                          <p className="font-semibold mb-2">Please acknowledge this infraction:</p>
                          <textarea
                            id={`ir-comment-${ir.id}`}
                            placeholder="Your comment/explanation..."
                            className="w-full p-2 border rounded mb-2"
                            rows="3"
                          />
                          <p className="font-semibold mb-2">Sign below:</p>
                          <canvas
                            ref={signatureRef}
                            width="400"
                            height="150"
                            className="border rounded mb-2 cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={clearSignature}
                              className="bg-gray-500 text-white px-3 py-1 rounded font-bold hover:bg-gray-600"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const comment = document.getElementById(`ir-comment-${ir.id}`).value;
                                const signature = getSignature();
                                if (signature && comment) {
                                  acknowledgeWithSignature('infraction', ir.id, comment, signature);
                                  clearSignature();
                                }
                              }}
                              className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600"
                            >
                              Submit Acknowledgment
                            </button>
                          </div>
                        </div>
                      )}

                      {ir.acknowledged && (
                        <div className="mt-3">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            ✅ Acknowledged
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-indigo-600">📢 Memos</h3>
                <div className="space-y-4">
                  {memos.map(memo => {
                    const acknowledged = memo.acknowledgedBy[currentUser.employeeId];
                    return (
                      <div key={memo.id} className="border rounded-lg p-4 bg-indigo-50">
                        <h4 className="text-lg font-bold mb-2">{memo.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{new Date(memo.date).toLocaleString()}</p>
                        <p className="mb-3">{memo.content}</p>

                        {!acknowledged && (
                          <div className="mt-4 p-4 bg-white rounded">
                            <p className="font-semibold mb-2">Please acknowledge this memo:</p>
                            <p className="font-semibold mb-2">Sign below:</p>
                            <canvas
                              ref={signatureRef}
                              width="400"
                              height="150"
                              className="border rounded mb-2 cursor-crosshair"
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={clearSignature}
                                className="bg-gray-500 text-white px-3 py-1 rounded font-bold hover:bg-gray-600"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => {
                                  const signature = getSignature();
                                  if (signature) {
                                    acknowledgeWithSignature('memo', memo.id, '', signature);
                                    clearSignature();
                                  }
                                }}
                                className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600"
                              >
                                Submit Acknowledgment
                              </button>
                            </div>
                          </div>
                        )}

                        {acknowledged && (
                          <div className="mt-3">
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                              ✅ Acknowledged on {new Date(acknowledged.date).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'snitch' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">🤫 {currentUser.role === 'admin' ? 'Snitch Line Messages' : 'Report Issue Confidentially'}</h2>

            {currentUser.role !== 'admin' && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <p className="mb-3 text-sm text-gray-600">
                  Report issues, concerns, or feedback confidentially to admin. Your Employee ID will be linked but message content is private.
                </p>
                <textarea
                  id="snitchMessage"
                  placeholder="Your confidential message..."
                  className="w-full p-3 border rounded mb-3"
                  rows="5"
                />
                <button
                  onClick={() => {
                    const msg = document.getElementById('snitchMessage').value;
                    if (msg) {
                      sendSnitchMessage(msg);
                      document.getElementById('snitchMessage').value = '';
                    }
                  }}
                  className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-800"
                >
                  Send Confidential Message
                </button>
              </div>
            )}

            {currentUser.role === 'admin' && (
              <div className="space-y-4">
                {snitchMessages.map(msg => (
                  <div key={msg.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold">From: {msg.employeeId}</p>
                        <p className="text-sm text-gray-600">{new Date(msg.date).toLocaleString()}</p>
                      </div>
                      {!msg.read && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
                {snitchMessages.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No messages yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Schedule Management View */}
{view === 'schedules' && currentUser.role === 'admin' && (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-3xl font-bold mb-4">📅 Schedule Management</h2>

    <div className="mb-6">
      <h3 className="text-xl font-bold mb-3">Set User Schedule</h3>
      <select className="w-full p-3 border rounded mb-3" id="schedule-user">
        <option value="">Select Employee</option>
        {Object.entries(users).map(([username, user]) => (
          user.role !== 'admin' && (
            <option key={username} value={user.employeeId}>
              {user.name} ({user.employeeId})
            </option>
          )
        ))}
      </select>

      <div className="grid grid-cols-2 gap-4 mb-3">
        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
          <div key={day} className="border p-3 rounded">
            <h4 className="font-bold capitalize mb-2">{day}</h4>
            <input type="time" className="w-full p-2 border rounded mb-2" placeholder="Start" id={`${day}-start`} />
            <input type="time" className="w-full p-2 border rounded" placeholder="End" id={`${day}-end`} />
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          const empId = document.getElementById('schedule-user').value;
          if (!empId) return setError('Select an employee!');

          const schedule = {};
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
            const start = document.getElementById(`${day}-start`).value;
            const end = document.getElementById(`${day}-end`).value;
            if (start && end) {
              schedule[day] = { start, end };
            }
          });

          setUserSchedule(empId, schedule);
        }}
        className="bg-blue-500 text-white px-6 py-3 rounded font-bold hover:bg-blue-600"
      >
        Save Schedule
      </button>
    </div>

    <div>
      <h3 className="text-xl font-bold mb-3">Current Schedules</h3>
      {Object.entries(schedules).map(([empId, schedule]) => (
        <div key={empId} className="border p-4 rounded mb-3">
          <h4 className="font-bold">{empId}</h4>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.entries(schedule).map(([day, times]) => (
              times.start && (
                <div key={day} className="text-sm">
                  <strong className="capitalize">{day}:</strong> {times.start} - {times.end}
                </div>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* Client Management View */}
{view === 'clients' && currentUser.role === 'admin' && (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-3xl font-bold mb-4">🏢 Client Management</h2>

    <div className="mb-6">
      <h3 className="text-xl font-bold mb-3">Add New Client</h3>
      <input
        type="text"
        placeholder="Client Name"
        className="w-full p-3 border rounded mb-3"
        id="client-name"
      />

      <h4 className="font-bold mb-2">Business Hours</h4>
      <div className="grid grid-cols-2 gap-4 mb-3">
        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
          <div key={day} className="border p-3 rounded">
            <h4 className="font-bold capitalize mb-2">{day}</h4>
            <input type="time" className="w-full p-2 border rounded mb-2" id={`client-${day}-start`} />
            <input type="time" className="w-full p-2 border rounded" id={`client-${day}-end`} />
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          const name = document.getElementById('client-name').value;
          if (!name) return setError('Enter client name!');

          const hours = {};
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
            const start = document.getElementById(`client-${day}-start`).value;
            const end = document.getElementById(`client-${day}-end`).value;
            if (start && end) {
              hours[day] = { start, end };
            }
          });

          addClient(name, hours);
          document.getElementById('client-name').value = '';
        }}
        className="bg-green-500 text-white px-6 py-3 rounded font-bold hover:bg-green-600"
      >
        Add Client
      </button>
    </div>

    <div className="mb-6">
      <h3 className="text-xl font-bold mb-3">Assign Users to Clients</h3>
      <select className="w-full p-3 border rounded mb-3" id="assign-client">
        <option value="">Select Client</option>
        {Object.entries(clients).map(([id, client]) => (
          <option key={id} value={id}>{client.name}</option>
        ))}
      </select>

      <select className="w-full p-3 border rounded mb-3" id="assign-user">
        <option value="">Select Employee</option>
        {Object.entries(users).map(([username, user]) => (
          user.role !== 'admin' && (
            <option key={username} value={user.employeeId}>
              {user.name} ({user.employeeId})
            </option>
          )
        ))}
      </select>

      <button
        onClick={() => {
          const clientId = document.getElementById('assign-client').value;
          const empId = document.getElementById('assign-user').value;
          if (!clientId || !empId) return setError('Select both client and employee!');
          assignUserToClient(empId, clientId);
        }}
        className="bg-purple-500 text-white px-6 py-3 rounded font-bold hover:bg-purple-600"
      >
        Assign User
      </button>
    </div>

    <div>
      <h3 className="text-xl font-bold mb-3">Coverage Report</h3>
      <select className="w-full p-3 border rounded mb-3" id="report-client">
        <option value="">Select Client</option>
        {Object.entries(clients).map(([id, client]) => (
          <option key={id} value={id}>{client.name}</option>
        ))}
      </select>

      <input type="date" className="w-full p-3 border rounded mb-3" id="report-date" />

      <button
        onClick={() => {
          const clientId = document.getElementById('report-client').value;
          const date = document.getElementById('report-date').value;
          if (!clientId || !date) return setError('Select client and date!');

          const report = generateCoverageReport(clientId, date);
          console.log('Coverage Report:', report);
          // You can display this in a modal or download as CSV
          alert(JSON.stringify(report, null, 2));
        }}
        className="bg-indigo-500 text-white px-6 py-3 rounded font-bold hover:bg-indigo-600"
      >
        Generate Report
      </button>
    </div>
  </div>
)}

        {view === 'media' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">📸 Team Gallery - Meme Central! 🎉</h2>

            <div className="mb-6 p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg">
              <p className="mb-3 font-semibold">Share team pics, memes, and moments!</p>
              <input
                id="mediaCaption"
                type="text"
                placeholder="Caption this masterpiece..."
                className="w-full p-2 border rounded mb-2"
              />
              <input
                id="mediaUrl"
                type="text"
                placeholder="Image URL (or paste a meme link!)"
                className="w-full p-2 border rounded mb-2"
              />
              <button
                onClick={async () => {
                  const caption = document.getElementById('mediaCaption').value;
                  const url = document.getElementById('mediaUrl').value;
                  if (caption && url) {
                    const mediaData = await storage.get('media', true) || [];
                    mediaData.unshift({
                      id: Date.now(),
                      caption,
                      url,
                      uploadedBy: currentUser.name,
                      employeeId: currentUser.employeeId,
                      date: new Date().toISOString(),
                      reactions: {}
                    });
                    if (mediaData.length > 50) mediaData.pop();
                    await storage.set('media', mediaData, true);
                    setMedia(mediaData);
                    document.getElementById('mediaCaption').value = '';
                    document.getElementById('mediaUrl').value = '';
                    addToFeed(`${currentUser.name} posted a new pic! 📸`, 'media');
                  }
                }}
                className="bg-pink-500 text-white px-4 py-2 rounded font-bold hover:bg-pink-600"
              >
                Upload! 🚀
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map(item => (
                <div key={item.id} className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                  <img src={item.url} alt={item.caption} className="w-full h-48 object-cover" onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage Error%3C/text%3E%3C/svg%3E'} />
                  <div className="p-3">
                    <p className="font-semibold mb-1">{item.caption}</p>
                    <p className="text-xs text-gray-600 mb-2">
                      By {item.uploadedBy} • {new Date(item.date).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      {['🔥', '😂', '❤️', '👍', '🎉'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={async () => {
                            const mediaData = await storage.get('media', true) || [];
                            const mediaItem = mediaData.find(m => m.id === item.id);
                            if (mediaItem) {
                              if (!mediaItem.reactions) mediaItem.reactions = {};
                              if (!mediaItem.reactions[emoji]) mediaItem.reactions[emoji] = 0;
                              mediaItem.reactions[emoji]++;
                              await storage.set('media', mediaData, true);
                              setMedia(mediaData);
                            }
                          }}
                          className="text-lg hover:scale-125 transition"
                        >
                          {emoji} {item.reactions?.[emoji] || 0}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {media.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p className="text-xl mb-2">📸</p>
                  <p>No pics yet! Be the first to share!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeAnswerDispatch;

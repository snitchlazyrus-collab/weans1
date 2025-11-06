import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Coffee, Users, FileText, MessageSquare, Bell, LogOut, AlertCircle, CheckCircle, PenTool, Upload, Download, Eye, EyeOff, Settings as SettingsIcon, Briefcase, RefreshCw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, push } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9GZpht238xYbHcCFmnKfQ1HaUwaQxOwM",
  authDomain: "weanswer-dispatch.firebaseapp.com",
  databaseURL: "https://weanswer-dispatch-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "weanswer-dispatch",
  storageBucket: "weanswer-dispatch.firebasestorage.app",
  messagingSenderId: "509546745607",
  appId: "1:509546745607:web:31feb514cb746c5d3b3fa2",
  measurementId: "G-3C2E9916KM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const WeAnswerApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [breakRecords, setBreakRecords] = useState([]);
  const [coachingLogs, setCoachingLogs] = useState([]);
  const [infractions, setInfractions] = useState([]);
  const [memos, setMemos] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [snitchMessages, setSnitchMessages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [scheduleChangeRequests, setScheduleChangeRequests] = useState([]);
  const [settings, setSettings] = useState({ mobileAccessEnabled: true });
  
  // Login state
  const [loginForm, setLoginForm] = useState({ username: '', password: '', showPassword: false });
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    password: '', 
    employeeId: '', 
    name: '',
    showPassword: false 
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Form states
  const [newPost, setNewPost] = useState('');
  const [newMemo, setNewMemo] = useState({ title: '', content: '' });
  const [newCoachingLog, setNewCoachingLog] = useState({ employeeId: '', title: '', content: '' });
  const [newInfraction, setNewInfraction] = useState({ employeeId: '', title: '', content: '' });
  const [newSchedule, setNewSchedule] = useState({ employeeId: '', date: '', shift: '', clientId: '' });
  const [newClient, setNewClient] = useState({ 
    name: '', 
    businessHours: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: false },
      sunday: { start: '09:00', end: '17:00', enabled: false }
    }
  });
  const [newScheduleRequest, setNewScheduleRequest] = useState({
    currentDate: '',
    requestedDate: '',
    reason: '',
    clientId: ''
  });

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load from Firebase
      const dbRef = ref(database);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUsers(data.users || [{ 
          username: 'Username', 
          password: 'Password12#', 
          isAdmin: true, 
          employeeId: 'ADMIN001',
          name: 'Administrator',
          ip: null
        }]);
        setAttendance(data.attendance || []);
        setBreakRecords(data.breaks || []);
        setCoachingLogs(data.coachingLogs || []);
        setInfractions(data.infractions || []);
        setMemos(data.memos || []);
        setFeedPosts(data.feedPosts || []);
        setNotifications(data.notifications || []);
        setSnitchMessages(data.snitchMessages || []);
        setSchedules(data.schedules || []);
        setClients(data.clients || []);
        setScheduleChangeRequests(data.scheduleChangeRequests || []);
        setSettings(data.settings || { mobileAccessEnabled: true });
      } else {
        // Initialize with default admin
        const defaultUsers = [{ 
          username: 'Username', 
          password: 'Password12#', 
          isAdmin: true, 
          employeeId: 'ADMIN001',
          name: 'Administrator',
          ip: null
        }];
        setUsers(defaultUsers);
        await set(ref(database, 'users'), defaultUsers);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await set(ref(database), {
        users,
        attendance,
        breaks: breakRecords,
        coachingLogs,
        infractions,
        memos,
        feedPosts,
        notifications,
        snitchMessages,
        schedules,
        clients,
        scheduleChangeRequests,
        settings
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      saveData();
    }
  }, [users, attendance, breakRecords, coachingLogs, infractions, memos, feedPosts, notifications, snitchMessages, schedules, clients, scheduleChangeRequests, settings]);

  // Simulate IP detection
  const getDeviceIP = () => {
    return `192.168.1.${Math.floor(Math.random() * 255)}`;
  };

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleLogin = () => {
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    
    if (!user) {
      alert('Invalid credentials');
      return;
    }

    if (!settings.mobileAccessEnabled && isMobileDevice() && !user.isAdmin) {
      alert('Mobile access is currently disabled. Please use a desktop computer to login.');
      return;
    }

    const deviceIP = getDeviceIP();
    const today = new Date().toDateString();
    const existingLogin = attendance.find(a => a.employeeId === user.employeeId && a.date === today);

    if (existingLogin && existingLogin.ip !== deviceIP && !user.isAdmin) {
      alert('You are already logged in from another device today.');
      return;
    }

    setCurrentUser(user);
    setLoginForm({ username: '', password: '', showPassword: false });
    addNotification(`${user.name} has logged in`, 'info');
  };

  const handleRegister = () => {
    if (!registerForm.username || !registerForm.password || !registerForm.employeeId || !registerForm.name) {
      alert('Please fill all fields');
      return;
    }

    if (users.find(u => u.username === registerForm.username)) {
      alert('Username already exists');
      return;
    }

    if (users.find(u => u.employeeId === registerForm.employeeId)) {
      alert('Employee ID already registered');
      return;
    }

    const newUser = {
      username: registerForm.username,
      password: registerForm.password,
      employeeId: registerForm.employeeId,
      name: registerForm.name,
      isAdmin: false,
      ip: null
    };

    setUsers([...users, newUser]);
    setRegisterForm({ username: '', password: '', employeeId: '', name: '', showPassword: false });
    setIsRegistering(false);
    alert('Registration successful! Please login.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('feed');
  };

  const addNotification = (message, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotif, ...notifications]);
  };

  const markPresent = () => {
    const today = new Date().toDateString();
    const deviceIP = getDeviceIP();
    const existing = attendance.find(a => a.employeeId === currentUser.employeeId && a.date === today);

    if (existing) {
      alert('Already marked present today');
      return;
    }

    const newAttendance = {
      id: Date.now(),
      employeeId: currentUser.employeeId,
      name: currentUser.name,
      date: today,
      time: new Date().toLocaleTimeString(),
      status: 'Present',
      ip: deviceIP,
      approved: false
    };

    setAttendance([...attendance, newAttendance]);
    addFeedPost(`${currentUser.name} marked present`);
    addNotification(`${currentUser.name} marked present`, 'success');
  };

  const startBreak = (breakType) => {
    const activeBreak = breakRecords.find(b => 
      b.employeeId === currentUser.employeeId && 
      b.breakType === breakType && 
      !b.endTime
    );

    if (activeBreak) {
      alert(`${breakType} already in progress`);
      return;
    }

    const newBreak = {
      id: Date.now(),
      employeeId: currentUser.employeeId,
      name: currentUser.name,
      breakType,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      exceeded: false
    };

    setBreakRecords([...breakRecords, newBreak]);
    addFeedPost(`${currentUser.name} started ${breakType}`);
    
    const limits = { 'Break 1': 15, 'Break 2': 15, 'Lunch': 60, 'RR': null };
    if (limits[breakType]) {
      setTimeout(() => checkBreakOvertime(newBreak.id, limits[breakType]), limits[breakType] * 60 * 1000);
    }
  };

  const endBreak = (breakType) => {
    const activeBreak = breakRecords.find(b => 
      b.employeeId === currentUser.employeeId && 
      b.breakType === breakType && 
      !b.endTime
    );

    if (!activeBreak) {
      alert(`No active ${breakType}`);
      return;
    }

    const endTime = new Date();
    const startTime = new Date(activeBreak.startTime);
    const duration = Math.round((endTime - startTime) / 60000);

    const updatedBreaks = breakRecords.map(b => 
      b.id === activeBreak.id 
        ? { ...b, endTime: endTime.toISOString(), duration }
        : b
    );

    setBreakRecords(updatedBreaks);
    addFeedPost(`${currentUser.name} ended ${breakType} (${duration} min)`);
  };

  const checkBreakOvertime = (breakId, limitMinutes) => {
    const breakRecord = breakRecords.find(b => b.id === breakId);
    if (breakRecord && !breakRecord.endTime) {
      const updatedBreaks = breakRecords.map(b => 
        b.id === breakId ? { ...b, exceeded: true } : b
      );
      setBreakRecords(updatedBreaks);
      addNotification(`${breakRecord.name} exceeded ${breakRecord.breakType} limit (${limitMinutes} min)`, 'warning');
    }
  };

  const notifyAbsent = () => {
    addFeedPost(`${currentUser.name} is absent today`, 'absence');
    addNotification(`${currentUser.name} reported absent`, 'warning');
    alert('Admin and team have been notified');
  };

  const notifyLate = () => {
    addFeedPost(`${currentUser.name} will be late today`, 'late');
    addNotification(`${currentUser.name} reported late`, 'warning');
    alert('Admin and team have been notified');
  };

  const addFeedPost = (content, type = 'status') => {
    const post = {
      id: Date.now(),
      content,
      type,
      author: currentUser.name,
      employeeId: currentUser.employeeId,
      timestamp: new Date().toISOString(),
      comments: [],
      reactions: []
    };
    setFeedPosts([post, ...feedPosts]);
  };

  const createMemo = () => {
    if (!newMemo.title || !newMemo.content) {
      alert('Please fill all fields');
      return;
    }

    const memo = {
      id: Date.now(),
      title: newMemo.title,
      content: newMemo.content,
      createdBy: currentUser.name,
      timestamp: new Date().toISOString(),
      acknowledgments: []
    };

    setMemos([memo, ...memos]);
    setNewMemo({ title: '', content: '' });
    addNotification('New memo posted', 'info');
    addFeedPost(`New memo: ${newMemo.title}`, 'memo');
  };

  const acknowledgeMemo = (memoId, signature) => {
    const updatedMemos = memos.map(m => {
      if (m.id === memoId) {
        return {
          ...m,
          acknowledgments: [
            ...m.acknowledgments,
            {
              employeeId: currentUser.employeeId,
              name: currentUser.name,
              signature,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return m;
    });
    setMemos(updatedMemos);
    alert('Memo acknowledged');
  };

  const createCoachingLog = () => {
    if (!newCoachingLog.employeeId || !newCoachingLog.title || !newCoachingLog.content) {
      alert('Please fill all fields');
      return;
    }

    const log = {
      id: Date.now(),
      employeeId: newCoachingLog.employeeId,
      title: newCoachingLog.title,
      content: newCoachingLog.content,
      createdBy: currentUser.name,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      signature: null,
      comments: ''
    };

    setCoachingLogs([log, ...coachingLogs]);
    setNewCoachingLog({ employeeId: '', title: '', content: '' });
    addNotification(`Coaching log created for ${newCoachingLog.employeeId}`, 'info');
  };

  const acknowledgeCoachingLog = (logId, signature, comments) => {
    const updatedLogs = coachingLogs.map(l => {
      if (l.id === logId) {
        return {
          ...l,
          acknowledged: true,
          signature,
          comments,
          acknowledgedAt: new Date().toISOString()
        };
      }
      return l;
    });
    setCoachingLogs(updatedLogs);
    alert('Coaching log acknowledged');
  };

  const createInfraction = () => {
    if (!newInfraction.employeeId || !newInfraction.title || !newInfraction.content) {
      alert('Please fill all fields');
      return;
    }

    const ir = {
      id: Date.now(),
      employeeId: newInfraction.employeeId,
      title: newInfraction.title,
      content: newInfraction.content,
      createdBy: currentUser.name,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      signature: null,
      comments: ''
    };

    setInfractions([ir, ...infractions]);
    setNewInfraction({ employeeId: '', title: '', content: '' });
    addNotification(`Infraction report created for ${newInfraction.employeeId}`, 'warning');
  };

  const sendSnitchMessage = (message) => {
    const newMsg = {
      id: Date.now(),
      from: currentUser.employeeId,
      fromName: currentUser.name,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setSnitchMessages([newMsg, ...snitchMessages]);
    alert('Confidential message sent to admin');
  };

  const addClient = () => {
    if (!newClient.name) {
      alert('Please enter client name');
      return;
    }

    const client = {
      id: Date.now(),
      name: newClient.name,
      businessHours: newClient.businessHours
    };

    setClients([...clients, client]);
    setNewClient({ 
      name: '', 
      businessHours: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '17:00', enabled: false },
        sunday: { start: '09:00', end: '17:00', enabled: false }
      }
    });
    alert('Client added successfully');
  };

  const addSchedule = () => {
    if (!newSchedule.employeeId || !newSchedule.date || !newSchedule.shift || !newSchedule.clientId) {
      alert('Please fill all fields');
      return;
    }

    const schedule = {
      id: Date.now(),
      employeeId: newSchedule.employeeId,
      date: newSchedule.date,
      shift: newSchedule.shift,
      clientId: newSchedule.clientId
    };

    setSchedules([...schedules, schedule]);
    setNewSchedule({ employeeId: '', date: '', shift: '', clientId: '' });
    addNotification('Schedule added', 'info');
  };

  const requestScheduleChange = () => {
    if (!newScheduleRequest.currentDate || !newScheduleRequest.requestedDate || !newScheduleRequest.reason || !newScheduleRequest.clientId) {
      alert('Please fill all fields');
      return;
    }

    const request = {
      id: Date.now(),
      employeeId: currentUser.employeeId,
      employeeName: currentUser.name,
      currentDate: newScheduleRequest.currentDate,
      requestedDate: newScheduleRequest.requestedDate,
      reason: newScheduleRequest.reason,
      clientId: newScheduleRequest.clientId,
      status: 'Pending',
      timestamp: new Date().toISOString()
    };

    setScheduleChangeRequests([...scheduleChangeRequests, request]);
    setNewScheduleRequest({ currentDate: '', requestedDate: '', reason: '', clientId: '' });
    addNotification('Schedule change request submitted', 'info');
    alert('Your schedule change request has been submitted to admin');
  };

  const approveScheduleRequest = (requestId) => {
    const updated = scheduleChangeRequests.map(r => 
      r.id === requestId ? {...r, status: 'Approved', approvedAt: new Date().toISOString()} : r
    );
    setScheduleChangeRequests(updated);
    addNotification('Schedule change request approved', 'success');
  };

  const denyScheduleRequest = (requestId) => {
    const updated = scheduleChangeRequests.map(r => 
      r.id === requestId ? {...r, status: 'Denied', deniedAt: new Date().toISOString()} : r
    );
    setScheduleChangeRequests(updated);
    addNotification('Schedule change request denied', 'info');
  };

  const exportToCSV = (dataType, dateRange) => {
    let data = [];
    let filename = '';

    switch(dataType) {
      case 'attendance':
        data = attendance.map(a => ({
          'Employee ID': a.employeeId,
          'Name': a.name,
          'Date': a.date,
          'Time': a.time,
          'Status': a.status,
          'Approved': a.approved ? 'Yes' : 'No'
        }));
        filename = 'attendance.csv';
        break;
      case 'breaks':
        data = breakRecords.map(b => ({
          'Employee ID': b.employeeId,
          'Name': b.name,
          'Break Type': b.breakType,
          'Start Time': new Date(b.startTime).toLocaleString(),
          'End Time': b.endTime ? new Date(b.endTime).toLocaleString() : 'In Progress',
          'Duration (min)': b.duration || 'N/A',
          'Exceeded': b.exceeded ? 'Yes' : 'No'
        }));
        filename = 'breaks.csv';
        break;
      case 'coaching':
        data = coachingLogs.map(l => ({
          'Employee ID': l.employeeId,
          'Title': l.title,
          'Created By': l.createdBy,
          'Date': new Date(l.timestamp).toLocaleDateString(),
          'Acknowledged': l.acknowledged ? 'Yes' : 'No'
        }));
        filename = 'coaching-logs.csv';
        break;
      case 'infractions':
        data = infractions.map(i => ({
          'Employee ID': i.employeeId,
          'Title': i.title,
          'Created By': i.createdBy,
          'Date': new Date(i.timestamp).toLocaleDateString(),
          'Acknowledged': i.acknowledged ? 'Yes' : 'No'
        }));
        filename = 'infractions.csv';
        break;
      case 'coverage':
        const coverageData = {};
        clients.forEach(client => {
          const clientSchedules = schedules.filter(s => s.clientId === client.id.toString());
          coverageData[client.name] = clientSchedules.length;
        });
        data = Object.entries(coverageData).map(([client, count]) => ({
          'Client': client,
          'Scheduled Shifts': count
        }));
        filename = 'shift-coverage.csv';
        break;
    }

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // Login/Register Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600">WeAnswer Dispatch</h1>
            <p className="text-gray-600 mt-2">Team Management System</p>
          </div>

          {!isRegistering ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Login</h2>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full p-3 border rounded mb-3"
              />
              <div className="relative">
                <input
                  type={loginForm.showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full p-3 border rounded mb-4 pr-10"
                />
                <button
                  onClick={() => setLoginForm({...loginForm, showPassword: !loginForm.showPassword})}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {loginForm.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white p-3 rounded font-semibold hover:bg-indigo-700"
              >
                Login
              </button>
              <button
                onClick={() => setIsRegistering(true)}
                className="w-full mt-3 text-indigo-600 hover:underline"
              >
                New Employee? Register here
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Register</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                className="w-full p-3 border rounded mb-3"
              />
              <input
                type="text"
                placeholder="Employee ID"
                value={registerForm.employeeId}
                onChange={(e) => setRegisterForm({...registerForm, employeeId: e.target.value})}
                className="w-full p-3 border rounded mb-3"
              />
              <input
                type="text"
                placeholder="Username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                className="w-full p-3 border rounded mb-3"
              />
              <div className="relative">
                <input
                  type={registerForm.showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full p-3 border rounded mb-4 pr-10"
                />
                <button
                  onClick={() => setRegisterForm({...registerForm, showPassword: !registerForm.showPassword})}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {registerForm.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-indigo-600 text-white p-3 rounded font-semibold hover:bg-indigo-700"
              >
                Register
              </button>
              <button
                onClick={() => setIsRegistering(false)}
                className="w-full mt-3 text-indigo-600 hover:underline"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">WeAnswer Dispatch</h1>
            <p className="text-sm opacity-90">{currentUser.name} ({currentUser.employeeId})</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="cursor-pointer" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 hover:bg-indigo-700 px-3 py-2 rounded">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto p-4 flex gap-2 flex-wrap">
          <button onClick={markPresent} className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-600">
            <CheckCircle size={18} />
            Check In
          </button>
          <button onClick={notifyLate} className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-yellow-600">
            <Clock size={18} />
            I'm Late
          </button>
          <button onClick={notifyAbsent} className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-600">
            <AlertCircle size={18} />
            I'm Absent
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-

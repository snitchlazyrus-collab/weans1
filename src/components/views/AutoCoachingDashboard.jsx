import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, CheckCircle, Clock, Users, Filter, Search, TrendingUp, Calendar, Ban } from 'lucide-react';

const AutoCoachingDashboard = () => {
  const {
    users,
    coachingLogs,
    pendingAutoCoaching,
    autoCoachingEnabled,
    setAutoCoachingEnabled,
    manualTriggerAutoCoaching,
    approvePendingCoaching,
    rejectPendingCoaching,
    checkTardiness,
    checkOverbreak,
    checkAbsence,
    db,
    loadAllData,
    cleanupOldAutoCoachingLogs,
  AUTO_COACHING_CUTOFF_DATE
  } = useApp();

  const { currentUser } = useAuth();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCoached, setShowCoached] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('violations');

  // Permanently delete a coaching log and mark instances as ignored
  const permanentlyDeleteLog = async (log) => {
    if (!window.confirm('⚠️ PERMANENT DELETE: This log will be deleted and the system will never create it again for these specific incidents. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const logsDataFromDB = await db.get('coaching-logs');
      const logsData = Array.isArray(logsDataFromDB) ? logsDataFromDB : [];
      const ignoredIncidents = await db.get('ignored-coaching-incidents') || {};

      const filtered = logsData.filter(l => l.id !== log.id);

      let incidentDates = [];

      if (log.incidentDates && Array.isArray(log.incidentDates)) {
        console.log('✅ Using stored incident dates from metadata');
        incidentDates = log.incidentDates;
      } else {
        console.log('⚠️ No metadata found, parsing content (old format)');
        const lines = log.content.split('\n');
        lines.forEach(line => {
          const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/g);
          if (dateMatch) {
            incidentDates.push(...dateMatch);
          }

          const dateStringMatch = line.match(/([A-Z][a-z]{2}\s[A-Z][a-z]{2}\s\d{1,2}\s\d{4})/g);
          if (dateStringMatch) {
            dateStringMatch.forEach(dateStr => {
              const dateObj = new Date(dateStr);
              if (!isNaN(dateObj.getTime())) {
                incidentDates.push(dateObj.toISOString().split('T')[0]);
              }
            });
          }
        });
      }

      incidentDates = [...new Set(incidentDates)];

      console.log(`📅 Found ${incidentDates.length} incident dates:`, incidentDates);

      const ignoredKey = `${log.employeeId}_${log.category}`;
      if (!ignoredIncidents[ignoredKey]) {
        ignoredIncidents[ignoredKey] = {
          employeeId: log.employeeId,
          category: log.category,
          dates: [],
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser.name
        };
      }

      incidentDates.forEach(date => {
        if (!ignoredIncidents[ignoredKey].dates.includes(date)) {
          ignoredIncidents[ignoredKey].dates.push(date);
        }
      });

      console.log(`💾 Ignoring ${ignoredIncidents[ignoredKey].dates.length} total dates for ${log.employeeId} (${log.category})`);

      await db.set('coaching-logs', filtered);
      await db.set('ignored-coaching-incidents', ignoredIncidents);
      await loadAllData();

      alert(`✅ Log permanently deleted!\n\n${incidentDates.length} incidents marked as ignored. The system will never create coaching logs for these specific incidents again.`);
    } catch (err) {
      console.error('Error in permanentlyDeleteLog:', err);
      alert('Error deleting log: ' + err.message);
    }
    setLoading(false);
  };

  // Regular delete (will be recreated if violation still exists)
  const deleteSpecificLog = async (logId) => {
    if (!window.confirm('⚠️ TEMPORARY DELETE: This log will be deleted but may be recreated if the violation still exists. For permanent deletion, use the "Permanent Delete" button. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const logsDataFromDB = await db.get('coaching-logs');
      const logsData = Array.isArray(logsDataFromDB) ? logsDataFromDB : [];
      const filtered = logsData.filter(log => log.id !== logId);

      await db.set('coaching-logs', filtered);
      await loadAllData();

      alert('Coaching log deleted successfully!');
    } catch (err) {
      alert('Error deleting log: ' + err.message);
    }
    setLoading(false);
  };

  // Bulk delete old logs by employee
  const bulkDeleteByEmployee = async (employeeId) => {
    if (!window.confirm(`Delete all old auto-coaching logs for this employee?`)) {
      return;
    }

    setLoading(true);
    try {
      const cutoffDate = new Date('2025-11-09');
      const logsDataFromDB = await db.get('coaching-logs');
      const logsData = Array.isArray(logsDataFromDB) ? logsDataFromDB : [];

      const filtered = logsData.filter(log => {
        if (log.employeeId !== employeeId) return true;
        const logDate = new Date(log.date);
        const isAutoCoaching = ['tardiness', 'overbreak', 'absence'].includes(log.category);
        return !isAutoCoaching || logDate >= cutoffDate;
      });

      await db.set('coaching-logs', filtered);
      await loadAllData();

      alert('Employee logs cleaned up successfully!');
    } catch (err) {
      alert('Error cleaning up logs: ' + err.message);
    }
    setLoading(false);
  };

  // View ignored incidents
  const viewIgnoredIncidents = async () => {
    try {
      const ignoredIncidents = await db.get('ignored-coaching-incidents') || {};
      const count = Object.keys(ignoredIncidents).length;

      if (count === 0) {
        alert('No ignored incidents found.');
        return;
      }

      let message = `📋 IGNORED INCIDENTS (${count} records)\n\n`;

      Object.entries(ignoredIncidents).forEach(([key, data]) => {
        const employee = Object.values(users).find(u => u.employeeId === data.employeeId);
        message += `👤 ${employee?.name || data.employeeId}\n`;
        message += `📝 Category: ${data.category}\n`;
        message += `📅 Dates ignored: ${data.dates.length}\n`;
        message += `🗑️ Deleted by: ${data.deletedBy} on ${new Date(data.deletedAt).toLocaleString()}\n\n`;
      });

      alert(message);
    } catch (err) {
      alert('Error viewing ignored incidents: ' + err.message);
    }
  };



  // Clear all ignored incidents
  const clearIgnoredIncidents = async () => {
    if (!window.confirm('⚠️ This will re-enable coaching logs for all previously ignored incidents. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      await db.set('ignored-coaching-incidents', {});
      await loadAllData();
      alert('✅ All ignored incidents cleared! The system will now check these incidents again.');
    } catch (err) {
      alert('Error clearing ignored incidents: ' + err.message);
    }
    setLoading(false);
  };

  // Scan all employees for violations
const scanForViolations = async () => {
  const detectedViolations = [];

  for (const [username, user] of Object.entries(users)) {
    if (user.role === 'employee') {
      const employeeId = user.employeeId;

      const tardiness = await checkTardiness?.(employeeId);
      const overbreak = await checkOverbreak?.(employeeId);
      const absence = await checkAbsence?.(employeeId);

      if (tardiness?.triggered) {
        detectedViolations.push({
          ...tardiness,
          employeeName: user.name,
          username,
          department: user.department || 'N/A'
        });
      }

      if (overbreak?.triggered) {
        detectedViolations.push({
          ...overbreak,
          employeeName: user.name,
          username,
          department: user.department || 'N/A'
        });
      }

      if (absence?.triggered) {
        detectedViolations.push({
          ...absence,
          employeeName: user.name,
          username,
          department: user.department || 'N/A'
        });
      }
    }
  }

  setViolations(detectedViolations);
};

  useEffect(() => {
    scanForViolations();
  }, [users, coachingLogs, pendingAutoCoaching]);

  const handleManualTrigger = async () => {
    setLoading(true);
    await manualTriggerAutoCoaching(currentUser);
    scanForViolations();
    await loadAllData();
    setLoading(false);
  };

  const handleApprove = async (pendingId) => {
  setLoading(true);
  await approvePendingCoaching(pendingId, currentUser);
  await scanForViolations();
  await loadAllData();
  setLoading(false);
};

  const handleReject = async (pendingId) => {
  setLoading(true);
  await rejectPendingCoaching(pendingId, currentUser);
  await scanForViolations();
  await loadAllData();
  setLoading(false);
};
  // Check if employee has recent coaching for this type
  const hasRecentCoaching = (employeeId, type) => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

    return coachingLogs.some(log =>
      log.employeeId === employeeId &&
      log.category === type &&
      new Date(log.date) > daysAgo
    );
  };

  // Filter violations
  const filteredViolations = useMemo(() => {
    return violations.filter(violation => {
      const matchesType = filterType === 'all' || violation.type === filterType;
      const matchesSearch = !searchTerm ||
        violation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmployee = selectedEmployee === 'all' || violation.employeeId === selectedEmployee;

      const hasCoaching = hasRecentCoaching(violation.employeeId, violation.type);
      const matchesCoachingStatus = (showCoached && hasCoaching) || (showPending && !hasCoaching);

      return matchesType && matchesSearch && matchesEmployee && matchesCoachingStatus;
    });
  }, [violations, filterType, searchTerm, selectedEmployee, showCoached, showPending, dateRange]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: filteredViolations.length,
      tardiness: filteredViolations.filter(v => v.type === 'tardiness').length,
      overbreak: filteredViolations.filter(v => v.type === 'overbreak').length,
      absence: filteredViolations.filter(v => v.type === 'absence').length,
      coached: filteredViolations.filter(v => hasRecentCoaching(v.employeeId, v.type)).length,
      pending: filteredViolations.filter(v => !hasRecentCoaching(v.employeeId, v.type)).length,
      pendingApprovals: pendingAutoCoaching?.length || 0
    };
  }, [filteredViolations, dateRange, pendingAutoCoaching]);

  // Get unique employees with violations
  const employeesWithViolations = useMemo(() => {
    const empSet = new Map();
    violations.forEach(v => {
      if (!empSet.has(v.employeeId)) {
        empSet.set(v.employeeId, { id: v.employeeId, name: v.employeeName });
      }
    });
    return Array.from(empSet.values());
  }, [violations]);

  const getViolationIcon = (type) => {
    switch(type) {
      case 'tardiness': return <Clock className="text-yellow-500" size={20} />;
      case 'overbreak': return <AlertCircle className="text-orange-500" size={20} />;
      case 'absence': return <AlertCircle className="text-red-500" size={20} />;
      default: return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getViolationColor = (type) => {
    switch(type) {
      case 'tardiness': return 'bg-yellow-50 border-yellow-200';
      case 'overbreak': return 'bg-orange-50 border-orange-200';
      case 'absence': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityBadge = (violation) => {
    if (violation.type === 'absence' && violation.consecutiveAbsences >= 3) {
      return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-bold">CRITICAL</span>;
    }
    if (violation.count >= 5) {
      return <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full font-bold">HIGH</span>;
    }
    if (violation.count >= 3) {
      return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full font-bold">MEDIUM</span>;
    }
    return <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">LOW</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Auto-Coaching Dashboard</h1>
        <p className="text-gray-600">Monitor, manage, and analyze automated coaching violations</p>
      </div>

      {/* Control Panel */}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 mb-6 border border-blue-100">
  {/* Cutoff Date Notice */}
  <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
    <div className="flex items-center gap-2">
      <Calendar className="text-yellow-600" size={20} />
      <div>
        <p className="font-semibold text-yellow-900">Auto-Coaching Cutoff Date</p>
        <p className="text-sm text-yellow-700">
          Only incidents from <strong>November 15, 2025</strong> onwards are tracked.
          All prior violations have been archived and will not trigger coaching.
        </p>
      </div>
    </div>
  </div>

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${autoCoachingEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Auto-Coaching System</h3>
        <p className="text-sm text-gray-600">
          {autoCoachingEnabled ? '✅ Monitoring active' : '⏸️ Monitoring paused'}
          {pendingAutoCoaching && pendingAutoCoaching.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-bold animate-pulse">
              {pendingAutoCoaching.length} Pending Approval
            </span>
          )}
        </p>
      </div>
      <button
        onClick={() => setAutoCoachingEnabled(!autoCoachingEnabled)}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          autoCoachingEnabled
            ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
        }`}
      >
        {autoCoachingEnabled ? 'Enabled' : 'Disabled'}
      </button>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        onClick={async () => {
          if (window.confirm('🧹 Clean up all auto-coaching logs created before November 15, 2025?')) {
            setLoading(true);
            await cleanupOldAutoCoachingLogs();
            await loadAllData();
            setLoading(false);
            alert('✅ Cleanup complete! Old logs have been removed.');
          }
        }}
        disabled={loading}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg"
      >
        🧹 Clean Old Logs
      </button>
      <button
        onClick={viewIgnoredIncidents}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all shadow-md hover:shadow-lg"
      >
        <Ban size={16} className="inline mr-1" />
        View Ignored
      </button>
      <button
        onClick={clearIgnoredIncidents}
        disabled={loading}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg"
      >
        🔄 Clear Ignored
      </button>
      <button
        onClick={handleManualTrigger}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg"
      >
        {loading ? '⏳ Running...' : '🔄 Run Check'}
      </button>
    </div>
  </div>
</div>

        {/* Enhanced Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <Users className="text-blue-500" size={24} />
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-500" size={24} />
            <div>
              <p className="text-xs text-gray-600">Tardiness</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tardiness}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-orange-500" size={24} />
            <div>
              <p className="text-xs text-gray-600">Over Break</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overbreak}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <p className="text-xs text-gray-600">Absences</p>
              <p className="text-2xl font-bold text-gray-900">{stats.absence}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="text-xs text-gray-600">Coached</p>
              <p className="text-2xl font-bold text-gray-900">{stats.coached}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-purple-500" size={24} />
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        {pendingAutoCoaching && pendingAutoCoaching.length > 0 && (
          <div
            className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 border-yellow-400 animate-pulse"
            onClick={() => setActiveTab('pending')}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-600" size={24} />
              <div>
                <p className="text-xs text-gray-700 font-medium">⚠️ Needs Approval</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-t-lg shadow-lg border-b mb-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('violations')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'violations'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📊 Detected Violations ({filteredViolations.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
              activeTab === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⏳ Pending Approval ({pendingAutoCoaching?.length || 0})
            {pendingAutoCoaching && pendingAutoCoaching.length > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'logs'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📝 Recent Logs
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search size={16} className="inline mr-1" />
              Search Employee
            </label>
            <input
              type="text"
              placeholder="Name or ID..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Violation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Violation Type</label>
            <select
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="tardiness">Tardiness</option>
              <option value="overbreak">Over Break</option>
              <option value="absence">Absence</option>
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
            <select
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="all">All Employees</option>
              {employeesWithViolations.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Time Period
            </label>
            <select
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Status Toggles */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCoached}
              onChange={(e) => setShowCoached(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Coached</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPending}
              onChange={(e) => setShowPending(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Pending</span>
          </label>
        </div>
      </div>



      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
  <div className="bg-white rounded-b-lg shadow-lg">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">
        ⏳ Pending Auto-Coaching Approvals ({pendingAutoCoaching?.length || 0})
      </h2>
      <p className="text-sm text-gray-600 mt-1">
        Review and approve or reject coaching logs before they're issued to employees
      </p>
    </div>

    <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
      {pendingAutoCoaching && pendingAutoCoaching.length > 0 ? (
        pendingAutoCoaching
          .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
          .map((pending) => (
            <div
              key={pending.id}
              className="p-6 hover:bg-gray-50 transition-colors border-l-4 border-yellow-400"
            >
              {/* Employee info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">
                    {pending.employeeName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Employee ID: <strong>{pending.employeeId}</strong>
                  </p>
                </div>

                {/* APPROVAL BUTTONS - MAKE SURE THESE ARE HERE */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(pending.id)}
                    disabled={loading}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(pending.id)}
                    disabled={loading}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            </div>
          ))
      ) : (
        <div className="p-8 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
          <p className="text-lg text-gray-600 font-semibold">No pending approvals</p>
          <p className="text-sm text-gray-500">All auto-coaching logs have been reviewed</p>
        </div>
      )}
    </div>
  </div>
)}

      {/* Violations List Tab */}
      {activeTab === 'violations' && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Detected Violations ({filteredViolations.length})
            </h2>
            {filteredViolations.length > 0 && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setSearchTerm('');
                  setSelectedEmployee('all');
                  setShowCoached(true);
                  setShowPending(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredViolations.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                <p className="text-lg text-gray-600 font-semibold">
                  {violations.length === 0 ? 'No violations detected' : 'No violations match your filters'}
                </p>
                <p className="text-sm text-gray-500">
                  {violations.length === 0 ? 'All employees are in compliance! 🎉' : 'Try adjusting your search criteria'}
                </p>
              </div>
            ) : (
              filteredViolations.map((violation, index) => {
                const hasCoaching = hasRecentCoaching(violation.employeeId, violation.type);

                return (
                  <div
                    key={index}
                    className={`p-4 ${getViolationColor(violation.type)} border-l-4 hover:bg-opacity-75 transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getViolationIcon(violation.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900">
                              {violation.employeeName}
                            </h3>
                            <span className="text-sm text-gray-600">
                              ({violation.employeeId})
                            </span>
                            {getSeverityBadge(violation)}
                            {hasCoaching && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                ✓ Coached
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium capitalize">{violation.type}</span>
                            {' - '}
                            <span className="font-semibold">{violation.count} incidents</span>
                            {' '}in last {dateRange} days
                          </p>

                          {violation.type === 'tardiness' && (
                            <p className="text-sm text-gray-600">
                              ⏱️ Accumulated: <strong>{violation.accumulatedMinutes} minutes</strong>
                            </p>
                          )}

                          {violation.type === 'absence' && violation.consecutiveAbsences >= 3 && (
                            <p className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-1 rounded inline-block">
                              ⚠️ {violation.consecutiveAbsences} consecutive absences - REQUIRES IMMEDIATE ACTION
                            </p>
                          )}

                          <details className="mt-2">
                            <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                              📋 View {violation.incidents.length} incident{violation.incidents.length !== 1 ? 's' : ''}
                            </summary>
                            <ul className="mt-2 text-sm text-gray-600 space-y-1 pl-4 bg-white bg-opacity-50 p-2 rounded">
                              {violation.incidents.map((incident, i) => (
                                <li key={i} className="list-disc">
                                  <strong>{incident.date}</strong>
                                  {violation.type === 'tardiness' && ` - ${incident.minutesLate} min late`}
                                  {violation.type === 'overbreak' && ` - ${incident.type} exceeded by ${incident.exceeded} min`}
                                  {violation.type === 'absence' && ` - ${incident.type}`}
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      </div>

                      <div className="text-right flex flex-col gap-2">
                        {!hasCoaching && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full whitespace-nowrap">
                            ⏳ Pending
                          </span>
                        )}
                        <button
                          onClick={() => bulkDeleteByEmployee(violation.employeeId)}
                          disabled={loading}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          Clean Logs
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Recent Auto-Coaching Logs Tab */}
      {activeTab === 'logs' && (
  <div className="bg-white rounded-lg shadow-lg">
    <div className="p-6 border-b border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">📝 Recent Auto-Coaching Logs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing logs from November 15, 2025 onwards
          </p>
        </div>
        {coachingLogs.filter(log => {
          const isAutoCoaching = ['tardiness', 'overbreak', 'absence'].includes(log.category);
          const logDate = new Date(log.date);
          return isAutoCoaching && logDate >= new Date('2025-11-15');
        }).length > 0 && (
          <button
            onClick={async () => {
              if (!window.confirm('⚠️ DELETE ALL auto-coaching logs from Nov 15 onwards? This cannot be undone!')) {
                return;
              }
              setLoading(true);
              try {
                const logsDataFromDB = await db.get('coaching-logs');
                const logsData = Array.isArray(logsDataFromDB) ? logsDataFromDB : [];

                const filtered = logsData.filter(log => {
                  const isAutoCoaching = ['tardiness', 'overbreak', 'absence'].includes(log.category);
                  if (!isAutoCoaching) return true;

                  const logDate = new Date(log.date);
                  return logDate < new Date('2025-11-15'); // Keep only pre-Nov 15 logs (if any remain)
                });

                await db.set('coaching-logs', filtered);
                await loadAllData();

                alert('All auto-coaching logs deleted successfully!');
              } catch (err) {
                alert('Error deleting logs: ' + err.message);
              }
              setLoading(false);
            }}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-all text-sm font-medium"
          >
            🗑️ Delete All Auto Logs
          </button>
        )}
      </div>
    </div>

    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
      {coachingLogs
        .filter(log => {
          const isAutoCoaching = ['tardiness', 'overbreak', 'absence'].includes(log.category);
          const logDate = new Date(log.date);
          return isAutoCoaching && logDate >= new Date('2025-11-15');
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20)
        .map(log => {
          // ... existing log rendering code ...
        })}

      {coachingLogs.filter(log => {
        const isAutoCoaching = ['tardiness', 'overbreak', 'absence'].includes(log.category);
        const logDate = new Date(log.date);
        return isAutoCoaching && logDate >= new Date('2025-11-15');
      }).length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p className="text-lg">No auto-coaching logs since November 15, 2025</p>
          <p className="text-sm mt-1">Logs will appear here when violations are detected</p>
        </div>
      )}
      </div>
  </div>
)}
</div>
);

};


export default AutoCoachingDashboard;

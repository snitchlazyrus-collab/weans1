import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, CheckCircle, Clock, Users, Filter, Search, TrendingUp, Calendar } from 'lucide-react';

const AutoCoachingDashboard = () => {
  const {
    users,
    coachingLogs,
    autoCoachingEnabled,
    setAutoCoachingEnabled,
    manualTriggerAutoCoaching,
    checkTardiness,
    checkOverbreak,
    checkAbsence,
    db,
    loadAllData
  } = useApp();

  const { currentUser } = useAuth();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCoached, setShowCoached] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // days

  // Clean up old coaching logs (before Nov 9, 2025)
  const cleanupOldLogs = async () => {
    setLoading(true);
    try {
      const cutoffDate = new Date('2025-11-09');
      const logsDataFromDB = await db.get('coaching-logs');
      const logsData = Array.isArray(logsDataFromDB) ? logsDataFromDB : [];

      const toDelete = logsData.filter(log => {
        const logDate = new Date(log.date);
        const isAutoCoaching = ['tardiness', 'overbreak', 'absence'].includes(log.category);
        return isAutoCoaching && logDate < cutoffDate;
      });

      if (toDelete.length === 0) {
        alert('No old auto-coaching logs found to delete.');
        setLoading(false);
        return;
      }

      if (!window.confirm(`This will delete ${toDelete.length} auto-coaching logs created before November 9, 2025. Continue?`)) {
        setLoading(false);
        return;
      }

      const filtered = logsData.filter(log => {
        const logDate = new Date(log.date);
        const isAutoCoaching = ['tardiness', 'overbreak', 'absence'].includes(log.category);
        return !isAutoCoaching || logDate >= cutoffDate;
      });

      await db.set('coaching-logs', filtered);
      await loadAllData();

      alert(`Successfully cleaned up ${toDelete.length} old auto-coaching logs!`);
    } catch (err) {
      alert('Error cleaning up logs: ' + err.message);
    }
    setLoading(false);
  };

  // Manual cleanup - delete specific log
  const deleteSpecificLog = async (logId) => {
    if (!window.confirm('Delete this coaching log? This cannot be undone!')) {
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

  // Scan all employees for violations
  const scanForViolations = () => {
    const detectedViolations = [];

    Object.entries(users).forEach(([username, user]) => {
      if (user.role === 'employee') {
        const employeeId = user.employeeId;

        const tardiness = checkTardiness?.(employeeId);
        const overbreak = checkOverbreak?.(employeeId);
        const absence = checkAbsence?.(employeeId);

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
    });

    setViolations(detectedViolations);
  };

  useEffect(() => {
    scanForViolations();
  }, [users, coachingLogs]);

  const handleManualTrigger = async () => {
    setLoading(true);
    await manualTriggerAutoCoaching(currentUser);
    scanForViolations();
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
      pending: filteredViolations.filter(v => !hasRecentCoaching(v.employeeId, v.type)).length
    };
  }, [filteredViolations, dateRange]);

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${autoCoachingEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Auto-Coaching System</h3>
              <p className="text-sm text-gray-600">
                {autoCoachingEnabled ? '✅ Monitoring active' : '⏸️ Monitoring paused'}
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
              onClick={cleanupOldLogs}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg"
            >
              🗑️ Clean Old Logs
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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

      {/* Violations List */}
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

      {/* Recent Auto-Coaching Logs */}
      <div className="bg-white rounded-lg shadow-lg mt-6">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">📝 Recent Auto-Coaching Logs</h2>
          {coachingLogs.filter(log => ['tardiness', 'overbreak', 'absence'].includes(log.category)).length > 0 && (
            <button
              onClick={async () => {
                if (!window.confirm('⚠️ DELETE ALL auto-coaching logs? This will remove ALL tardiness, overbreak, and absence logs. This cannot be undone!')) {
                  return;
                }
                setLoading(true);
                try {
                  const logsDataFromDB = await db.get('coaching-logs');
                  const logsData = Array.isArray(logsDataFromDB) ? logsDataFromDB : [];

                  // Keep only non-auto-coaching logs
                  const filtered = logsData.filter(log => !['tardiness', 'overbreak', 'absence'].includes(log.category));

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

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {coachingLogs
            .filter(log => ['tardiness', 'overbreak', 'absence'].includes(log.category))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20)
            .map(log => {
              const employee = Object.values(users).find(u => u.employeeId === log.employeeId);
              const logDate = new Date(log.date);
              const isOld = logDate < new Date('2025-11-09');

              return (
                <div key={log.id} className={`p-4 hover:bg-gray-50 transition-colors ${isOld ? 'bg-red-50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {employee?.name || log.employeeId}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize font-medium">
                        {log.category}
                      </span>
                      {log.acknowledged && (
                        <CheckCircle className="text-green-500" size={16} />
                      )}
                      {isOld && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          ⚠️ Pre Nov 9
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {logDate.toLocaleDateString()} {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => deleteSpecificLog(log.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium disabled:opacity-50 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {log.content.split('\n')[0]}
                  </p>
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      View full log content
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap">
                      {log.content}
                    </div>
                  </details>
                </div>
              );
            })}

          {coachingLogs.filter(log => ['tardiness', 'overbreak', 'absence'].includes(log.category)).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">No auto-coaching logs yet</p>
              <p className="text-sm mt-1">Logs will appear here when violations are detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoCoachingDashboard;

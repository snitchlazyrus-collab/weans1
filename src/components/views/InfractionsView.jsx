import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { INFRACTION_RULES } from '../../constants/infractionRules';

const InfractionsView = () => {
  const { users, infractions, postInfraction } = useApp();
  const { currentUser } = useAuth();

  const [empId, setEmpId] = useState('');
  const [ruleCode, setRuleCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const handlePostInfraction = async () => {
    if (!empId || !ruleCode) {
      alert('Please select employee and infraction rule');
      return;
    }

    setIsSubmitting(true);
    try {
      await postInfraction(empId, ruleCode, notes, currentUser);
      setEmpId('');
      setRuleCode('');
      setNotes('');
    } catch (error) {
      alert('Failed to post infraction: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe users check
  const employeeUsers = users && typeof users === 'object'
    ? Object.entries(users).filter(([u, data]) => data?.role !== 'admin')
    : [];

  // Filter out metadata entries
  const ruleEntries = Object.entries(INFRACTION_RULES).filter(
    ([code]) => !['MINOR', 'LESS_SERIOUS', 'SERIOUS'].includes(code)
  );

  // Group rules by level for better organization
  const rulesByLevel = useMemo(() => {
    const grouped = { minor: [], lessSerious: [], serious: [] };
    ruleEntries.forEach(([code, rule]) => {
      if (rule.level === 'Minor Infraction') grouped.minor.push([code, rule]);
      else if (rule.level === 'Less Serious Infraction') grouped.lessSerious.push([code, rule]);
      else grouped.serious.push([code, rule]);
    });
    return grouped;
  }, []);

  // Filter infractions
  const filteredInfractions = useMemo(() => {
    let filtered = [...infractions];

    // Date filter
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === 'week') {
      filtered = filtered.filter(i => new Date(i.date) >= weekAgo);
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(i => new Date(i.date) >= monthAgo);
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(i => {
        if (levelFilter === 'minor') return i.level === 'Minor Infraction';
        if (levelFilter === 'less-serious') return i.level === 'Less Serious Infraction';
        if (levelFilter === 'serious') return i.level === 'Serious Infraction';
        return true;
      });
    }

    // Status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter(i => !i.acknowledged);
    } else if (statusFilter === 'acknowledged') {
      filtered = filtered.filter(i => i.acknowledged);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => {
        const employee = Object.values(users || {}).find(u => u?.employeeId === i.employeeId);
        const employeeName = employee?.name || i.employeeId;
        return (
          employeeName.toLowerCase().includes(term) ||
          i.employeeId.toLowerCase().includes(term) ||
          i.ruleCode.toLowerCase().includes(term) ||
          i.description.toLowerCase().includes(term)
        );
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }, [infractions, dateFilter, levelFilter, statusFilter, searchTerm, users]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredInfractions.length;
    const pending = filteredInfractions.filter(i => !i.acknowledged).length;
    const acknowledged = filteredInfractions.filter(i => i.acknowledged).length;
    const byLevel = {
      minor: filteredInfractions.filter(i => i.level === 'Minor Infraction').length,
      lessSerious: filteredInfractions.filter(i => i.level === 'Less Serious Infraction').length,
      serious: filteredInfractions.filter(i => i.level === 'Serious Infraction').length
    };
    return { total, pending, acknowledged, byLevel };
  }, [filteredInfractions]);

  // Get employee infraction count
  const getEmployeeInfractionCount = (empId) => {
    return infractions.filter(i => i.employeeId === empId).length;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">⚠️ Infractions Management</h2>

      {/* Issue New Infraction Form */}
      <div className="mb-6 p-4 bg-red-50 rounded-lg border-2 border-red-200">
        <h3 className="font-bold mb-3 text-lg">Issue New Infraction</h3>

        <div className="grid md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Employee</label>
            <select
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isSubmitting}
            >
              <option value="">Select Employee</option>
              {employeeUsers.map(([username, data]) => {
                const count = getEmployeeInfractionCount(data.employeeId);
                return (
                  <option key={data.employeeId} value={data.employeeId}>
                    {data.name} ({data.employeeId}) {count > 0 ? `- ${count} infractions` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Infraction Rule</label>
            <select
              value={ruleCode}
              onChange={(e) => setRuleCode(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isSubmitting}
            >
              <option value="">Select Rule</option>
              <optgroup label="⚠️ Minor Infractions">
                {rulesByLevel.minor.map(([code, rule]) => (
                  <option key={code} value={code}>
                    {code} - {rule.description}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔶 Less Serious Infractions">
                {rulesByLevel.lessSerious.map(([code, rule]) => (
                  <option key={code} value={code}>
                    {code} - {rule.description}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔴 Serious Infractions">
                {rulesByLevel.serious.map(([code, rule]) => (
                  <option key={code} value={code}>
                    {code} - {rule.description}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes (optional)..."
          className="w-full p-2 border rounded mb-3"
          rows="3"
          disabled={isSubmitting}
        />

        <button
          onClick={handlePostInfraction}
          disabled={isSubmitting}
          className="bg-red-500 text-white px-6 py-2 rounded font-bold hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Posting...' : 'Issue Infraction'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Minor</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.byLevel.minor}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Less Serious</p>
          <p className="text-2xl font-bold text-orange-600">{stats.byLevel.lessSerious}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Serious</p>
          <p className="text-2xl font-bold text-red-600">{stats.byLevel.serious}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search employee, ID, or rule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Levels</option>
            <option value="minor">Minor Only</option>
            <option value="less-serious">Less Serious Only</option>
            <option value="serious">Serious Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Infractions Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-red-500 text-white">
              <th className="border p-3 text-left">Employee</th>
              <th className="border p-3 text-left">Rule</th>
              <th className="border p-3 text-left">Description</th>
              <th className="border p-3 text-center">Level</th>
              <th className="border p-3 text-center">Occurrence</th>
              <th className="border p-3 text-center">Status</th>
              <th className="border p-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredInfractions.length > 0 ? (
              filteredInfractions.map(infraction => {
                const employee = users && typeof users === 'object'
                  ? Object.values(users).find(u => u?.employeeId === infraction.employeeId)
                  : null;
                const employeeName = employee?.name || infraction.employeeId;

                return (
                  <tr key={infraction.id} className="hover:bg-red-50">
                    <td className="border p-3">
                      <div className="font-semibold">{employeeName}</div>
                      <div className="text-sm text-gray-600">{infraction.employeeId}</div>
                    </td>
                    <td className="border p-3 font-mono text-sm font-bold">{infraction.ruleCode}</td>
                    <td className="border p-3">
                      <p className="text-sm font-semibold">{infraction.description}</p>
                      {infraction.additionalNotes && (
                        <p className="text-xs text-gray-600 mt-1 p-2 bg-gray-100 rounded">
                          <strong>Note:</strong> {infraction.additionalNotes}
                        </p>
                      )}
                      {infraction.comment && (
                        <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                          <strong>Employee Comment:</strong> {infraction.comment}
                        </div>
                      )}
                    </td>
                    <td className="border p-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        infraction.level === 'Minor Infraction' ? 'bg-yellow-100 text-yellow-800' :
                        infraction.level === 'Less Serious Infraction' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {infraction.level === 'Minor Infraction' ? '⚠️ Minor' :
                         infraction.level === 'Less Serious Infraction' ? '🔶 Less Serious' :
                         '🔴 Serious'}
                      </span>
                    </td>
                    <td className="border p-3 text-center">
                      <span className="inline-block px-3 py-2 bg-red-100 rounded-full font-bold text-lg text-red-700">
                        {infraction.occurrenceCount}
                      </span>
                    </td>
                    <td className="border p-3 text-center">
                      {infraction.acknowledged ? (
                        <div className="text-center">
                          <span className="text-green-600 font-bold text-2xl">✓</span>
                          <p className="text-xs text-gray-600 mt-1">Acknowledged</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-red-600 font-bold text-2xl">✗</span>
                          <p className="text-xs text-gray-600 mt-1">Pending</p>
                        </div>
                      )}
                    </td>
                    <td className="border p-3 text-sm">
                      {new Date(infraction.date).toLocaleDateString()}<br/>
                      <span className="text-gray-500">
                        {new Date(infraction.date).toLocaleTimeString()}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="border p-8 text-center text-gray-500">
                  <AlertTriangle className="mx-auto mb-2" size={32} />
                  <p>No infractions found</p>
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InfractionsView;

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

  const employeeUsers = users && typeof users === 'object'
    ? Object.entries(users).filter(([u, data]) => data?.role !== 'admin')
    : [];

  const ruleEntries = Object.entries(INFRACTION_RULES).filter(
    ([code]) => !['MINOR', 'LESS_SERIOUS', 'SERIOUS'].includes(code)
  );

  const rulesByLevel = useMemo(() => {
    const grouped = { minor: [], lessSerious: [], serious: [] };
    ruleEntries.forEach(([code, rule]) => {
      if (rule.level === 'Minor Infraction') grouped.minor.push([code, rule]);
      else if (rule.level === 'Less Serious Infraction') grouped.lessSerious.push([code, rule]);
      else grouped.serious.push([code, rule]);
    });
    return grouped;
  }, []);

  const filteredInfractions = useMemo(() => {
    let filtered = [...infractions];

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === 'week') {
      filtered = filtered.filter(i => new Date(i.date) >= weekAgo);
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(i => new Date(i.date) >= monthAgo);
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(i => {
        if (levelFilter === 'minor') return i.level === 'Minor Infraction';
        if (levelFilter === 'less-serious') return i.level === 'Less Serious Infraction';
        if (levelFilter === 'serious') return i.level === 'Serious Infraction';
        return true;
      });
    }

    if (statusFilter === 'pending') {
      filtered = filtered.filter(i => !i.acknowledged);
    } else if (statusFilter === 'acknowledged') {
      filtered = filtered.filter(i => i.acknowledged);
    }

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

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }, [infractions, dateFilter, levelFilter, statusFilter, searchTerm, users]);

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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
          </select>

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

      {/* Infractions List */}
      <div className="space-y-4">
        {filteredInfractions.length > 0 ? (
          filteredInfractions.map(infraction => {
            const employee = users && typeof users === 'object'
              ? Object.values(users).find(u => u?.employeeId === infraction.employeeId)
              : null;
            const employeeName = employee?.name || infraction.employeeId;

            return (
              <div key={infraction.id} className="border rounded-lg p-4 bg-red-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{employeeName}</h3>
                    <p className="text-sm text-gray-600">{infraction.employeeId}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-2 ${
                      infraction.level === 'Minor Infraction' ? 'bg-yellow-100 text-yellow-800' :
                      infraction.level === 'Less Serious Infraction' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {infraction.level === 'Minor Infraction' ? '⚠️ Minor' :
                       infraction.level === 'Less Serious Infraction' ? '🔶 Less Serious' :
                       '🔴 Serious'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      Occurrence #{infraction.occurrenceCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>{new Date(infraction.date).toLocaleDateString()}</div>
                      <div>{new Date(infraction.date).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-3 p-3 bg-white rounded">
                  <p className="font-mono text-sm font-bold text-red-700 mb-2">{infraction.ruleCode}</p>
                  <p className="font-semibold mb-2">{infraction.description}</p>
                  {infraction.additionalNotes && (
                    <p className="text-sm text-gray-600 p-2 bg-gray-100 rounded mt-2">
                      <strong>Note:</strong> {infraction.additionalNotes}
                    </p>
                  )}
                </div>

                {infraction.comment && (
                  <div className="mb-3 p-3 bg-blue-50 rounded">
                    <strong className="text-sm">Employee Comment:</strong>
                    <p className="text-sm mt-1">{infraction.comment}</p>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Status:</span>
                    {infraction.acknowledged ? (
                      <span className="text-green-600 font-bold">✓ Acknowledged</span>
                    ) : (
                      <span className="text-red-600 font-bold">✗ Pending</span>
                    )}
                  </div>

                  {infraction.signature && (
                    <div className="flex-1">
                      <span className="text-sm font-semibold">Signature:</span>
                      <div className="mt-2 p-2 bg-white rounded border-2 border-green-300">
                        <img
                          src={infraction.signature}
                          alt="Employee signature"
                          className="h-16 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto mb-2 text-gray-400" size={48} />
            <p className="text-gray-500">No infractions found</p>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfractionsView;

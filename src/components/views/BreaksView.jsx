import React, { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { exportBreaksCSV } from '../../utils/exportHelpers';

const BreaksView = ({ activeBreak, setActiveBreak }) => {
  const { breaks, startBreak, endBreak, approveBreak } = useApp();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, exceeded
  const [typeFilter, setTypeFilter] = useState('all'); // all, break1, break2, lunch, rr
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBreaks, setSelectedBreaks] = useState([]);

  const handleStartBreak = async (type) => {
    const breakData = await startBreak(type, currentUser);
    if (breakData) {
      setActiveBreak(breakData);
    }
  };

  const handleEndBreak = async () => {
    await endBreak(activeBreak, currentUser);
    setActiveBreak(null);
  };

  // Flatten and filter breaks
  const flattenedBreaks = useMemo(() => {
    let records = [];
    const limits = { 'break1': 15, 'break2': 15, 'lunch': 60 };

    Object.entries(breaks).forEach(([date, empRecords]) => {
      Object.entries(empRecords).forEach(([empId, breakList]) => {
        breakList.forEach((brk, idx) => {
          const duration = brk.end ?
            ((new Date(brk.end) - new Date(brk.start)) / 60000) : null;
          const exceeded = brk.end && limits[brk.type] && duration > limits[brk.type];

          records.push({
            date,
            empId,
            breakIndex: idx,
            ...brk,
            duration,
            exceeded,
            dateObj: new Date(date)
          });
        });
      });
    });

    // Apply filters
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === 'today') {
      records = records.filter(r => r.date === today);
    } else if (dateFilter === 'week') {
      records = records.filter(r => r.dateObj >= weekAgo);
    } else if (dateFilter === 'month') {
      records = records.filter(r => r.dateObj >= monthAgo);
    }

    if (statusFilter === 'pending') {
      records = records.filter(r => !r.approved);
    } else if (statusFilter === 'approved') {
      records = records.filter(r => r.approved);
    } else if (statusFilter === 'exceeded') {
      records = records.filter(r => r.exceeded);
    }

    if (typeFilter !== 'all') {
      records = records.filter(r => r.type === typeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      records = records.filter(r =>
        r.name?.toLowerCase().includes(term) ||
        r.empId?.toLowerCase().includes(term)
      );
    }

    records.sort((a, b) => b.dateObj - a.dateObj);
    return records;
  }, [breaks, dateFilter, statusFilter, typeFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = flattenedBreaks.length;
    const pending = flattenedBreaks.filter(r => !r.approved).length;
    const approved = flattenedBreaks.filter(r => r.approved).length;
    const exceeded = flattenedBreaks.filter(r => r.exceeded).length;
    return { total, pending, approved, exceeded };
  }, [flattenedBreaks]);

  // Bulk approve
  const handleBulkApprove = async () => {
    if (selectedBreaks.length === 0) return;

    for (const breakKey of selectedBreaks) {
      const [date, empId, idx] = breakKey.split('|');
      await approveBreak(date, empId, parseInt(idx));
    }
    setSelectedBreaks([]);
  };

  const toggleBreak = (date, empId, idx) => {
    const key = `${date}|${empId}|${idx}`;
    setSelectedBreaks(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAllPending = () => {
    const pendingKeys = flattenedBreaks
      .filter(r => !r.approved)
      .map(r => `${r.date}|${r.empId}|${r.breakIndex}`);
    setSelectedBreaks(pendingKeys);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">☕ Break Management</h2>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => exportBreaksCSV(breaks)}
            className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {/* Break Buttons (Employee) */}
      {currentUser.role !== 'admin' && !activeBreak && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleStartBreak('break1')}
            className="bg-blue-500 text-white p-4 rounded-lg font-bold hover:bg-blue-600 transition"
          >
            ☕ Break 1<br/><span className="text-sm">(15 min)</span>
          </button>
          <button
            onClick={() => handleStartBreak('break2')}
            className="bg-purple-500 text-white p-4 rounded-lg font-bold hover:bg-purple-600 transition"
          >
            ☕ Break 2<br/><span className="text-sm">(15 min)</span>
          </button>
          <button
            onClick={() => handleStartBreak('lunch')}
            className="bg-orange-500 text-white p-4 rounded-lg font-bold hover:bg-orange-600 transition"
          >
            🍕 Lunch<br/><span className="text-sm">(60 min)</span>
          </button>
          <button
            onClick={() => handleStartBreak('rr')}
            className="bg-teal-500 text-white p-4 rounded-lg font-bold hover:bg-teal-600 transition"
          >
            🚽 RR<br/><span className="text-sm">(No limit)</span>
          </button>
        </div>
      )}

      {/* Active Break Display */}
      {activeBreak && (
        <div className="mb-6 p-6 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
          <h3 className="text-xl font-bold mb-3">⏱️ Currently on {activeBreak.type.toUpperCase()}</h3>
          <p className="mb-4">Started at: {new Date(activeBreak.start).toLocaleTimeString()}</p>
          <button
            onClick={handleEndBreak}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition"
          >
            🔙 End Break
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Breaks</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Exceeded</p>
          <p className="text-2xl font-bold text-red-600">{stats.exceeded}</p>
        </div>
      </div>

      {/* Filters */}
      {currentUser.role === 'admin' && (
        <div className="mb-6 space-y-3">
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="break1">Break 1</option>
              <option value="break2">Break 2</option>
              <option value="lunch">Lunch</option>
              <option value="rr">RR</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="exceeded">Exceeded</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {stats.pending > 0 && (
            <div className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
              <button
                onClick={selectAllPending}
                className="text-sm text-blue-600 hover:underline"
              >
                Select All Pending ({stats.pending})
              </button>
              {selectedBreaks.length > 0 && (
                <>
                  <span className="text-sm text-gray-500">
                    {selectedBreaks.length} selected
                  </span>
                  <button
                    onClick={handleBulkApprove}
                    className="ml-auto bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 transition"
                  >
                    Approve Selected ({selectedBreaks.length})
                  </button>
                  <button
                    onClick={() => setSelectedBreaks([])}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Breaks Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2">
              {currentUser.role === 'admin' && (
                <th className="p-3 text-left">
                  <input type="checkbox" className="w-4 h-4" disabled />
                </th>
              )}
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-center">Duration</th>
              <th className="p-3 text-center">Status</th>
              {currentUser.role === 'admin' && (
                <th className="p-3 text-center">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {flattenedBreaks.map((brk) => {
              const breakKey = `${brk.date}|${brk.empId}|${brk.breakIndex}`;
              const isSelected = selectedBreaks.includes(breakKey);

              return (
                <tr
                  key={breakKey}
                  className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${brk.exceeded ? 'bg-red-50' : ''}`}
                >
                  {currentUser.role === 'admin' && (
                    <td className="p-3">
                      {!brk.approved && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleBreak(brk.date, brk.empId, brk.breakIndex)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      )}
                    </td>
                  )}
                  <td className="p-3">
                    <div className="font-medium">{brk.date}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{brk.name}</div>
                    <div className="text-sm text-gray-600">{brk.empId}</div>
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-1 rounded text-sm font-semibold capitalize">
                      {brk.type}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {new Date(brk.start).toLocaleTimeString()} -
                    {brk.end ? new Date(brk.end).toLocaleTimeString() : 'In Progress'}
                  </td>
                  <td className="p-3 text-center font-mono">
                    {brk.duration ? `${brk.duration.toFixed(0)} min` : 'Ongoing'}
                    {brk.exceeded && <span className="text-red-600 ml-2">⚠️</span>}
                  </td>
                  <td className="p-3 text-center">
                    {brk.approved ? (
                      <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ✅
                      </span>
                    ) : (
                      <span className="inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ⏳
                      </span>
                    )}
                  </td>
                  {currentUser.role === 'admin' && (
                    <td className="p-3 text-center">
                      {!brk.approved && (
                        <button
                          onClick={() => approveBreak(brk.date, brk.empId, brk.breakIndex)}
                          className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600 transition text-sm"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {flattenedBreaks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No breaks found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreaksView;

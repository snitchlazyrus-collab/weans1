import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { exportAttendanceCSV } from '../../utils/exportHelpers';

const AttendanceView = () => {
  const { attendance, markPresent, approveAttendance, users } = useApp();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [selectedRecords, setSelectedRecords] = useState([]);

  // Get filtered and sorted records
  const filteredRecords = useMemo(() => {
    let records = [];

    // Flatten attendance data
    Object.entries(attendance).forEach(([date, empRecords]) => {
      Object.entries(empRecords).forEach(([empId, record]) => {
        records.push({
          date,
          empId,
          ...record,
          dateObj: new Date(date)
        });
      });
    });

    // Apply date filter
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

    // Apply status filter
    if (statusFilter === 'pending') {
      records = records.filter(r => !r.approved);
    } else if (statusFilter === 'approved') {
      records = records.filter(r => r.approved);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      records = records.filter(r =>
        r.name?.toLowerCase().includes(term) ||
        r.empId?.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    records.sort((a, b) => b.dateObj - a.dateObj);

    return records;
  }, [attendance, dateFilter, statusFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const pending = filteredRecords.filter(r => !r.approved).length;
    const approved = filteredRecords.filter(r => r.approved).length;
    return { total, pending, approved };
  }, [filteredRecords]);

  // Bulk approve
  const handleBulkApprove = async () => {
    if (selectedRecords.length === 0) {
      alert('No records selected');
      return;
    }

    for (const recordKey of selectedRecords) {
      const [date, empId] = recordKey.split('|');
      await approveAttendance(date, empId);
    }
    setSelectedRecords([]);
  };

  // Toggle record selection
  const toggleRecord = (date, empId) => {
    const key = `${date}|${empId}`;
    setSelectedRecords(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Select all pending
  const selectAllPending = () => {
    const pendingKeys = filteredRecords
      .filter(r => !r.approved)
      .map(r => `${r.date}|${r.empId}`);
    setSelectedRecords(pendingKeys);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📅 Attendance Management</h2>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => exportAttendanceCSV(attendance)}
            className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {/* Mark Present Button (Employee) */}
      {currentUser.role !== 'admin' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <button
            onClick={() => markPresent(currentUser)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition"
          >
            ✅ Mark Present for Today
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Records</p>
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
      </div>

      {/* Filters & Search */}
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved Only</option>
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
              {selectedRecords.length > 0 && (
                <>
                  <span className="text-sm text-gray-500">
                    {selectedRecords.length} selected
                  </span>
                  <button
                    onClick={handleBulkApprove}
                    className="ml-auto bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 transition"
                  >
                    Approve Selected ({selectedRecords.length})
                  </button>
                  <button
                    onClick={() => setSelectedRecords([])}
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

      {/* Records Table */}
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
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-center">Status</th>
              {currentUser.role === 'admin' && (
                <th className="p-3 text-center">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => {
              const recordKey = `${record.date}|${record.empId}`;
              const isSelected = selectedRecords.includes(recordKey);

              return (
                <tr
                  key={recordKey}
                  className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  {currentUser.role === 'admin' && (
                    <td className="p-3">
                      {!record.approved && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRecord(record.date, record.empId)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      )}
                    </td>
                  )}
                  <td className="p-3">
                    <div className="font-medium">{record.date}</div>
                    <div className="text-xs text-gray-500">
                      {record.dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{record.name}</div>
                    <div className="text-sm text-gray-600">{record.empId}</div>
                  </td>
                  <td className="p-3 font-mono">{record.time}</td>
                  <td className="p-3 text-center">
                    {record.approved ? (
                      <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ✅ Approved
                      </span>
                    ) : (
                      <span className="inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ⏳ Pending
                      </span>
                    )}
                  </td>
                  {currentUser.role === 'admin' && (
                    <td className="p-3 text-center">
                      {!record.approved && (
                        <button
                          onClick={() => approveAttendance(record.date, record.empId)}
                          className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600 transition"
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

        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No records found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceView;

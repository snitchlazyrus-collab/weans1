import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const SchedulesView = () => {
  const { users, schedules, setUserSchedule, setError } = useApp();
  const { currentUser } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [weekSchedule, setWeekSchedule] = useState({
    monday: { start: '', end: '' },
    tuesday: { start: '', end: '' },
    wednesday: { start: '', end: '' },
    thursday: { start: '', end: '' },
    friday: { start: '', end: '' },
    saturday: { start: '', end: '' },
    sunday: { start: '', end: '' }
  });
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Get non-admin users
  const employees = useMemo(() => {
    return Object.entries(users)
      .filter(([_, user]) => user.role !== 'admin')
      .map(([username, user]) => ({ username, ...user }));
  }, [users]);

  // Filter and search schedules
  const filteredSchedules = useMemo(() => {
    return Object.entries(schedules).filter(([empId, schedule]) => {
      const user = Object.values(users).find(u => u.employeeId === empId);
      if (!user) return false;

      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesSearch = !searchTerm ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empId.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesRole && matchesSearch;
    });
  }, [schedules, users, filterRole, searchTerm]);

  // Load existing schedule when employee is selected
  const handleEmployeeSelect = (empId) => {
    setSelectedEmployee(empId);
    if (empId && schedules[empId]) {
      const existingSchedule = { ...schedules[empId] };
      const newSchedule = {};
      days.forEach(day => {
        newSchedule[day] = existingSchedule[day] || { start: '', end: '' };
      });
      setWeekSchedule(newSchedule);
    } else {
      // Reset to empty schedule
      const emptySchedule = {};
      days.forEach(day => {
        emptySchedule[day] = { start: '', end: '' };
      });
      setWeekSchedule(emptySchedule);
    }
  };

  const handleTimeChange = (day, field, value) => {
    setWeekSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = () => {
    if (!selectedEmployee) {
      setError('Please select an employee!');
      return;
    }

    // Filter out days with incomplete times
    const schedule = {};
    days.forEach(day => {
      const { start, end } = weekSchedule[day];
      if (start && end) {
        if (start >= end) {
          setError(`Invalid time range for ${day}: start time must be before end time`);
          return;
        }
        schedule[day] = { start, end };
      }
    });

    if (Object.keys(schedule).length === 0) {
      setError('Please set at least one day\'s schedule!');
      return;
    }

    setUserSchedule(selectedEmployee, schedule, currentUser);
    setError('Schedule saved successfully!');
  };

  const copySchedule = (day) => {
    const daySchedule = weekSchedule[day];
    if (!daySchedule.start || !daySchedule.end) {
      setError('Please set times for this day first!');
      return;
    }

    const newSchedule = {};
    days.forEach(d => {
      newSchedule[d] = { ...daySchedule };
    });
    setWeekSchedule(newSchedule);
  };

  const clearSchedule = () => {
    const emptySchedule = {};
    days.forEach(day => {
      emptySchedule[day] = { start: '', end: '' };
    });
    setWeekSchedule(emptySchedule);
  };

  // Get unique roles for filtering
  const roles = useMemo(() => {
    const roleSet = new Set();
    Object.values(users).forEach(user => {
      if (user.role !== 'admin') roleSet.add(user.role);
    });
    return Array.from(roleSet);
  }, [users]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-bold mb-6">📅 Schedule Management</h2>

      {/* Schedule Editor */}
      <div className="mb-8 border-b pb-6">
        <h3 className="text-xl font-bold mb-4">Set Employee Schedule</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Employee</label>
          <select
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
            value={selectedEmployee}
            onChange={(e) => handleEmployeeSelect(e.target.value)}
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.name} ({emp.employeeId}) - {emp.role}
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={clearSchedule}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {days.map(day => (
                <div key={day} className="border p-4 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold capitalize">{day}</h4>
                    <button
                      onClick={() => copySchedule(day)}
                      className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                      title="Copy to all days"
                    >
                      Copy All
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="time"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Start"
                      value={weekSchedule[day].start}
                      onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                    />
                    <input
                      type="time"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="End"
                      value={weekSchedule[day].end}
                      onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveSchedule}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition"
            >
              💾 Save Schedule
            </button>
          </>
        )}
      </div>

      {/* Current Schedules View */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Current Schedules</h3>
          <div className="text-sm text-gray-600">
            Total: {filteredSchedules.length} schedule{filteredSchedules.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Role</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedules List */}
        <div className="space-y-4">
          {filteredSchedules.length > 0 ? (
            filteredSchedules.map(([empId, schedule]) => {
              const user = Object.values(users).find(u => u.employeeId === empId);
              const scheduledDays = Object.entries(schedule)
                .filter(([key]) => !['updatedBy', 'updatedAt'].includes(key))
                .filter(([_, times]) => times.start);

              return (
                <div key={empId} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">
                        {user?.name || empId}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ID: {empId} | Role: {user?.role || 'Unknown'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEmployeeSelect(empId)}
                      className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {scheduledDays.map(([day, times]) => (
                      <div key={day} className="text-sm bg-blue-50 p-2 rounded">
                        <div className="font-semibold capitalize text-blue-900">{day}</div>
                        <div className="text-gray-700">{times.start} - {times.end}</div>
                      </div>
                    ))}
                  </div>

                  {scheduledDays.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No schedule set</p>
                  )}

                  {schedule.updatedAt && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                      Last updated by <strong>{schedule.updatedBy}</strong> on{' '}
                      {new Date(schedule.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">
                {Object.keys(schedules).length === 0
                  ? '📋 No schedules set yet. Create your first schedule above!'
                  : '🔍 No schedules match your filters.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulesView;

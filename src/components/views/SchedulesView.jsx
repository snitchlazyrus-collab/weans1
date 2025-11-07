import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const SchedulesView = () => {
  const { users, schedules, setUserSchedule, setError } = useApp();
  const { currentUser } = useAuth();

  const handleSaveSchedule = () => {
    const empId = document.getElementById('schedule-user').value;
    if (!empId) {
      setError('Select an employee!');
      return;
    }

    const schedule = {};
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      const start = document.getElementById(`${day}-start`).value;
      const end = document.getElementById(`${day}-end`).value;
      if (start && end) {
        schedule[day] = { start, end };
      }
    });

    setUserSchedule(empId, schedule, currentUser);
  };

  return (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <div key={day} className="border p-3 rounded">
              <h4 className="font-bold capitalize mb-2">{day}</h4>
              <input 
                type="time" 
                className="w-full p-2 border rounded mb-2" 
                placeholder="Start" 
                id={`${day}-start`} 
              />
              <input 
                type="time" 
                className="w-full p-2 border rounded" 
                placeholder="End" 
                id={`${day}-end`} 
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveSchedule}
          className="bg-blue-500 text-white px-6 py-3 rounded font-bold hover:bg-blue-600"
        >
          Save Schedule
        </button>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-3">Current Schedules</h3>
        <div className="space-y-3">
          {Object.entries(schedules).map(([empId, schedule]) => {
            const user = Object.values(users).find(u => u.employeeId === empId);
            return (
              <div key={empId} className="border p-4 rounded">
                <h4 className="font-bold mb-2">
                  {user?.name || empId} ({empId})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {Object.entries(schedule)
                    .filter(([key]) => !['updatedBy', 'updatedAt'].includes(key))
                    .map(([day, times]) => (
                      times.start && (
                        <div key={day} className="text-sm bg-gray-50 p-2 rounded">
                          <strong className="capitalize">{day}:</strong> {times.start} - {times.end}
                        </div>
                      )
                    ))}
                </div>
                {schedule.updatedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Updated by {schedule.updatedBy} on {new Date(schedule.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
          {Object.keys(schedules).length === 0 && (
            <p className="text-gray-500 text-center py-8">No schedules set yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulesView;

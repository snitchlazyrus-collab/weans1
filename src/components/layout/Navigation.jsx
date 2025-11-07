import React from 'react';

const Navigation = ({ currentUser, onViewChange }) => {
  const adminButtons = [
    { view: 'home', label: '🏠 Home Feed', color: 'purple' },
    { view: 'attendance', label: '📅 Attendance', color: 'blue' },
    { view: 'breaks', label: '☕ Breaks', color: 'green' },
    { view: 'coaching', label: '📋 Coaching', color: 'yellow' },
    { view: 'infractions', label: '⚠️ Infractions', color: 'red' },
    { view: 'memos', label: '📢 Memos', color: 'indigo' },
    { view: 'snitch', label: '🤫 Snitch Line', color: 'gray' },
    { view: 'clients', label: '🏢 Clients', color: 'teal' },
    { view: 'users', label: '👥 Manage Users', color: 'orange' },
    { view: 'schedules', label: '📅 Schedules', color: 'cyan' },
    { view: 'media', label: '📸 Team Gallery', color: 'pink' },
  ];

  const employeeButtons = [
    { view: 'home', label: '🏠 Home Feed', color: 'purple' },
    { view: 'attendance', label: '📅 Attendance', color: 'blue' },
    { view: 'breaks', label: '☕ Breaks', color: 'green' },
    { view: 'my-docs', label: '📄 My Documents', color: 'orange' },
    { view: 'snitch', label: '🤫 Report Issue', color: 'gray' },
    { view: 'media', label: '📸 Team Gallery', color: 'pink' },
  ];

  const buttons = currentUser.role === 'admin' ? adminButtons : employeeButtons;

  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      {buttons.map(({ view, label, color }) => (
        <button
          key={view}
          onClick={() => onViewChange(view)}
          className={`bg-${color}-500 text-white px-4 py-2 rounded font-bold hover:bg-${color}-600 transition`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default Navigation;

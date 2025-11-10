import React from 'react';

const Navigation = ({ currentUser, setView }) => {
  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      <button
        onClick={() => setView('home')}
        className="bg-purple-500 text-white px-4 py-2 rounded font-bold hover:bg-purple-600 transition"
      >
        🏠 Home Feed
      </button>
      <button
        onClick={() => setView('attendance')}
        className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition"
      >
        📅 Attendance
      </button>
      <button
        onClick={() => setView('breaks')}
        className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 transition"
      >
        ☕ Breaks
      </button>

      {currentUser.role === 'admin' && (
        <>
          <button
            onClick={() => setView('coaching')}
            className="bg-yellow-500 text-white px-4 py-2 rounded font-bold hover:bg-yellow-600 transition"
          >
            📋 Coaching
          </button>
          <button
            onClick={() => setView('infractions')}
            className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition"
          >
            ⚠️ Infractions
          </button>
          <button
            onClick={() => setView('memos')}
            className="bg-indigo-500 text-white px-4 py-2 rounded font-bold hover:bg-indigo-600 transition"
          >
            📢 Memos
          </button>
          <button
            onClick={() => setView('snitch')}
            className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition"
          >
            🤫 Snitch Line
          </button>
          <button
            onClick={() => setView('clients')}
            className="bg-teal-500 text-white px-4 py-2 rounded font-bold hover:bg-teal-600 transition"
          >
            🏢 Clients
          </button>
          <button
            onClick={() => setView('users')}
            className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600 transition"
          >
            👥 Manage Users
          </button>
          <button
            onClick={() => setView('schedules')}
            className="bg-cyan-500 text-white px-4 py-2 rounded font-bold hover:bg-cyan-600 transition"
          >
            📅 Schedules
          </button>
          <button
            onClick={() => setView('auto-coaching')}
            className="bg-indigo-500 text-white px-4 py-2 rounded font-bold hover:bg-indigo-600 transition"
          >
            🤖 Auto Coaching
          </button>
          <button
            onClick={() => setView('location-tracking')}
            className="bg-purple-500 text-white px-4 py-2 rounded font-bold hover:bg-purple-600 transition"
          >
            📍 Location Tracking
          </button>
        </>
      )}

      {currentUser.role !== 'admin' && (
        <>
          <button
            onClick={() => setView('my-docs')}
            className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600 transition"
          >
            📄 My Documents
          </button>
          <button
            onClick={() => setView('snitch')}
            className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition"
          >
            🤫 Report Issue
          </button>
        </>
      )}

      <button
        onClick={() => setView('media')}
        className="bg-pink-500 text-white px-4 py-2 rounded font-bold hover:bg-pink-600 transition"
      >
        📸 Team Gallery
      </button>
    </div>
  );
};

export default Navigation;

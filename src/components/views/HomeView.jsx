import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const HomeView = ({ activeBreak, setActiveBreak }) => {
  const { feed, markPresent } = useApp();
  const { currentUser, setView } = useAuth();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-bold mb-4">🎉 Welcome to WeAnswer Dispatch!</h2>
      <p className="text-lg mb-6">Maximum Chaos, Maximum Productivity! Use the menu above to navigate. 🚀</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button 
          onClick={() => markPresent(currentUser)} 
          className="bg-green-500 text-white p-4 rounded-lg font-bold hover:bg-green-600 transition"
        >
          ✅ Mark Present
        </button>
        <button 
          onClick={() => setView('breaks')} 
          className="bg-purple-500 text-white p-4 rounded-lg font-bold hover:bg-purple-600 transition"
        >
          ☕ Take Break
        </button>
        <button 
          onClick={() => setView('attendance')} 
          className="bg-blue-500 text-white p-4 rounded-lg font-bold hover:bg-blue-600 transition"
        >
          📅 View Attendance
        </button>
        <button 
          onClick={() => setView('media')} 
          className="bg-pink-500 text-white p-4 rounded-lg font-bold hover:bg-pink-600 transition"
        >
          📸 Team Gallery
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-xl font-bold mb-3">Recent Activity 📣</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {Array.isArray(feed) && feed.length > 0 ? (
  feed.slice(0, 10).map(item => (
    <div key={item.id} className="p-3 bg-white rounded border-l-4 border-purple-500">
      <p className="font-semibold">{item.message}</p>
      <p className="text-sm text-gray-600">
        {item.author} • {new Date(item.timestamp).toLocaleString()}
      </p>
    </div>
  ))
) : (
  <p className="text-gray-500 text-center py-4">No activity yet!</p>
)}
          {feed.length === 0 && <p className="text-gray-500 text-center py-4">No activity yet!</p>}
        </div>
      </div>
    </div>
  );
};

export default HomeView;

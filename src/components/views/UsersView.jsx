import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const UsersView = () => {
  const { users, blockUser, unblockUser, deleteUser } = useApp();
  const { currentUser } = useAuth();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-bold mb-4">👥 User Management</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="border p-3 text-left">Username</th>
              <th className="border p-3 text-left">Name</th>
              <th className="border p-3 text-left">Employee ID</th>
              <th className="border p-3 text-left">Role</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-left">Last Login</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(users).map(([username, user]) => (
              <tr key={username} className={`hover:bg-orange-50 ${user.blocked ? 'bg-red-50' : ''}`}>
                <td className="border p-3 font-semibold">{username}</td>
                <td className="border p-3">{user.name}</td>
                <td className="border p-3">{user.employeeId}</td>
                <td className="border p-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    user.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="border p-3">
                  {user.blocked ? (
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      🚫 BLOCKED
                    </span>
                  ) : (
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      ✅ ACTIVE
                    </span>
                  )}
                </td>
                <td className="border p-3 text-sm">
                  {user.loginHistory && user.loginHistory.length > 0 ? (
                    <div>
                      <div>{user.loginHistory[user.loginHistory.length - 1].date}</div>
                      <div className="text-gray-500 text-xs">
                        {user.loginHistory[user.loginHistory.length - 1].time}
                      </div>
                      <div className="text-gray-500 text-xs">
                        IP: {user.loginHistory[user.loginHistory.length - 1].ip}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Never logged in</span>
                  )}
                </td>
                <td className="border p-3">
                  <div className="flex flex-col gap-2">
                    {user.blocked ? (
                      <button
                        onClick={() => unblockUser(username, currentUser)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-600"
                      >
                        Unblock
                      </button>
                    ) : (
                      user.role !== 'admin' && (
                        <button
                          onClick={() => blockUser(username, currentUser)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-yellow-600"
                        >
                          Block
                        </button>
                      )
                    )}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => deleteUser(username, currentUser)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">User Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(users).filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">Admins</div>
          </div>
          <div className="bg-white p-3 rounded text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(users).filter(u => u.role === 'employee').length}
            </div>
            <div className="text-sm text-gray-600">Employees</div>
          </div>
          <div className="bg-white p-3 rounded text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(users).filter(u => !u.blocked).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-3 rounded text-center">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(users).filter(u => u.blocked).length}
            </div>
            <div className="text-sm text-gray-600">Blocked</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersView;

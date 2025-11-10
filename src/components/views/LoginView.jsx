import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const LoginView = () => {
  const { handleLogin, handleRegister } = useAuth();
  const { error, success, testConnection, db } = useApp(); // GET db HERE
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', employeeId: '', name: '' });

  const onLogin = async (e) => {
    e.preventDefault();
    await handleLogin(loginForm.username, loginForm.password);
  };

  const onRegister = async (e) => {
    e.preventDefault();
    const registered = await handleRegister(
      registerForm.username,
      registerForm.password,
      registerForm.employeeId,
      registerForm.name
    );
    if (registered) {
      setRegisterForm({ username: '', password: '', employeeId: '', name: '' });
    }
  };

  const debugShowUsers = async () => {
    // Use db from context, don't call useApp() here
    const userData = await db.get('users');
    console.log('All users in DB:', userData);
    alert(JSON.stringify(userData, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            WeAnswer Dispatch 🚀
          </h1>
          <p className="text-gray-600">Maximum Chaos, Maximum Productivity</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Login</h2>
          <form onSubmit={onLogin}>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 border rounded mb-3"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border rounded mb-3"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded font-bold hover:shadow-lg transition"
            >
              Let's Go! 🎯
            </button>
          </form>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-2xl font-bold mb-4">Register</h2>
          <form onSubmit={onRegister}>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 border rounded mb-3"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border rounded mb-3"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Employee ID"
              className="w-full p-3 border rounded mb-3"
              value={registerForm.employeeId}
              onChange={(e) => setRegisterForm({...registerForm, employeeId: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Full Name"
              className="w-full p-3 border rounded mb-3"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white p-3 rounded font-bold hover:shadow-lg transition"
            >
              Join the Team! 🎊
            </button>
          </form>

          <button
            onClick={debugShowUsers}
            className="w-full bg-blue-500 text-white p-2 rounded mt-2 text-sm hover:bg-blue-600"
          >
            Debug: Show All Users
          </button>

          <button
            onClick={testConnection}
            className="w-full bg-gray-500 text-white p-2 rounded mt-2 text-sm hover:bg-gray-600"
          >
            Test Database Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

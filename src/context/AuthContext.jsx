import React, { createContext, useContext, useState } from 'react';
import { useApp } from './AppContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { db, setError, setSuccess } = useApp();
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');

  const handleLogin = async (username, password) => {
    console.log('Login attempt:', username);
    try {
      const userData = await db.get('users');
      console.log('User data from DB:', userData);
      
      if (!userData || !userData[username]) {
        setError('Invalid username or password! 🚫');
        return false;
      }

      const user = userData[username];

      if (user.password !== password) {
        setError('Wrong password, try again! 🔐');
        return false;
      }

      if (user.blocked) {
        setError('Account is blocked! Contact admin. 🚫');
        return false;
      }

      // Check IP restriction for employees
      const today = new Date().toDateString();
      const userIP = 'DESKTOP-' + Math.random().toString(36).substr(2, 9);

      if (user.role !== 'admin') {
        const lastLogin = user.loginHistory?.[user.loginHistory.length - 1];
        if (lastLogin && lastLogin.date === today && lastLogin.ip !== userIP) {
          setError('Already logged in from another device today! 🖥️');
          return false;
        }
      }

      // Update login history
      user.loginHistory = user.loginHistory || [];
      user.loginHistory.push({ 
        date: today, 
        ip: userIP, 
        time: new Date().toLocaleTimeString() 
      });
      userData[username] = user;
      await db.set('users', userData);

      // Set current user and navigate to home
      setCurrentUser({ username, ...user });
      setView('home');
      setError('');
      setSuccess('Welcome back! 🎉');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed: ' + err.message);
      return false;
    }
  };

  const handleRegister = async (username, password, employeeId, name) => {
    try {
      if (!username || !password || !employeeId || !name) {
        setError('Fill all fields! 📝');
        return false;
      }

      const userData = await db.get('users') || {};
      if (userData[username]) {
        setError('Username already exists! 👥');
        return false;
      }

      userData[username] = {
        password,
        role: 'employee',
        employeeId,
        name,
        loginHistory: []
      };

      await db.set('users', userData);
      setSuccess('Account created! Login now! 🎊');
      setError('');
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed: ' + err.message);
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setSuccess('Logged out successfully! 👋');
  };

  const value = {
    currentUser,
    view,
    setView,
    handleLogin,
    handleRegister,
    handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

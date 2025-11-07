import React from 'react';
import { LogOut } from 'lucide-react';

const Navbar = ({ currentUser, onLogout }) => {
  return (
    <nav className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">WeAnswer Dispatch 🚀</h1>
        <div className="flex items-center gap-4">
          <span className="font-semibold">{currentUser.name} ({currentUser.role})</span>
          <button
            onClick={onLogout}
            className="bg-white text-purple-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition flex items-center gap-2"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

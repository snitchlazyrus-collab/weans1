import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800">Loading WeAnswer Dispatch...</h2>
        <p className="text-gray-600 mt-2">Connecting to Firebase 🚀</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

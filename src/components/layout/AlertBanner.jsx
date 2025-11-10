import React from 'react';

const AlertBanner = ({ error, success }) => {
  if (!error && !success) return null;

  return (
    <>
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
    </>
  );
};

export default AlertBanner;

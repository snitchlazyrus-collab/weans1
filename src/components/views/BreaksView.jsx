import React from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { exportBreaksCSV } from '../../utils/exportHelpers';

const BreaksView = ({ activeBreak, setActiveBreak }) => {
  const { breaks, startBreak, endBreak, approveBreak } = useApp();
  const { currentUser } = useAuth();

  const handleStartBreak = async (type) => {
    const breakData = await startBreak(type, currentUser);
    if (breakData) {
      setActiveBreak(breakData);
    }
  };

  const handleEndBreak = async () => {
    await endBreak(activeBreak, currentUser);
    setActiveBreak(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">☕ Break Management</h2>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => exportBreaksCSV(breaks)}
            className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {currentUser.role !== 'admin' && !activeBreak && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleStartBreak('break1')}
            className="bg-blue-500 text-white p-4 rounded-lg font-bold hover:bg-blue-600 transition"
          >
            ☕ Break 1<br/><span className="text-sm">(15 min)</span>
          </button>
          <button
            onClick={() => handleStartBreak('break2')}
            className="bg-purple-500 text-white p-4 rounded-lg font-bold hover:bg-purple-600 transition"
          >
            ☕ Break 2<br/><span className="text-sm">(15 min)</span>
          </button>
          <button
            onClick={() => handleStartBreak('lunch')}
            className="bg-orange-500 text-white p-4 rounded-lg font-bold hover:bg-orange-600 transition"
          >
            🍕 Lunch<br/><span className="text-sm">(60 min)</span>
          </button>
          <button
            onClick={() => handleStartBreak('rr')}
            className="bg-teal-500 text-white p-4 rounded-lg font-bold hover:bg-teal-600 transition"
          >
            🚽 RR<br/><span className="text-sm">(No limit)</span>
          </button>
        </div>
      )}

      {activeBreak && (
        <div className="mb-6 p-6 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
          <h3 className="text-xl font-bold mb-3">⏱️ Currently on {activeBreak.type.toUpperCase()}</h3>
          <p className="mb-4">Started at: {new Date(activeBreak.start).toLocaleTimeString()}</p>
          <button
            onClick={handleEndBreak}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition"
          >
            🔙 End Break
          </button>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(breaks).reverse().map(([date, records]) => (
          <div key={date} className="border rounded-lg p-4">
            <h3 className="text-lg font-bold mb-3">{date}</h3>
            {Object.entries(records).map(([empId, breakList]) => (
              <div key={empId} className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">
                  {breakList[0]?.name} ({empId})
                </h4>
                <div className="space-y-2">
                  {breakList.map((brk, idx) => {
                    const duration = brk.end ?
                      ((new Date(brk.end) - new Date(brk.start)) / 60000).toFixed(2) :
                      'Ongoing';
                    const limits = { 'break1': 15, 'break2': 15, 'lunch': 60 };
                    const exceeded = brk.end && limits[brk.type] &&
                      ((new Date(brk.end) - new Date(brk.start)) / 60000) > limits[brk.type];

                    return (
                      <div key={idx} className={`p-3 rounded ${exceeded ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold capitalize">{brk.type}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(brk.start).toLocaleTimeString()} -
                              {brk.end ? new Date(brk.end).toLocaleTimeString() : 'In Progress'}
                            </p>
                            <p className="text-sm">Duration: {duration} min {exceeded && '⚠️ EXCEEDED'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {brk.approved ? (
                              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                                ✅ Approved
                              </span>
                            ) : (
                              <>
                                <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                                  ⏳ Pending
                                </span>
                                {currentUser.role === 'admin' && (
                                  <button
                                    onClick={() => approveBreak(date, empId, idx)}
                                    className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-green-600"
                                  >
                                    Approve
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(breaks).length === 0 && (
          <p className="text-gray-500 text-center py-8">No break records yet. ☕</p>
        )}
      </div>
    </div>
  );
};

export default BreaksView;

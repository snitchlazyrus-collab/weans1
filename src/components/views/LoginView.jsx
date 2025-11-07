import React from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { exportAttendanceCSV } from '../../utils/exportHelpers';

const AttendanceView = () => {
  const { attendance, markPresent, approveAttendance } = useApp();
  const { currentUser } = useAuth();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📅 Attendance Management</h2>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => exportAttendanceCSV(attendance)}
            className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {currentUser.role !== 'admin' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <button
            onClick={() => markPresent(currentUser)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition"
          >
            ✅ Mark Present for Today
          </button>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(attendance).reverse().map(([date, records]) => (
          <div key={date} className="border rounded-lg p-4">
            <h3 className="text-lg font-bold mb-3">{date}</h3>
            <div className="space-y-2">
              {Object.entries(records).map(([empId, record]) => (
                <div key={empId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{record.name} ({empId})</p>
                    <p className="text-sm text-gray-600">Time: {record.time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {record.approved ? (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ✅ Approved
                      </span>
                    ) : (
                      <>
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          ⏳ Pending
                        </span>
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => approveAttendance(date, empId)}
                            className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600 transition"
                          >
                            Approve
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(attendance).length === 0 && (
          <p className="text-gray-500 text-center py-8">No attendance records yet. 📝</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceView;

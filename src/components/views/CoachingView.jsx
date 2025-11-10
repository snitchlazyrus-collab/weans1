import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const CoachingView = () => {
  const { users, coachingLogs, postCoachingLog, setError } = useApp();
  const { currentUser } = useAuth();

  const [empId, setEmpId] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostCoaching = async () => {
    if (!empId || !category || !content) {
      setError('Fill all fields!');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await postCoachingLog(empId, content, category, currentUser);

      if (result?.error) {
        setError(result.error);
      } else {
        // Clear form on success
        setEmpId('');
        setCategory('');
        setContent('');
        setError(''); // Clear any previous errors
      }
    } catch (error) {
      setError('Failed to post coaching log: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSignature = (signature) => {
    const win = window.open();
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head><title>Signature</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${signature}" style="max-width:100%;height:auto;" />
          </body>
        </html>
      `);
      win.document.close();
    } else {
      setError('Please allow popups to view signatures');
    }
  };

  // Safe users check
  const employeeUsers = users && typeof users === 'object'
    ? Object.entries(users).filter(([u, data]) => data?.role !== 'admin')
    : [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">📋 Coaching Logs</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-3">Create New Coaching Log</h3>
        <select
          value={empId}
          onChange={(e) => setEmpId(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          disabled={isSubmitting}
        >
          <option value="">Select Employee</option>
          {employeeUsers.map(([username, data]) => (
            <option key={data.employeeId} value={data.employeeId}>
              {data.name} ({data.employeeId})
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          disabled={isSubmitting}
        >
          <option value="">Select Category</option>
          <option value="attendance">Attendance</option>
          <option value="performance">Performance</option>
          <option value="behavior">Behavior</option>
          <option value="company-policy">Company Policy</option>
        </select>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Coaching log content..."
          className="w-full p-2 border rounded mb-2"
          rows="4"
          disabled={isSubmitting}
        />
        <button
          onClick={handlePostCoaching}
          disabled={isSubmitting}
          className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post Coaching Log'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-yellow-500 text-white">
              <th className="border p-3 text-left">Employee Name</th>
              <th className="border p-3 text-left">Coaching For</th>
              <th className="border p-3 text-left">Coaching Logs</th>
              <th className="border p-3 text-center">Acknowledged</th>
              <th className="border p-3 text-center">Signed</th>
              <th className="border p-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {coachingLogs && coachingLogs.length > 0 ? (
              coachingLogs.map(log => {
                const employee = users && typeof users === 'object'
                  ? Object.values(users).find(u => u?.employeeId === log.employeeId)
                  : null;
                const employeeName = employee?.name || log.employeeId;

                return (
                  <tr key={log.id} className="hover:bg-yellow-50">
                    <td className="border p-3 font-semibold">{employeeName}</td>
                    <td className="border p-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        log.category === 'attendance' ? 'bg-blue-100 text-blue-800' :
                        log.category === 'performance' ? 'bg-green-100 text-green-800' :
                        log.category === 'behavior' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {log.category ? log.category.replace('-', ' ').toUpperCase() : 'N/A'}
                      </span>
                    </td>
                    <td className="border p-3">
                      <p className="text-sm">{log.content}</p>
                      {log.comment && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <strong>Employee Comment:</strong> {log.comment}
                        </div>
                      )}
                    </td>
                    <td className="border p-3 text-center">
                      {log.acknowledged ? (
                        <span className="text-green-600 font-bold text-2xl">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                    <td className="border p-3 text-center">
                      {log.signature ? (
                        <button
                          onClick={() => handleViewSignature(log.signature)}
                          className="text-green-600 font-bold text-2xl hover:text-green-800"
                          title="View signature"
                        >
                          ✓
                        </button>
                      ) : (
                        <span className="text-red-600 font-bold text-2xl">✗</span>
                      )}
                    </td>
                    <td className="border p-3 text-sm">
                      {new Date(log.date).toLocaleDateString()}<br/>
                      <span className="text-gray-500">{new Date(log.date).toLocaleTimeString()}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="border p-8 text-center text-gray-500">
                  No coaching logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoachingView;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const CoachingView = () => {
  const { users, coachingLogs, postCoachingLog, deleteCoachingLog, setError } = useApp();
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
        setEmpId('');
        setCategory('');
        setContent('');
        setError('');
      }
    } catch (error) {
      setError('Failed to post coaching log: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this coaching log? This will prevent it from being auto-generated again.')) return;
    await deleteCoachingLog(logId, currentUser);
  };

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
          <option value="tardiness">Tardiness</option>
          <option value="overbreak">Overbreak</option>
          <option value="absence">Absence</option>
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

      <div className="space-y-4">
        {coachingLogs && coachingLogs.length > 0 ? (
          coachingLogs.map(log => {
            const employee = users && typeof users === 'object'
              ? Object.values(users).find(u => u?.employeeId === log.employeeId)
              : null;
            const employeeName = employee?.name || log.employeeId;

            return (
              <div key={log.id} className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{employeeName}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                      log.category === 'tardiness' ? 'bg-red-100 text-red-800' :
                      log.category === 'overbreak' ? 'bg-orange-100 text-orange-800' :
                      log.category === 'absence' ? 'bg-purple-100 text-purple-800' :
                      log.category === 'attendance' ? 'bg-blue-100 text-blue-800' :
                      log.category === 'performance' ? 'bg-green-100 text-green-800' :
                      log.category === 'behavior' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {log.category ? log.category.replace('-', ' ').toUpperCase() : 'N/A'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    🗑️ Delete
                  </button>
                </div>

                <div className="mb-3 p-3 bg-white rounded">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{log.content}</pre>
                </div>

                {log.comment && (
                  <div className="mb-3 p-3 bg-blue-50 rounded">
                    <strong className="text-sm">Employee Comment:</strong>
                    <p className="text-sm mt-1">{log.comment}</p>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Status:</span>
                    {log.acknowledged ? (
                      <span className="text-green-600 font-bold">✓ Acknowledged</span>
                    ) : (
                      <span className="text-red-600 font-bold">✗ Pending</span>
                    )}
                  </div>

                  {log.signature && (
                    <div className="flex-1">
                      <span className="text-sm font-semibold">Signature:</span>
                      <div className="mt-2 p-2 bg-white rounded border-2 border-green-300">
                        <img
                          src={log.signature}
                          alt="Employee signature"
                          className="h-16 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-right text-sm text-gray-600">
                    <div>{new Date(log.date).toLocaleDateString()}</div>
                    <div>{new Date(log.date).toLocaleTimeString()}</div>
                    {log.issuedBy && (
                      <div className="text-xs text-gray-500 mt-1">Issued by: {log.issuedBy}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-8">No coaching logs yet.</p>
        )}
      </div>
    </div>
  );
};

export default CoachingView;

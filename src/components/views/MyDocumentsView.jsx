import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import SignaturePad from '../shared/SignaturePad';

const MyDocumentsView = () => {
  const { coachingLogs, infractions, memos, acknowledgeWithSignature } = useApp();
  const { currentUser } = useAuth();

  // Safety check for currentUser
  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-500">Loading user data...</p>
      </div>
    );
  }

  // Safety check for data arrays
  const safeCoachingLogs = coachingLogs || [];
  const safeInfractions = infractions || [];
  const safeMemos = memos || [];

  const handleAcknowledgeCoaching = (logId, signature) => {
    const commentElement = document.getElementById(`log-comment-${logId}`);
    const comment = commentElement ? commentElement.value : '';

    if (signature && comment) {
      acknowledgeWithSignature('coaching', logId, comment, signature, currentUser);
    } else {
      alert('Please provide both a comment and signature.');
    }
  };

  const handleAcknowledgeInfraction = (irId, signature) => {
    const commentElement = document.getElementById(`ir-comment-${irId}`);
    const comment = commentElement ? commentElement.value : '';

    if (signature && comment) {
      acknowledgeWithSignature('infraction', irId, comment, signature, currentUser);
    } else {
      alert('Please provide both a comment and signature.');
    }
  };

  const handleAcknowledgeMemo = (memoId, signature) => {
    if (signature) {
      acknowledgeWithSignature('memo', memoId, '', signature, currentUser);
    } else {
      alert('Please provide a signature.');
    }
  };

  // Filter data for current user
  const userCoachingLogs = safeCoachingLogs.filter(log => log.employeeId === currentUser.employeeId);
  const userInfractions = safeInfractions.filter(ir => ir.employeeId === currentUser.employeeId);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">📄 My Documents</h2>

      <div className="space-y-6">
        {/* Coaching Logs */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-yellow-600">📋 Coaching Logs</h3>
          <div className="space-y-4">
            {userCoachingLogs.map(log => (
              <div key={log.id} className="border rounded-lg p-4 bg-yellow-50">
                <p className="text-sm text-gray-600 mb-2">
                  {log.date ? new Date(log.date).toLocaleString() : 'Date not available'}
                </p>
                <div className="mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    log.category === 'attendance' ? 'bg-blue-100 text-blue-800' :
                    log.category === 'performance' ? 'bg-green-100 text-green-800' :
                    log.category === 'behavior' ? 'bg-orange-100 text-orange-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {log.category ? log.category.replace('-', ' ').toUpperCase() : 'N/A'}
                  </span>
                </div>
                <p className="mb-3">{log.content || 'No content provided'}</p>

                {!log.acknowledged && (
                  <div className="mt-4 p-4 bg-white rounded">
                    <p className="font-semibold mb-2">Please acknowledge this log:</p>
                    <textarea
                      id={`log-comment-${log.id}`}
                      placeholder="Your comment/explanation..."
                      className="w-full p-2 border rounded mb-2"
                      rows="3"
                    />
                    <SignaturePad onSubmit={(signature) => handleAcknowledgeCoaching(log.id, signature)} />
                  </div>
                )}

                {log.acknowledged && (
                  <div className="mt-3">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      ✅ Acknowledged
                    </span>
                  </div>
                )}
              </div>
            ))}
            {userCoachingLogs.length === 0 && (
              <p className="text-gray-500 text-center py-4">No coaching logs yet.</p>
            )}
          </div>
        </div>

        {/* Infraction Reports */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Infraction Reports</h3>
          <div className="space-y-4">
            {userInfractions.map(ir => (
              <div key={ir.id} className={`border-2 rounded-lg p-4 ${
                ir.level === 'Serious Infraction' ? 'bg-red-100 border-red-500' :
                ir.level === 'Less Serious Infraction' ? 'bg-orange-100 border-orange-500' :
                'bg-yellow-100 border-yellow-500'
              }`}>
                <p className="text-sm text-gray-600 mb-2">
                  {ir.date ? new Date(ir.date).toLocaleString() : 'Date not available'}
                </p>
                <span className={`inline-block mb-2 px-2 py-1 rounded text-xs font-bold ${
                  ir.level === 'Serious Infraction' ? 'bg-red-500 text-white' :
                  ir.level === 'Less Serious Infraction' ? 'bg-orange-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {ir.level || 'N/A'}
                </span>
                <p className="font-semibold">
                  {ir.rule || 'No rule specified'} - Section {ir.section || 'N/A'}
                </p>
                <p className="mb-3">{ir.description || 'No description provided'}</p>

                {!ir.acknowledged && (
                  <div className="mt-4 p-4 bg-white rounded">
                    <p className="font-semibold mb-2">Please acknowledge this infraction:</p>
                    <textarea
                      id={`ir-comment-${ir.id}`}
                      placeholder="Your comment/explanation..."
                      className="w-full p-2 border rounded mb-2"
                      rows="3"
                    />
                    <SignaturePad onSubmit={(signature) => handleAcknowledgeInfraction(ir.id, signature)} />
                  </div>
                )}

                {ir.acknowledged && (
                  <div className="mt-3">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      ✅ Acknowledged
                    </span>
                  </div>
                )}
              </div>
            ))}
            {userInfractions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No infractions yet.</p>
            )}
          </div>
        </div>

        {/* Memos */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-indigo-600">📢 Memos</h3>
          <div className="space-y-4">
            {safeMemos.map(memo => {
              const acknowledged = memo.acknowledgedBy && memo.acknowledgedBy[currentUser.employeeId];
              return (
                <div key={memo.id} className="border rounded-lg p-4 bg-indigo-50">
                  <h4 className="text-lg font-bold mb-2">{memo.title || 'Untitled Memo'}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {memo.date ? new Date(memo.date).toLocaleString() : 'Date not available'}
                  </p>
                  <p className="mb-3">{memo.content || 'No content provided'}</p>

                  {!acknowledged && (
                    <div className="mt-4 p-4 bg-white rounded">
                      <p className="font-semibold mb-2">Please acknowledge this memo:</p>
                      <SignaturePad onSubmit={(signature) => handleAcknowledgeMemo(memo.id, signature)} />
                    </div>
                  )}

                  {acknowledged && (
                    <div className="mt-3">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ✅ Acknowledged on {acknowledged.date ? new Date(acknowledged.date).toLocaleString() : 'Unknown date'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {safeMemos.length === 0 && (
              <p className="text-gray-500 text-center py-4">No memos yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDocumentsView;

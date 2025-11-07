import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import SignaturePad from '../shared/SignaturePad';

const MyDocumentsView = () => {
  const { coachingLogs, infractions, memos, acknowledgeWithSignature } = useApp();
  const { currentUser } = useAuth();

  const handleAcknowledgeCoaching = (logId, signature) => {
    const comment = document.getElementById(`log-comment-${logId}`).value;
    if (signature && comment) {
      acknowledgeWithSignature('coaching', logId, comment, signature, currentUser);
    }
  };

  const handleAcknowledgeInfraction = (irId, signature) => {
    const comment = document.getElementById(`ir-comment-${irId}`).value;
    if (signature && comment) {
      acknowledgeWithSignature('infraction', irId, comment, signature, currentUser);
    }
  };

  const handleAcknowledgeMemo = (memoId, signature) => {
    if (signature) {
      acknowledgeWithSignature('memo', memoId, '', signature, currentUser);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">📄 My Documents</h2>

      <div className="space-y-6">
        {/* Coaching Logs */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-yellow-600">📋 Coaching Logs</h3>
          <div className="space-y-4">
            {coachingLogs.filter(log => log.employeeId === currentUser.employeeId).map(log => (
              <div key={log.id} className="border rounded-lg p-4 bg-yellow-50">
                <p className="text-sm text-gray-600 mb-2">{new Date(log.date).toLocaleString()}</p>
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
                <p className="mb-3">{log.content}</p>

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
            {coachingLogs.filter(log => log.employeeId === currentUser.employeeId).length === 0 && (
              <p className="text-gray-500 text-center py-4">No coaching logs yet.</p>
            )}
          </div>
        </div>

        {/* Infraction Reports */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Infraction Reports</h3>
          <div className="space-y-4">
            {infractions.filter(ir => ir.employeeId === currentUser.employeeId).map(ir => (
              <div key={ir.id} className={`border-2 rounded-lg p-4 ${
                ir.level === 'Serious Infraction' ? 'bg-red-100 border-red-500' :
                ir.level === 'Less Serious Infraction' ? 'bg-orange-100 border-orange-500' :
                'bg-yellow-100 border-yellow-500'
              }`}>
                <p className="text-sm text-gray-600 mb-2">{new Date(ir.date).toLocaleString()}</p>
                <span className={`inline-block mb-2 px-2 py-1 rounded text-xs font-bold ${
                  ir.level === 'Serious Infraction' ? 'bg-red-500 text-white' :
                  ir.level === 'Less Serious Infraction' ? 'bg-orange-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {ir.level}
                </span>
                <p className="font-semibold">{ir.rule} - Section {ir.section}</p>
                <p className="mb-3">{ir.description}</p>

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
            {infractions.filter(ir => ir.employeeId === currentUser.employeeId).length === 0 && (
              <p className="text-gray-500 text-center py-4">No infractions yet.</p>
            )}
          </div>
        </div>

        {/* Memos */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-indigo-600">📢 Memos</h3>
          <div className="space-y-4">
            {memos.map(memo => {
              const acknowledged = memo.acknowledgedBy[currentUser.employeeId];
              return (
                <div key={memo.id} className="border rounded-lg p-4 bg-indigo-50">
                  <h4 className="text-lg font-bold mb-2">{memo.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{new Date(memo.date).toLocaleString()}</p>
                  <p className="mb-3">{memo.content}</p>

                  {!acknowledged && (
                    <div className="mt-4 p-4 bg-white rounded">
                      <p className="font-semibold mb-2">Please acknowledge this memo:</p>
                      <SignaturePad onSubmit={(signature) => handleAcknowledgeMemo(memo.id, signature)} />
                    </div>
                  )}

                  {acknowledged && (
                    <div className="mt-3">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ✅ Acknowledged on {new Date(acknowledged.date).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {memos.length === 0 && (
              <p className="text-gray-500 text-center py-4">No memos yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDocumentsView;

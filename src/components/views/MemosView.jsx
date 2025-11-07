import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const MemosView = () => {
  const { memos, postMemo } = useApp();
  const { currentUser } = useAuth();

  const handlePostMemo = () => {
    const title = document.getElementById('memoTitle').value;
    const content = document.getElementById('memoContent').value;
    if (title && content) {
      postMemo(title, content, currentUser);
      document.getElementById('memoTitle').value = '';
      document.getElementById('memoContent').value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">📢 Company Memos</h2>

      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <h3 className="font-bold mb-3">Post New Memo</h3>
        <input
          id="memoTitle"
          type="text"
          placeholder="Memo title..."
          className="w-full p-2 border rounded mb-2"
        />
        <textarea
          id="memoContent"
          placeholder="Memo content..."
          className="w-full p-2 border rounded mb-2"
          rows="4"
        />
        <button
          onClick={handlePostMemo}
          className="bg-indigo-500 text-white px-4 py-2 rounded font-bold hover:bg-indigo-600"
        >
          Post Memo
        </button>
      </div>

      <div className="space-y-4">
        {memos.map(memo => (
          <div key={memo.id} className="border rounded-lg p-4 bg-indigo-50">
            <h3 className="text-lg font-bold mb-2">{memo.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{new Date(memo.date).toLocaleString()}</p>
            <p className="mb-3">{memo.content}</p>
            <div className="mt-4">
              <p className="font-semibold mb-2">Acknowledged by:</p>
              <div className="space-y-2">
                {Object.entries(memo.acknowledgedBy).map(([empId, ack]) => (
                  <div key={empId} className="p-2 bg-white rounded flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-sm">{ack.name} - {new Date(ack.date).toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(memo.acknowledgedBy).length === 0 && (
                  <p className="text-sm text-gray-500">No acknowledgments yet</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {memos.length === 0 && (
          <p className="text-gray-500 text-center py-8">No memos yet. 📢</p>
        )}
      </div>
    </div>
  );
};

export default MemosView;

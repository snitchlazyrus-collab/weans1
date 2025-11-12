import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const MemosView = () => {
  const { memos, postMemo, setError } = useApp();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostMemo = async () => {
    if (!title || !content) {
      setError('Please fill in both title and content!');
      return;
    }

    setIsSubmitting(true);
    try {
      await postMemo(title, content, currentUser);
      setTitle('');
      setContent('');
    } catch (error) {
      setError('Failed to post memo: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">📢 Company Memos</h2>

      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <h3 className="font-bold mb-3">Post New Memo</h3>
        <input
          type="text"
          placeholder="Memo title..."
          className="w-full p-2 border rounded mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
        <textarea
          placeholder="Memo content..."
          className="w-full p-2 border rounded mb-2"
          rows="4"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />
        <button
          onClick={handlePostMemo}
          disabled={isSubmitting}
          className="bg-indigo-500 text-white px-4 py-2 rounded font-bold hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post Memo'}
        </button>
      </div>

      <div className="space-y-4">
        {memos && memos.length > 0 ? (
          memos.map(memo => (
            <div key={memo.id} className="border rounded-lg p-4 bg-indigo-50">
              <h3 className="text-lg font-bold mb-2">{memo.title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {new Date(memo.date).toLocaleString()}
              </p>
              <div className="mb-4 p-3 bg-white rounded">
                <p>{memo.content}</p>
              </div>

              <div className="mt-4">
                <p className="font-semibold mb-3">
                  Acknowledgments ({memo.acknowledgedBy ? Object.keys(memo.acknowledgedBy).length : 0}):
                </p>
                <div className="space-y-3">
                  {memo.acknowledgedBy && Object.keys(memo.acknowledgedBy).length > 0 ? (
                    Object.entries(memo.acknowledgedBy).map(([empId, ack]) => (
                      <div key={empId} className="p-3 bg-white rounded border-2 border-green-200">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                          <div className="flex-1">
                            <div className="font-semibold">{ack.name}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(ack.date).toLocaleString()}
                            </div>
                          </div>
                          {ack.signature && (
                            <div className="flex-shrink-0">
                              <div className="text-xs text-gray-600 mb-1">Signature:</div>
                              <div className="p-2 bg-gray-50 rounded border">
                                <img
                                  src={ack.signature}
                                  alt={`${ack.name}'s signature`}
                                  className="h-12 object-contain"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No acknowledgments yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No memos yet. 📢</p>
        )}
      </div>
    </div>
  );
};

export default MemosView;

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const SnitchView = () => {
  const { snitchMessages, sendSnitchMessage, setError } = useApp();
  const { currentUser } = useAuth();

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError('Please enter a message!');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendSnitchMessage(message, currentUser);
      // Clear form on success
      setMessage('');
    } catch (error) {
      setError('Failed to send message: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">
        🤫 {currentUser.role === 'admin' ? 'Snitch Line Messages' : 'Report Issue Confidentially'}
      </h2>

      {currentUser.role !== 'admin' && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <p className="mb-3 text-sm text-gray-600">
            Report issues, concerns, or feedback confidentially to admin. Your Employee ID will be linked but message content is private.
          </p>
          <textarea
            placeholder="Your confidential message..."
            className="w-full p-3 border rounded mb-3"
            rows="5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            onClick={handleSendMessage}
            disabled={isSubmitting}
            className="bg-gray-700 text-white px-4 py-2 rounded font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Confidential Message'}
          </button>
        </div>
      )}

      {currentUser.role === 'admin' && (
        <div className="space-y-4">
          {snitchMessages && snitchMessages.length > 0 ? (
            snitchMessages.map(msg => (
              <div key={msg.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">From: {msg.employeeId}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(msg.date).toLocaleString()}
                    </p>
                  </div>
                  {!msg.read && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      NEW
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No messages yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SnitchView;

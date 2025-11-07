import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const MediaView = () => {
  const { media, addToFeed, db } = useApp();
  const { currentUser } = useAuth();
  const [localMedia, setLocalMedia] = React.useState(media);

  React.useEffect(() => {
    setLocalMedia(media);
  }, [media]);

  const handleUpload = async () => {
    const caption = document.getElementById('mediaCaption').value;
    const url = document.getElementById('mediaUrl').value;
    
    if (caption && url) {
      const mediaData = await db.get('media') || [];
      mediaData.unshift({
        id: Date.now(),
        caption,
        url,
        uploadedBy: currentUser.name,
        employeeId: currentUser.employeeId,
        date: new Date().toISOString(),
        reactions: {}
      });
      
      if (mediaData.length > 50) mediaData.pop();
      
      await db.set('media', mediaData);
      setLocalMedia(mediaData);
      document.getElementById('mediaCaption').value = '';
      document.getElementById('mediaUrl').value = '';
      addToFeed(`${currentUser.name} posted a new pic! 📸`, 'media', currentUser);
    }
  };

  const handleReaction = async (itemId, emoji) => {
    const mediaData = await db.get('media') || [];
    const mediaItem = mediaData.find(m => m.id === itemId);
    
    if (mediaItem) {
      if (!mediaItem.reactions) mediaItem.reactions = {};
      if (!mediaItem.reactions[emoji]) mediaItem.reactions[emoji] = 0;
      mediaItem.reactions[emoji]++;
      await db.set('media', mediaData);
      setLocalMedia(mediaData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">📸 Team Gallery - Meme Central! 🎉</h2>

      <div className="mb-6 p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg">
        <p className="mb-3 font-semibold">Share team pics, memes, and moments!</p>
        <input
          id="mediaCaption"
          type="text"
          placeholder="Caption this masterpiece..."
          className="w-full p-2 border rounded mb-2"
        />
        <input
          id="mediaUrl"
          type="text"
          placeholder="Image URL (or paste a meme link!)"
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={handleUpload}
          className="bg-pink-500 text-white px-4 py-2 rounded font-bold hover:bg-pink-600"
        >
          Upload! 🚀
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localMedia.map(item => (
          <div key={item.id} className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
            <img 
              src={item.url} 
              alt={item.caption} 
              className="w-full h-48 object-cover" 
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage Error%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="p-3">
              <p className="font-semibold mb-1">{item.caption}</p>
              <p className="text-xs text-gray-600 mb-2">
                By {item.uploadedBy} • {new Date(item.date).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                {['🔥', '😂', '❤️', '👍', '🎉'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(item.id, emoji)}
                    className="text-lg hover:scale-125 transition"
                  >
                    {emoji} {item.reactions?.[emoji] || 0}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {localMedia.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p className="text-xl mb-2">📸</p>
            <p>No pics yet! Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaView;

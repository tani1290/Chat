import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Search } from 'lucide-react';

export default function Sidebar({ socket, activeConversation, setActiveConversation, logout, user }) {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/conversations`);
      setConversations(res.data);
    };
    fetchConversations();
  }, [activeConversation]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/search?q=${searchQuery}`)
        .then(res => setSearchResults(res.data));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const startConversation = async (receiverId) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/conversations`, { receiverId });
    setActiveConversation(res.data);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="sidebar">
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Chats</h3>
        <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><LogOut size={20} /></button>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', borderRadius: '20px' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {searchResults.length > 0 ? (
          <div style={{ padding: '0 16px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Search Results</h4>
            {searchResults.map(u => (
              <div key={u._id} onClick={() => startConversation(u._id)} style={{ padding: '12px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>{u.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {conversations.map(conv => {
              const otherUser = conv.participants.find(p => p._id !== user._id);
              const isActive = activeConversation?._id === conv._id;
              return (
                <div 
                  key={conv._id} 
                  onClick={() => setActiveConversation(conv)}
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid var(--border)',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {otherUser?.username[0].toUpperCase() || 'G'}
                    </div>
                    {otherUser?.isOnline && <span className="status-dot" style={{ position: 'absolute', bottom: 2, right: 2, border: '2px solid var(--bg-dark)' }}></span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{otherUser?.username || conv.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                      {conv.lastMessage?.text || 'Start chatting...'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

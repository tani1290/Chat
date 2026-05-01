import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, User as UserIcon, Link as LinkIcon } from 'lucide-react';

export default function Sidebar({ socket, activeConversation, setActiveConversation, logout, user, setCurrentView }) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/conversations`);
        setConversations(res.data);
      } catch(err) {
        console.error(err);
      }
    };
    fetchConversations();
  }, [activeConversation]);

  return (
    <div className="sidebar">
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Connections</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setCurrentView('profile')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Profile">
            <UserIcon size={20} />
          </button>
          <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setCurrentView('connect')} 
          className="btn" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <LinkIcon size={16} /> New Connection
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No connections yet. Establish a connection to start messaging.
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
                    {otherUser?.profilePicture ? (
                      <img src={otherUser.profilePicture} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>
                        {otherUser?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    {otherUser?.isOnline && <span className="status-dot" style={{ position: 'absolute', bottom: 2, right: 2, border: '2px solid var(--bg-panel)' }}></span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{otherUser?.username || 'Unknown User'}</div>
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

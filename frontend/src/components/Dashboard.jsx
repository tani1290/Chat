import { useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import Profile from './Profile';
import Connections from './Connections';
import io from 'socket.io-client';

export default function Dashboard({ PendingInviteHandler }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'profile' | 'connect'

  // Open a conversation passed via router state (from InviteLanding redirect)
  useEffect(() => {
    if (location.state?.openConversation) {
      setActiveConversation(location.state.openConversation);
      setCurrentView('chat');
      // Clear state so refreshing doesn't re-open
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const openConversation = (conv) => {
    setActiveConversation(conv);
    setCurrentView('chat');
  };

  return (
    <div className="app-container">
      {/* Handles pending invite code after login */}
      {PendingInviteHandler && <PendingInviteHandler onConversationOpen={openConversation} />}

      <Sidebar
        socket={socket}
        activeConversation={activeConversation}
        setActiveConversation={openConversation}
        logout={logout}
        user={user}
        setCurrentView={setCurrentView}
      />

      <div
        className="chat-window"
        style={{
          overflowY: 'auto',
          display: 'flex',
          justifyContent: currentView === 'chat' ? 'stretch' : 'center',
          alignItems: currentView === 'chat' ? 'stretch' : 'center'
        }}
      >
        {currentView === 'chat' && activeConversation && (
          <ChatWindow socket={socket} conversation={activeConversation} user={user} />
        )}

        {currentView === 'chat' && !activeConversation && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <h2>Welcome, {user?.username}</h2>
            <p style={{ maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>
              Select a conversation from the sidebar, or go to{' '}
              <button onClick={() => setCurrentView('connect')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', fontSize: 'inherit', textDecoration: 'underline' }}>
                Connect
              </button>
              {' '}to invite new people.
            </p>
          </div>
        )}

        {currentView === 'profile' && <Profile />}

        {currentView === 'connect' && (
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
            <Connections onConnect={openConversation} />
          </div>
        )}
      </div>
    </div>
  );
}

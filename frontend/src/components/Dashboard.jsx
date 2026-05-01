import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import Profile from './Profile';
import Connections from './Connections';
import io from 'socket.io-client';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'profile', 'connect'

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <div className="app-container">
      <Sidebar 
        socket={socket} 
        activeConversation={activeConversation} 
        setActiveConversation={(conv) => { setActiveConversation(conv); setCurrentView('chat'); }} 
        logout={logout}
        user={user}
        setCurrentView={setCurrentView}
      />
      <div className="chat-window" style={{ overflowY: 'auto', display: 'flex', justifyContent: currentView === 'chat' ? 'stretch' : 'center', alignItems: currentView === 'chat' ? 'stretch' : 'center' }}>
        {currentView === 'chat' && activeConversation && (
          <ChatWindow socket={socket} conversation={activeConversation} user={user} />
        )}
        {currentView === 'chat' && !activeConversation && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <h3>Select a conversation to start chatting</h3>
          </div>
        )}
        {currentView === 'profile' && <Profile />}
        {currentView === 'connect' && (
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
            <Connections onConnect={(conv) => { setActiveConversation(conv); setCurrentView('chat'); }} />
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);

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
        setActiveConversation={setActiveConversation} 
        logout={logout}
        user={user}
      />
      {activeConversation ? (
        <ChatWindow 
          socket={socket} 
          conversation={activeConversation} 
          user={user} 
        />
      ) : (
        <div className="chat-window" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
          <h3>Select a conversation to start chatting</h3>
        </div>
      )}
    </div>
  );
}

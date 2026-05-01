import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Check, CheckCheck } from 'lucide-react';

export default function ChatWindow({ socket, conversation, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const otherUser = conversation.participants.find(p => p._id !== user._id);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messages/${conversation._id}`);
      setMessages(res.data);
      // Send read receipts for all unread messages
      res.data.forEach(msg => {
        if (msg.senderId._id !== user._id && msg.status !== 'seen') {
          socket?.emit('read_receipt', { messageId: msg._id, conversationId: conversation._id });
        }
      });
    };
    fetchMessages();
  }, [conversation._id, socket, user._id]);

  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (message) => {
      if (message.conversationId === conversation._id) {
        setMessages(prev => [...prev, message]);
        if (message.senderId._id !== user._id) {
          socket.emit('read_receipt', { messageId: message._id, conversationId: conversation._id });
        }
      }
    });

    socket.on('typing', (data) => {
      if (data.conversationId === conversation._id && data.userId !== user._id) {
        setOtherUserTyping(data.isTyping);
      }
    });

    socket.on('message_seen', (data) => {
      if (data.conversationId === conversation._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId ? { ...msg, status: 'seen' } : msg
        ));
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('typing');
      socket.off('message_seen');
    };
  }, [socket, conversation._id, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('send_message', {
      conversationId: conversation._id,
      text: newMessage
    });

    setNewMessage('');
    socket.emit('typing', { conversationId: conversation._id, isTyping: false });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { conversationId: conversation._id, isTyping: true });
    }
    
    // Clear typing timeout
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { conversationId: conversation._id, isTyping: false });
    }, 2000);
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {otherUser?.username?.[0]?.toUpperCase() || 'G'}
          </div>
          {otherUser?.isOnline && <span className="status-dot" style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--bg-dark)' }}></span>}
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{otherUser?.username || conversation.name}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {otherUser?.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg, index) => {
          const isMe = msg.senderId._id === user._id || msg.senderId === user._id;
          return (
            <div key={msg._id || index} className={`message-bubble ${isMe ? 'sent' : 'received'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem' }}>{msg.text}</span>
                {isMe && (
                  <span className="msg-info" style={{ display: 'flex', alignItems: 'center' }}>
                    {msg.status === 'seen' ? <CheckCheck size={14} color="#60a5fa" /> : <Check size={14} color="rgba(255,255,255,0.6)" />}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {otherUserTyping && (
          <div className="message-bubble received" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', background: 'transparent', border: 'none' }}>
            Typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={handleTyping}
            style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', background: 'rgba(255,255,255,0.05)' }}
          />
          <button type="submit" className="btn" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

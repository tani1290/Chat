import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Check, CheckCheck, Paperclip, X } from 'lucide-react';
import CryptoJS from 'crypto-js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ChatWindow({ socket, conversation, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [attachment, setAttachment] = useState(null); // { name, base64 }
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const convId = String(conversation._id);
  const otherUser = conversation.participants?.find(p =>
    String(p._id || p) !== String(user._id)
  );

  const decrypt = (text) => {
    if (!text) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(text, convId);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      return original || text;
    } catch {
      return text;
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await axios.get(`${API}/api/messages/${convId}`);
      setMessages(res.data);
      res.data.forEach(msg => {
        const senderId = String(msg.senderId?._id || msg.senderId);
        if (senderId !== String(user._id) && msg.status !== 'seen') {
          socket?.emit('read_receipt', { messageId: msg._id, conversationId: convId });
        }
      });
    };
    fetchMessages();
  }, [convId, socket, user._id]);

  useEffect(() => {
    if (!socket) return;

    const onReceive = (message) => {
      if (String(message.conversationId) === convId) {
        setMessages(prev => [...prev, message]);
        const senderId = String(message.senderId?._id || message.senderId);
        if (senderId !== String(user._id)) {
          socket.emit('read_receipt', { messageId: message._id, conversationId: convId });
        }
      }
    };

    const onTyping = (data) => {
      if (String(data.conversationId) === convId && String(data.userId) !== String(user._id)) {
        setOtherUserTyping(data.isTyping);
      }
    };

    const onSeen = (data) => {
      if (String(data.conversationId) === convId) {
        setMessages(prev =>
          prev.map(msg => msg._id === data.messageId ? { ...msg, status: 'seen' } : msg)
        );
      }
    };

    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    socket.on('message_seen', onSeen);

    return () => {
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
      socket.off('message_seen', onSeen);
    };
  }, [socket, convId, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Max size is 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment({ name: file.name, base64: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    const encryptedText = newMessage.trim()
      ? CryptoJS.AES.encrypt(newMessage.trim(), convId).toString()
      : '';

    socket.emit('send_message', {
      conversationId: convId,
      text: encryptedText,
      attachment: attachment?.base64 || ''
    });

    setNewMessage('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    socket.emit('typing', { conversationId: convId, isTyping: false });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { conversationId: convId, isTyping: true });
    }
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { conversationId: convId, isTyping: false });
    }, 2000);
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-panel)' }}>
        <div style={{ position: 'relative' }}>
          {otherUser?.profilePicture ? (
            <img src={otherUser.profilePicture} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {(otherUser?.username?.[0] || 'G').toUpperCase()}
            </div>
          )}
          {otherUser?.isOnline && <span className="status-dot" style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--bg-dark)' }}></span>}
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{otherUser?.username || conversation.name}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {otherUser?.isOnline ? '🟢 Online' : '⚫ Offline'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {messages.map((msg, index) => {
          const senderId = String(msg.senderId?._id || msg.senderId);
          const isMe = senderId === String(user._id);
          const decryptedText = decrypt(msg.text);

          return (
            <div key={msg._id || index} className={`message-bubble ${isMe ? 'sent' : 'received'}`}>
              {msg.attachment && (
                <img
                  src={msg.attachment}
                  alt="attachment"
                  style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: decryptedText ? '8px' : '0', display: 'block' }}
                />
              )}
              {decryptedText && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '0.95rem' }}>{decryptedText}</span>
                  {isMe && (
                    <span className="msg-info" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {msg.status === 'seen'
                        ? <CheckCheck size={14} color="#10b981" />
                        : <Check size={14} color="rgba(255,255,255,0.5)" />}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {otherUserTyping && (
          <div className="message-bubble received" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', background: 'transparent', border: '1px dashed var(--border)', padding: '8px 14px' }}>
            {otherUser?.username || 'User'} is typing…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-panel)' }}>
          <img src={attachment.base64} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>{attachment.name}</span>
          <button onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '8px', display: 'flex', alignItems: 'center', borderRadius: '50%', transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            placeholder="Type a message…"
            value={newMessage}
            onChange={handleTyping}
            style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', background: 'var(--bg-dark)' }}
          />
          <button type="submit" className="btn" style={{ borderRadius: '50%', width: '46px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Camera, Save, Trash2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ROLE_INFO = {
  user: { label: 'Private Individual', desc: 'Standard private account. No public content.' },
  influencer: { label: 'Influencer', desc: 'Can broadcast posts to subscribers.' },
  corporate: { label: 'Corporate', desc: 'Verified business account.' }
};

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    bio: '',
    profilePicture: '',
    role: 'user',
    statusMessage: '',
    pronouns: '',
    location: ''
  });
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/api/users/profile`);
        const { bio, profilePicture, role, statusMessage, pronouns, location } = res.data;
        setProfile({
          bio: bio || '',
          profilePicture: profilePicture || '',
          role: role || 'user',
          statusMessage: statusMessage || '',
          pronouns: pronouns || '',
          location: location || ''
        });
        setPreview(profilePicture || '');
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'Image too large. Max 2MB allowed.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setProfile(p => ({ ...p, profilePicture: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/api/users/profile`, profile);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure? This will permanently delete your account and all your data.')) {
      try {
        await axios.delete(`${API}/api/users/profile`);
        logout();
      } catch (err) {
        setMessage({ text: 'Failed to delete account.', type: 'error' });
      }
    }
  };

  const field = (label, key, placeholder, type = 'text') => (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={profile[key]}
        onChange={(e) => setProfile(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="glass-panel" style={{ padding: '28px', maxWidth: '540px', width: '100%' }}>
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary)', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {preview ? (
              <img src={preview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {(user?.username?.[0] || '?').toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Change avatar"
            style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Camera size={13} color="white" />
          </button>
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        </div>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{user?.username}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>{user?.email}</p>
          <span style={{ marginTop: '6px', display: 'inline-block', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: 'var(--primary)', border: '1px solid rgba(16,185,129,0.3)', fontWeight: '600' }}>
            {ROLE_INFO[profile.role]?.label || profile.role}
          </span>
        </div>
      </div>

      {message.text && (
        <p style={{ color: message.type === 'success' ? 'var(--primary)' : 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem' }}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Role */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
            Account Role
          </label>
          <select value={profile.role} onChange={(e) => setProfile(p => ({ ...p, role: e.target.value }))}>
            {Object.entries(ROLE_INFO).map(([val, { label, desc }]) => (
              <option key={val} value={val}>{label} — {desc}</option>
            ))}
          </select>
        </div>

        {field('Status Message', 'statusMessage', 'What\'s on your mind?')}
        {field('Bio', 'bio', 'Tell the world about yourself…')}
        {field('Pronouns', 'pronouns', 'e.g. they/them, she/her')}
        {field('Location', 'location', 'e.g. New Delhi, India')}

        <button type="submit" className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
          <Save size={16} /> Save Changes
        </button>
      </form>

      <div style={{ marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '8px', fontSize: '0.95rem' }}>⚠ Danger Zone</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '12px' }}>
          Deleting your account is permanent and irreversible. All conversations and data will be lost.
        </p>
        <button
          onClick={handleDelete}
          className="btn"
          style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Trash2 size={16} /> Delete Account Permanently
        </button>
      </div>
    </div>
  );
}

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState({ bio: '', profilePicture: '', role: 'user' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`);
        setProfile({ bio: res.data.bio || '', profilePicture: res.data.profilePicture || '', role: res.data.role || 'user' });
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`, profile);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`);
        logout();
      } catch (err) {
        setMessage('Failed to delete account');
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', maxWidth: '500px', width: '100%' }}>
      <h2 style={{ marginBottom: '16px' }}>Manage Profile</h2>
      {message && <p style={{ color: 'var(--accent)', marginBottom: '16px' }}>{message}</p>}
      
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Role</label>
          <select 
            value={profile.role} 
            onChange={(e) => setProfile({...profile, role: e.target.value})}
          >
            <option value="user">User Account (Private Individual)</option>
            <option value="influencer">Influencer Account (Broadcast-Only)</option>
            <option value="corporate">Corporate Account (Verified Business)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Profile Picture URL</label>
          <input 
            type="text" 
            placeholder="https://example.com/avatar.png"
            value={profile.profilePicture} 
            onChange={(e) => setProfile({...profile, profilePicture: e.target.value})} 
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Bio</label>
          <textarea 
            rows="4"
            placeholder="Tell us about yourself..."
            value={profile.bio}
            onChange={(e) => setProfile({...profile, bio: e.target.value})}
          />
        </div>

        <button type="submit" className="btn">Save Changes</button>
      </form>

      <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Danger Zone</h3>
        <button 
          onClick={handleDelete} 
          className="btn" 
          style={{ background: 'var(--danger)', width: '100%' }}
        >
          Delete Account Permanently
        </button>
      </div>
    </div>
  );
}

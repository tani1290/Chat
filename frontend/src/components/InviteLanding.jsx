import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function InviteLanding() {
  const { code } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'connecting' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!code || code.length !== 12) {
      setStatus('error');
      setErrorMsg('This invite link is invalid.');
      return;
    }

    if (!user) {
      // Store the code and redirect to login — after login App.jsx will pick it up
      localStorage.setItem('pendingInviteCode', code);
      navigate('/login');
      return;
    }

    // User is logged in — auto-connect immediately
    setStatus('connecting');
    axios.post(`${API}/api/connections/connect`, { code })
      .then(res => {
        setStatus('success');
        setTimeout(() => navigate('/', { state: { openConversation: res.data } }), 1500);
      })
      .catch(err => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Failed to connect. The code may have expired or already been used.');
      });
  }, [code, user]);

  const icon = (path) => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-darker)', padding: '20px'
    }}>
      <div className="glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '40px 32px', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--primary)', animation: 'spin 1s linear infinite' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
            <h2 style={{ marginBottom: '8px' }}>Checking invite…</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Validating code <code style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{code}</code></p>
          </>
        )}

        {status === 'connecting' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--primary)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </div>
            <h2 style={{ marginBottom: '8px' }}>Connecting…</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Establishing a secure connection</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--primary)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Connected!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Redirecting you to your new conversation…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--danger)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 style={{ marginBottom: '8px', color: 'var(--danger)' }}>Invalid Invite</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>{errorMsg}</p>
            <button className="btn" onClick={() => navigate('/')} style={{ width: '100%' }}>
              Go to Dashboard
            </button>
          </>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

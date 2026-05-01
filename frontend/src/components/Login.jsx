import { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { Mail, Phone, Chrome } from 'lucide-react';

const TAB_STYLE = (active) => ({
  flex: 1,
  padding: '10px',
  background: active ? 'var(--primary)' : 'transparent',
  color: active ? 'white' : 'var(--text-muted)',
  border: 'none',
  borderBottom: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
  cursor: 'pointer',
  fontWeight: active ? '600' : '400',
  fontSize: '0.85rem',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
});

export default function Login() {
  const { login, loginWithGoogle, loginWithPhone } = useContext(AuthContext);
  const [tab, setTab] = useState('email'); // 'email' | 'phone'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email tab state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone tab state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const recaptchaRef = useRef(null);

  const wrap = async (fn) => {
    setError('');
    setLoading(true);
    try { await fn(); } catch (err) {
      setError(err.code
        ? err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim()
        : err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    wrap(() => login(email, password));
  };

  const handleGoogle = () => wrap(loginWithGoogle);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'invisible',
        callback: () => {},
      });
    }
    return window.recaptchaVerifier;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    wrap(async () => {
      const verifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmation(result);
    });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    wrap(() => loginWithPhone(confirmation, otp));
  };

  return (
    <div className="glass-panel auth-container" style={{ maxWidth: '420px', padding: '0' }}>
      {/* Header */}
      <div style={{ padding: '28px 28px 0' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem' }}>Welcome back</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 20px' }}>Sign in to your private space</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <button style={TAB_STYLE(tab === 'email')} onClick={() => setTab('email')}>
          <Mail size={14} /> Email
        </button>
        <button style={TAB_STYLE(tab === 'phone')} onClick={() => setTab('phone')}>
          <Phone size={14} /> Phone
        </button>
      </div>

      <div style={{ padding: '24px 28px 28px' }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#fca5a5', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Email / Password */}
        {tab === 'email' && (
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="email" placeholder="Email address" required value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="btn" disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Phone OTP */}
        {tab === 'phone' && (
          !confirmation ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="tel"
                placeholder="+91 98765 43210 (with country code)"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <div ref={recaptchaRef} />
              <button type="submit" className="btn" disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                OTP sent to <strong>{phone}</strong>
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                required
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem' }}
              />
              <button type="submit" className="btn" disabled={loading || otp.length !== 6} style={{ opacity: (loading || otp.length !== 6) ? 0.6 : 1 }}>
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => setConfirmation(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>
                ← Change phone number
              </button>
            </form>
          )
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '11px', borderRadius: '8px', background: 'var(--bg-dark)',
            border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontSize: '0.9rem', fontWeight: '500', transition: 'border-color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

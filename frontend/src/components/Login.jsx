import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, googleLogin } = useContext(AuthContext);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="glass-panel auth-container">
      <h2>Welcome Back</h2>
      {error && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="btn">Login</button>
      </form>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={credentialResponse => {
            googleLogin(credentialResponse.credential).catch(err => setError('Google Login Failed'));
          }}
          onError={() => {
            setError('Google Login Failed');
          }}
        />
      </div>
      <p style={{ marginTop: '16px', fontSize: '0.9rem' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Register</Link>
      </p>
    </div>
  );
}

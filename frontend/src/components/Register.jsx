import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, googleLogin } = useContext(AuthContext);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(username, email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="glass-panel auth-container">
      <h2>Create Account</h2>
      {error && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" required value={username} onChange={e => setUsername(e.target.value)} />
        <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="btn">Register</button>
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
        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login</Link>
      </p>
    </div>
  );
}

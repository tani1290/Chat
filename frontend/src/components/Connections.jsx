import { useState } from 'react';
import axios from 'axios';

export default function Connections({ onConnect }) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  const generateCode = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/connections/generate`);
      setGeneratedCode(res.data.code);
      setError('');
    } catch (err) {
      setError('Failed to generate code');
    }
  };

  const connectToUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/connections/connect`, { code: inputCode });
      setError('');
      setInputCode('');
      if (onConnect) onConnect(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '16px' }}>Establish Connection</h3>
      {error && <p style={{ color: 'var(--danger)', marginBottom: '10px' }}>{error}</p>}
      
      <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Share your 12-digit handshake code for someone to connect with you. Expires in 1 hour.
        </p>
        {generatedCode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 'bold' }}>{generatedCode}</span>
            <button className="btn" onClick={generateCode} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Regenerate</button>
          </div>
        ) : (
          <button className="btn" onClick={generateCode}>Generate Access Code</button>
        )}
      </div>

      <div style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Enter a 12-digit code provided by another user.
        </p>
        <form onSubmit={connectToUser} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="e.g. 123456789012" 
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 12))}
          />
          <button type="submit" className="btn">Connect</button>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Copy, Check, Clock, Share2, Link } from 'lucide-react';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EXPIRY_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '24 hours', value: 1440 },
  { label: 'Never', value: 0 },
];

function formatCountdown(ms) {
  if (ms <= 0) return 'Expired';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function Connections({ onConnect }) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [validUntil, setValidUntil] = useState(null);
  const [expiresIn, setExpiresIn] = useState(60);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef(null);

  // Countdown ticker
  useEffect(() => {
    if (!validUntil) {
      setCountdown('');
      clearInterval(timerRef.current);
      return;
    }
    const tick = () => {
      const remaining = new Date(validUntil) - Date.now();
      if (remaining <= 0) {
        setCountdown('Expired');
        setGeneratedCode('');
        setValidUntil(null);
        clearInterval(timerRef.current);
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [validUntil]);

  const generateCode = async () => {
    try {
      const res = await axios.post(`${API}/api/connections/generate`, { expiresIn });
      setGeneratedCode(res.data.code);
      setValidUntil(res.data.validUntil ? new Date(res.data.validUntil) : null);
      setError('');
      setCopied(false);
    } catch (err) {
      setError('Failed to generate code');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteLink = generatedCode ? `${APP_URL}/invite/${generatedCode}` : '';

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Privacy Chat',
          text: `You've been invited to connect securely. Click the link or enter code ${generatedCode} in the app.`,
          url: inviteLink,
        });
        return;
      } catch (e) { /* user cancelled */ }
    }
    // Fallback: copy link to clipboard
    copyLink();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const connectToUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API}/api/connections/connect`, { code: inputCode });
      setInputCode('');
      if (onConnect) onConnect(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect');
    }
  };

  // Progress bar for countdown
  const progressPct = (() => {
    if (!validUntil || !generatedCode) return 0;
    const total = expiresIn * 60 * 1000;
    const remaining = new Date(validUntil) - Date.now();
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  })();

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '4px', fontSize: '1.1rem' }}>Establish Connection</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
        Share a one-time code for consent-based connections. No one can find you without it.
      </p>

      {error && (
        <p style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '0.9rem' }}>{error}</p>
      )}

      {/* Generate Section */}
      <div style={{ marginBottom: '24px', padding: '18px', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Generate your secure 12-digit handshake code and share it privately.
        </p>

        {/* Expiry Picker */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {EXPIRY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExpiresIn(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: `1px solid ${expiresIn === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                background: expiresIn === opt.value ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: expiresIn === opt.value ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: expiresIn === opt.value ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {generatedCode ? (
          <div>
            {/* Code Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                fontSize: '1.5rem',
                letterSpacing: '4px',
                fontWeight: '700',
                fontFamily: 'monospace',
                color: 'var(--primary)',
                background: 'rgba(16,185,129,0.08)',
                padding: '10px 16px',
                borderRadius: '8px',
                flex: 1,
                textAlign: 'center',
                border: '1px solid rgba(16,185,129,0.3)'
              }}>
                {generatedCode}
              </span>
              <button
                onClick={copyCode}
                title="Copy code"
                style={{
                  background: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-panel)',
                  border: `1px solid ${copied ? 'var(--primary)' : 'var(--border)'}`,
                  color: copied ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '8px', padding: '10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {/* Share Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={shareLink}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '9px', borderRadius: '8px', border: '1px solid var(--primary)',
                  background: 'rgba(16,185,129,0.12)', color: 'var(--primary)',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
              >
                <Share2 size={15} /> Share Invite
              </button>
              <button
                onClick={copyLink}
                title="Copy invite link"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '9px', borderRadius: '8px',
                  border: `1px solid ${copiedLink ? 'var(--primary)' : 'var(--border)'}`,
                  background: copiedLink ? 'rgba(16,185,129,0.12)' : 'transparent',
                  color: copiedLink ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
                }}
              >
                {copiedLink ? <Check size={15} /> : <Link size={15} />}
                {copiedLink ? 'Link Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Invite Link Preview */}
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all', flex: 1, fontFamily: 'monospace' }}>
                {inviteLink}
              </span>
            </div>

            {/* Countdown Timer */}
            {validUntil ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.82rem', color: countdown === 'Expired' ? 'var(--danger)' : 'var(--text-muted)' }}>
                  <Clock size={13} />
                  <span>Expires in: <strong>{countdown}</strong></span>
                </div>
                <div style={{ height: '4px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    background: progressPct > 30 ? 'var(--primary)' : 'var(--danger)',
                    borderRadius: '4px',
                    transition: 'width 1s linear'
                  }} />
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>⏳ This code never expires until used.</p>
            )}

            <button className="btn" onClick={generateCode} style={{ marginTop: '12px', padding: '7px 14px', fontSize: '0.8rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Regenerate
            </button>
          </div>
        ) : (
          <button className="btn" onClick={generateCode} style={{ width: '100%' }}>
            Generate Access Code
          </button>
        )}
      </div>

      {/* Connect Section */}
      <div style={{ padding: '18px', background: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Enter a 12-digit code provided by another user to connect.
        </p>
        <form onSubmit={connectToUser} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="e.g. 123456789012"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 12))}
            style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
          />
          <button type="submit" className="btn" disabled={inputCode.length !== 12} style={{ opacity: inputCode.length !== 12 ? 0.5 : 1, flexShrink: 0 }}>
            Connect
          </button>
        </form>
      </div>
    </div>
  );
}

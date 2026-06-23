import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSessions } from '../api/sessionApi';
import thuggerTweet from '../assets/inspiration/thuggertweet.png';
import { t, btn } from '../theme';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllSessions()
      .then((data) => setSessions(data))
      .catch((err) => { if (err.response?.status !== 401) setError(err.response?.data?.message || 'Failed to load history'); })
      .finally(() => setLoading(false));
  }, []);

  const center = { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: '16px' };
  if (loading) return <div style={center}><p style={{ color: t.muted, fontFamily: t.serif, fontStyle: 'italic' }}>Loading…</p></div>;
  if (error) return <div style={center}><p style={{ color: t.error }}>{error}</p></div>;

  if (sessions.length === 0) return (
    <div style={center}>
      <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, fontSize: '17px' }}>Your crate is empty</p>
      <button onClick={() => navigate('/')} style={btn.primary}>Start a Session</button>
      <img src={thuggerTweet} alt="Young Thug tweet" style={{ maxWidth: '380px', borderRadius: '4px', opacity: 0.85, marginTop: '16px' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '28px' }}>
        <h1 style={{ fontFamily: t.serif, fontSize: '28px', fontWeight: '700', color: t.text }}>The Crate</h1>
        <button onClick={() => navigate('/')} style={{ ...btn.primary, padding: '8px 20px', fontSize: '12px', letterSpacing: '0.08em' }}>
          New Session
        </button>
      </div>

      <div>
        {sessions.map((s, i) => (
          <div
            key={s.id}
            onClick={() => navigate(`/scorecard/${s.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '14px 0', cursor: 'pointer',
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <span style={{ fontFamily: t.mono, fontSize: '11px', color: t.faint, minWidth: '24px' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <img src={s.albumArtUrl} alt={s.albumName} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: t.serif, fontWeight: '700', fontSize: '15px', color: t.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.albumName}
              </p>
              <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, fontSize: '13px', margin: '2px 0 0 0' }}>{s.albumArtist}</p>
              <p style={{ fontFamily: t.mono, fontSize: '10px', color: t.faint, margin: '4px 0 0 0' }}>
                {new Date(s.startedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {s.finalScore ? (
                <span style={{ fontFamily: t.mono, fontSize: '20px', fontWeight: '700', color: t.gold }}>
                  {parseFloat(s.finalScore).toFixed(1)}
                </span>
              ) : (
                <span style={{ fontFamily: t.mono, fontSize: '11px', color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {s.status.toLowerCase()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
        <img src={thuggerTweet} alt="Young Thug tweet" style={{ maxWidth: '380px', borderRadius: '4px', opacity: 0.75 }} />
      </div>
    </div>
  );
}

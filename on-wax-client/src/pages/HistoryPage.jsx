import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSessions } from '../api/sessionApi';
import thuggerTweet from '../assets/inspiration/thuggertweet.png';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllSessions()
      .then((data) => setSessions(data))
      .catch((err) => {
        if (err.response?.status !== 401) {
          setError(err.response?.data?.message || 'Failed to load history');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p>Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ fontSize: '18px', color: '#888' }}>No sessions yet</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '12px', padding: '10px 24px', cursor: 'pointer' }}>
          Start your first session
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
      <h1 style={{ marginBottom: '30px' }}>History</h1>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => navigate(`/scorecard/${s.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px',
              marginBottom: '8px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
            }}
          >
            <img
              src={s.albumArtUrl}
              alt={s.albumName}
              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0', fontWeight: 'bold' }}>{s.albumName}</p>
              <p style={{ margin: '2px 0 0 0', color: '#888', fontSize: '14px' }}>{s.albumArtist}</p>
              <p style={{ margin: '2px 0 0 0', color: '#888', fontSize: '12px' }}>
                {new Date(s.startedAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {s.finalScore ? (
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>{s.finalScore}</p>
              ) : (
                <p style={{ margin: '0', fontSize: '14px', color: '#888' }}>{s.status}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 24px', cursor: 'pointer' }}>
        New Session
      </button>
      <img src={thuggerTweet} alt="Young Thug tweet" style={{ maxWidth: '400px', borderRadius: '8px', marginTop: '30px' }} />
    </div>
  );
}

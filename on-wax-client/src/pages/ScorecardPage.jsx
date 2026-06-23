import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById } from '../api/sessionApi';

export default function ScorecardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSessionById(id)
      .then((data) => setSession(data))
      .catch((err) => {
        if (err.response?.status !== 401) {
          setError(err.response?.data?.message || 'Failed to load scorecard');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p>Loading scorecard...</p>
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

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: '#888' }}>Session not found</p>
      </div>
    );
  }

  const ratedTracks = session.ratings?.filter((r) => !r.skipped) || [];
  const skippedTracks = session.ratings?.filter((r) => r.skipped && !r.autoSkipped) || [];
  const autoSkippedTracks = session.ratings?.filter((r) => r.autoSkipped) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
      <img
        src={session.albumArtUrl}
        alt={session.albumName}
        style={{ width: '200px', height: '200px', objectFit: 'cover' }}
      />
      <h1 style={{ marginTop: '20px', marginBottom: '4px' }}>{session.albumName}</h1>
      <p style={{ color: '#888', margin: '4px 0', fontSize: '18px' }}>{session.albumArtist}</p>

      {session.finalScore && (
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', fontWeight: 'bold', margin: '0' }}>{session.finalScore}</p>
          <p style={{ color: '#888', margin: '4px 0' }}>/ 10</p>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '500px', marginTop: '20px' }}>
        {session.ratings
          ?.sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
          .map((r, index) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <div>
                <span>{index + 1}. {r.trackName}</span>
                {r.note && <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#888' }}>{r.note}</p>}
              </div>
              <span style={{ color: r.skipped ? '#888' : 'inherit', fontWeight: r.skipped ? 'normal' : 'bold' }}>
                {r.skipped ? (r.autoSkipped ? 'Auto-skipped' : 'Skipped') : `${r.rating}/10`}
              </span>
            </div>
          ))}
      </div>

      <p style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
        {ratedTracks.length} rated · {skippedTracks.length} skipped · {autoSkippedTracks.length} auto-skipped
      </p>

      <iframe
        width="315"
        height="560"
        src="https://www.youtube.com/embed/8odQWosfD58"
        title="YouTube Short"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ marginTop: '30px', borderRadius: '8px', border: 'none' }}
      />

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={() => navigate('/')} style={{ padding: '10px 24px', cursor: 'pointer' }}>
          New Session
        </button>
        <button onClick={() => navigate('/history')} style={{ padding: '10px 24px', cursor: 'pointer', background: 'transparent', border: '1px solid #ccc' }}>
          History
        </button>
      </div>
    </div>
  );
}

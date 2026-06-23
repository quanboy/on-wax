import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById } from '../api/sessionApi';
import VinylRecord from '../components/VinylRecord';
import { t, btn } from '../theme';

export default function ScorecardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSessionById(id)
      .then((data) => setSession(data))
      .catch((err) => { if (err.response?.status !== 401) setError(err.response?.data?.message || 'Failed to load scorecard'); })
      .finally(() => setLoading(false));
  }, [id]);

  const center = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' };
  if (loading) return <div style={center}><p style={{ color: t.muted, fontFamily: t.serif, fontStyle: 'italic' }}>Loading…</p></div>;
  if (error) return <div style={center}><p style={{ color: t.error }}>{error}</p></div>;
  if (!session) return <div style={center}><p style={{ color: t.muted }}>Session not found</p></div>;

  const ratedTracks = session.ratings?.filter((r) => !r.skipped) || [];
  const skippedTracks = session.ratings?.filter((r) => r.skipped && !r.autoSkipped) || [];
  const autoSkippedTracks = session.ratings?.filter((r) => r.autoSkipped) || [];

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px' }}>

      {/* Album + vinyl */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <VinylRecord src={session.albumArtUrl} alt={session.albumName} size={220} />
        <h1 style={{ fontFamily: t.serif, fontSize: '26px', fontWeight: '700', color: t.text, marginTop: '28px', marginBottom: '4px', textAlign: 'center' }}>
          {session.albumName}
        </h1>
        <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, fontSize: '16px' }}>{session.albumArtist}</p>
      </div>

      {/* Score */}
      {session.finalScore && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', border: `2px solid ${t.accent}`, borderRadius: '2px', padding: '16px 40px' }}>
            <p style={{ fontFamily: t.mono, fontSize: '52px', fontWeight: '700', color: t.gold, lineHeight: 1, margin: 0 }}>
              {parseFloat(session.finalScore).toFixed(1)}
            </p>
            <p style={{ fontFamily: t.serif, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.muted, marginTop: '6px' }}>
              out of 10
            </p>
          </div>
        </div>
      )}

      {/* Track list */}
      <div style={{ marginBottom: '24px' }}>
        {session.ratings
          ?.sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
          .map((r) => (
            <div key={r.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '12px 0', borderBottom: `1px solid ${t.border}`,
            }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'baseline', flex: 1 }}>
                <span style={{ fontFamily: t.mono, fontSize: '11px', color: t.muted, minWidth: '24px', flexShrink: 0 }}>
                  {String(r.trackNumber).padStart(2, '0')}
                </span>
                <div>
                  <span style={{ fontFamily: t.serif, fontSize: '14px', color: r.skipped ? t.muted : t.text }}>{r.trackName}</span>
                  {r.note && <p style={{ fontFamily: t.serif, fontStyle: 'italic', fontSize: '12px', color: t.muted, marginTop: '3px' }}>"{r.note}"</p>}
                </div>
              </div>
              <span style={{ fontFamily: t.mono, fontSize: '13px', fontWeight: '700', color: r.skipped ? t.faint : t.gold, flexShrink: 0, marginLeft: '16px' }}>
                {r.skipped ? (r.autoSkipped ? 'auto' : 'skip') : `${r.rating}/10`}
              </span>
            </div>
          ))}
      </div>

      {/* Stats */}
      <p style={{ fontFamily: t.mono, fontSize: '11px', color: t.muted, letterSpacing: '0.05em', textAlign: 'center', marginBottom: '32px' }}>
        {ratedTracks.length} rated · {skippedTracks.length} skipped · {autoSkippedTracks.length} auto-skipped
      </p>

      {/* YouTube */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <iframe
          width="315" height="560"
          src="https://www.youtube.com/embed/8odQWosfD58"
          title="YouTube Short" frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen style={{ borderRadius: '4px', border: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button onClick={() => navigate('/')} style={btn.primary}>New Session</button>
        <button onClick={() => navigate('/history')} style={btn.ghost}>History</button>
      </div>
    </div>
  );
}

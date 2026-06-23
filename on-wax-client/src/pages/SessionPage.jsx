import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSession, getSessionById, abandonSession } from '../api/sessionApi';
import { getNowPlaying } from '../api/spotifyApi';
import { submitRating } from '../api/ratingApi';
import { t, btn } from '../theme';

export default function SessionPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [rating, setRating] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const prevNowPlayingRef = useRef(null);
  const sessionRef = useRef(null);

  const fetchSession = (sessionId) => {
    const request = sessionId ? getSessionById(sessionId) : getActiveSession();
    request.then((data) => {
      if (!data) { navigate('/'); return; }
      if (data.status === 'COMPLETED') { navigate(`/scorecard/${data.id}`); return; }
      setSession(data);
      sessionRef.current = data;
    }).catch((err) => {
      if (err.response?.status !== 401) setFetchError(err.response?.data?.message || 'Failed to load session');
    }).finally(() => setLoading(false));
  };

  const fetchNowPlaying = () => {
    getNowPlaying().then((data) => {
      const prev = prevNowPlayingRef.current;
      const currentSession = sessionRef.current;
      if (prev && data && prev.spotifyTrackId !== data.spotifyTrackId && currentSession &&
          !currentSession.ratings?.some((r) => r.spotifyTrackId === prev.spotifyTrackId)) {
        submitRating({
          sessionId: currentSession.id, spotifyTrackId: prev.spotifyTrackId,
          trackName: prev.trackName, trackNumber: prev.trackNumber,
          discNumber: prev.discNumber, rating: null, skipped: true, autoSkipped: true, note: null,
        }).then(() => fetchSession(currentSession.id));
      }
      prevNowPlayingRef.current = data;
      setNowPlaying(data);
    }).catch(() => setNowPlaying(null));
  };

  useEffect(() => {
    fetchSession();
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, []);

  const isTrackRated = (trackId) => session?.ratings?.some((r) => r.spotifyTrackId === trackId);
  const getTrackRating = (trackId) => session?.ratings?.find((r) => r.spotifyTrackId === trackId);

  const handleSubmit = async () => {
    if (!nowPlaying || (!rating && rating !== 0)) return;
    setSubmitting(true); setError(null);
    try {
      await submitRating({
        sessionId: session.id, spotifyTrackId: nowPlaying.spotifyTrackId,
        trackName: nowPlaying.trackName, trackNumber: nowPlaying.trackNumber,
        discNumber: nowPlaying.discNumber, rating, skipped: false, note: note || null,
      });
      setRating(null); setNote('');
      fetchSession(session.id);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to submit rating'); }
    finally { setSubmitting(false); }
  };

  const handleSkip = async () => {
    if (!nowPlaying) return;
    setSubmitting(true); setError(null);
    try {
      await submitRating({
        sessionId: session.id, spotifyTrackId: nowPlaying.spotifyTrackId,
        trackName: nowPlaying.trackName, trackNumber: nowPlaying.trackNumber,
        discNumber: nowPlaying.discNumber, rating: null, skipped: true, note: null,
      });
      setRating(null); setNote('');
      fetchSession(session.id);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to skip track'); }
    finally { setSubmitting(false); }
  };

  const handleAbandon = async () => {
    if (!window.confirm('Abandon this session?')) return;
    try { await abandonSession(session.id); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Failed to abandon session'); }
  };

  const center = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' };
  if (loading) return <div style={center}><p style={{ color: t.muted, fontFamily: t.serif, fontStyle: 'italic' }}>Loading session…</p></div>;
  if (fetchError) return <div style={center}><p style={{ color: t.error }}>{fetchError}</p></div>;
  if (!session) return <div style={center}><p style={{ color: t.muted }}>No active session</p></div>;

  const ratedCount = session.ratings?.length || 0;
  const currentTrackRated = nowPlaying && isTrackRated(nowPlaying.spotifyTrackId);
  const existingRating = nowPlaying && getTrackRating(nowPlaying.spotifyTrackId);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Album header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: `1px solid ${t.border}` }}>
        <img src={session.albumArtUrl} alt={session.albumName} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }} />
        <div>
          <h2 style={{ fontFamily: t.serif, fontSize: '22px', fontWeight: '700', color: t.text, margin: '0 0 4px 0' }}>{session.albumName}</h2>
          <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, margin: '0 0 10px 0', fontSize: '15px' }}>{session.albumArtist}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ height: '2px', width: `${(ratedCount / session.totalTracks) * 80}px`, background: t.accent, transition: 'width 0.4s ease', minWidth: '2px' }} />
            <span style={{ fontFamily: t.mono, fontSize: '11px', color: t.muted, letterSpacing: '0.05em' }}>
              {ratedCount} / {session.totalTracks}
            </span>
          </div>
        </div>
      </div>

      {/* Now playing */}
      {nowPlaying && nowPlaying.isPlaying ? (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontFamily: t.serif, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.muted, marginBottom: '6px' }}>Now Playing</p>
          <p style={{ fontFamily: t.serif, fontSize: '19px', color: t.text, marginBottom: '4px' }}>
            {nowPlaying.trackName}
          </p>
          <p style={{ fontFamily: t.mono, fontSize: '11px', color: t.muted }}>Track {nowPlaying.trackNumber}</p>
          {currentTrackRated && (
            <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.accent, marginTop: '8px', fontSize: '14px' }}>
              {existingRating.skipped ? '— skipped' : `Rated ${existingRating.rating}/10`}
            </p>
          )}
        </div>
      ) : (
        <p style={{ color: t.muted, fontFamily: t.serif, fontStyle: 'italic', marginBottom: '24px' }}>
          Nothing playing — put on a track from this album
        </p>
      )}

      {/* Rating controls */}
      {nowPlaying && nowPlaying.isPlaying && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <button key={n} onClick={() => setRating(n)} style={{
                width: '42px', height: '42px',
                fontFamily: t.mono, fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', border: `1px solid ${rating === n ? t.accent : t.border}`,
                borderRadius: '2px',
                background: rating === n ? t.accent : t.surface,
                color: rating === n ? '#0e0a06' : t.muted,
                transition: 'all 0.15s ease',
              }}>
                {n}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', marginBottom: '14px',
              background: t.surface, border: `1px solid ${t.border}`,
              color: t.text, fontFamily: t.serif, fontStyle: 'italic', fontSize: '14px',
              borderRadius: '2px', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSubmit} disabled={!rating || submitting} style={{
              ...btn.primary,
              opacity: (!rating || submitting) ? 0.4 : 1,
            }}>
              {currentTrackRated ? 'Update' : 'Rate'}
            </button>
            <button onClick={handleSkip} disabled={submitting} style={btn.ghost}>
              Skip
            </button>
          </div>
          {error && <p style={{ color: t.error, marginTop: '12px', fontSize: '13px' }}>{error}</p>}
        </div>
      )}

      {/* Rated tracks */}
      {session.ratings && session.ratings.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <p style={{ fontFamily: t.serif, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.muted, marginBottom: '12px' }}>Ratings</p>
          {session.ratings
            .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
            .map((r) => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: `1px solid ${t.border}`,
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: t.mono, fontSize: '11px', color: t.muted, minWidth: '22px' }}>
                    {String(r.trackNumber).padStart(2, '0')}
                  </span>
                  <span style={{ fontFamily: t.serif, fontSize: '14px', color: r.skipped ? t.muted : t.text }}>{r.trackName}</span>
                </div>
                <span style={{ fontFamily: t.mono, fontSize: '12px', color: r.skipped ? t.faint : t.accent }}>
                  {r.skipped ? (r.autoSkipped ? 'auto' : 'skip') : `${r.rating}/10`}
                </span>
              </div>
            ))}
        </div>
      )}

      <button onClick={handleAbandon} style={{ ...btn.ghost, marginTop: '36px', fontSize: '11px', letterSpacing: '0.08em', color: t.faint, borderColor: t.faint }}>
        Abandon Session
      </button>
    </div>
  );
}

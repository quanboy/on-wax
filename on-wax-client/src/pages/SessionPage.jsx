import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSession, getSessionById, abandonSession } from '../api/sessionApi';
import { getNowPlaying } from '../api/spotifyApi';
import { submitRating } from '../api/ratingApi';

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

  const fetchSession = (sessionId) => {
    const request = sessionId ? getSessionById(sessionId) : getActiveSession();
    request
      .then((data) => {
        if (!data) {
          navigate('/');
          return;
        }
        if (data.status === 'COMPLETED') {
          navigate(`/scorecard/${data.id}`);
          return;
        }
        setSession(data);
      })
      .catch((err) => {
        if (err.response?.status !== 401) {
          setFetchError(err.response?.data?.message || 'Failed to load session');
        }
      })
      .finally(() => setLoading(false));
  };

  const fetchNowPlaying = () => {
    getNowPlaying()
      .then((data) => setNowPlaying(data))
      .catch(() => setNowPlaying(null));
  };

  useEffect(() => {
    fetchSession();
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, []);

  const isTrackRated = (trackId) => {
    return session?.ratings?.some((r) => r.spotifyTrackId === trackId);
  };

  const getTrackRating = (trackId) => {
    return session?.ratings?.find((r) => r.spotifyTrackId === trackId);
  };

  const handleSubmit = async () => {
    if (!nowPlaying || (!rating && rating !== 0)) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitRating({
        sessionId: session.id,
        spotifyTrackId: nowPlaying.spotifyTrackId,
        trackName: nowPlaying.trackName,
        trackNumber: nowPlaying.trackNumber,
        discNumber: nowPlaying.discNumber,
        rating: rating,
        skipped: false,
        note: note || null,
      });
      setRating(null);
      setNote('');
      fetchSession(session.id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!nowPlaying) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitRating({
        sessionId: session.id,
        spotifyTrackId: nowPlaying.spotifyTrackId,
        trackName: nowPlaying.trackName,
        trackNumber: nowPlaying.trackNumber,
        discNumber: nowPlaying.discNumber,
        rating: null,
        skipped: true,
        note: null,
      });
      setRating(null);
      setNote('');
      fetchSession(session.id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to skip track');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm('Are you sure you want to abandon this session?')) return;
    try {
      await abandonSession(session.id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to abandon session');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'red' }}>{fetchError}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: '#888' }}>No active session</p>
      </div>
    );
  }

  const ratedCount = session.ratings?.length || 0;
  const currentTrackRated = nowPlaying && isTrackRated(nowPlaying.spotifyTrackId);
  const existingRating = nowPlaying && getTrackRating(nowPlaying.spotifyTrackId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      {/* Album header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
        <img
          src={session.albumArtUrl}
          alt={session.albumName}
          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
        />
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>{session.albumName}</h2>
          <p style={{ margin: '0', color: '#888' }}>{session.albumArtist}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
            {ratedCount} / {session.totalTracks} tracks rated
          </p>
        </div>
      </div>

      {/* Now playing */}
      {nowPlaying && nowPlaying.isPlaying ? (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#888', margin: '0 0 4px 0' }}>Now Playing</p>
          <p style={{ fontSize: '18px', margin: '0' }}>
            Track {nowPlaying.trackNumber}: {nowPlaying.trackName}
          </p>
          {currentTrackRated && (
            <p style={{ color: '#4caf50', margin: '8px 0 0 0' }}>
              {existingRating.skipped ? 'Skipped' : `Rated: ${existingRating.rating}/10`}
            </p>
          )}
        </div>
      ) : (
        <p style={{ color: '#888', marginBottom: '20px' }}>Nothing playing — play a track from this album</p>
      )}

      {/* Rating controls */}
      {nowPlaying && nowPlaying.isPlaying && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                style={{
                  width: '36px',
                  height: '36px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: rating === n ? '#1db954' : 'transparent',
                  color: rating === n ? '#fff' : 'inherit',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: '300px', padding: '8px', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={!rating || submitting}
              style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer' }}
            >
              {currentTrackRated ? 'Update Rating' : 'Submit Rating'}
            </button>
            <button
              onClick={handleSkip}
              disabled={submitting}
              style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer', background: 'transparent', border: '1px solid #ccc' }}
            >
              Skip
            </button>
          </div>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
      )}

      {/* Rated tracks list */}
      {session.ratings && session.ratings.length > 0 && (
        <div style={{ width: '100%', maxWidth: '500px', marginTop: '20px' }}>
          <h3>Ratings</h3>
          {session.ratings
            .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
            .map((r, index) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span>
                  {index + 1}. {r.trackName}
                </span>
                <span style={{ color: r.skipped ? '#888' : 'inherit' }}>
                  {r.skipped ? 'Skipped' : `${r.rating}/10`}
                </span>
              </div>
            ))}
        </div>
      )}

      <button
        onClick={handleAbandon}
        style={{
          marginTop: '30px',
          padding: '8px 20px',
          fontSize: '14px',
          cursor: 'pointer',
          background: 'transparent',
          border: '1px solid #ccc',
          color: '#888',
        }}
      >
        Abandon Session
      </button>
    </div>
  );
}

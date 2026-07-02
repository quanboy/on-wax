import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNowPlaying } from '../api/spotifyApi';
import { getActiveSession, createSession } from '../api/sessionApi';
import VinylRecord from '../components/VinylRecord';
import coleTweet from '../assets/inspiration/coletweet.png';
import { t, btn } from '../theme';

export default function HomePage() {
  const navigate = useNavigate();
  const [nowPlaying, setNowPlaying] = useState(null);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getActiveSession().then((session) => { if (session) navigate('/session'); })
        .catch((err) => { if (err.response?.status !== 401) setFetchError(err.response?.data?.message || 'Failed to check active session'); }),
      getNowPlaying().then((data) => { setAuthenticated(true); setNowPlaying(data); })
        .catch((err) => { if (err.response?.status === 401) setAuthenticated(false); else setFetchError(err.response?.data?.message || 'Failed to fetch now playing'); }),
    ]).finally(() => setLoading(false));
  }, [navigate]);

  const fetchNowPlaying = () => {
    getNowPlaying().then((data) => { setAuthenticated(true); setNowPlaying(data); })
      .catch((err) => {
        if (err.response?.status === 401) {
          setAuthenticated(false);
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        } else { setNowPlaying(null); }
      });
  };

  useEffect(() => {
    intervalRef.current = setInterval(fetchNowPlaying, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleStartSession = async () => {
    setError(null);
    try { await createSession(); navigate('/session'); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Failed to start session'); }
  };

  const center = { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', gap: '20px' };

  if (loading) return <div style={center}><p style={{ color: t.muted, fontFamily: t.serif, letterSpacing: '0.1em', fontSize: '13px', textTransform: 'uppercase' }}>Loading…</p></div>;
  if (fetchError) return <div style={center}><p style={{ color: t.error }}>{fetchError}</p></div>;

  if (!authenticated) return (
    <div style={center}>
      <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, fontSize: '16px' }}>Connect your Spotify to start rating</p>
      <button onClick={() => window.location.assign(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'}/spotify/login`)} style={{ ...btn.primary, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Connect Spotify
      </button>
    </div>
  );

  if (!nowPlaying || !nowPlaying.isPlaying) return (
    <div style={center}>
      <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, fontSize: '17px' }}>Nothing on the turntable</p>
      <img src={coleTweet} alt="J. Cole tweet" style={{ maxWidth: '380px', borderRadius: '4px', opacity: 0.85, marginTop: '8px' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
      <p style={{ fontFamily: t.serif, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.muted, marginBottom: '32px' }}>
        Now on the Turntable
      </p>
      <VinylRecord src={nowPlaying.albumArtUrl} alt={nowPlaying.albumName} size={260} />
      <h2 style={{ fontFamily: t.serif, fontSize: '26px', fontWeight: '700', color: t.text, marginTop: '36px', marginBottom: '6px', textAlign: 'center' }}>
        {nowPlaying.albumName}
      </h2>
      <p style={{ color: t.muted, fontFamily: t.serif, fontStyle: 'italic', fontSize: '16px', marginBottom: '6px' }}>
        {nowPlaying.albumArtist}
      </p>
      <p style={{ color: t.faint, fontFamily: t.mono, fontSize: '12px', letterSpacing: '0.05em', marginBottom: '32px' }}>
        Track {nowPlaying.trackNumber} — {nowPlaying.trackName}
      </p>
      <button onClick={handleStartSession} style={btn.primary}>
        Start Session
      </button>
      {error && <p style={{ color: t.error, marginTop: '14px', fontSize: '14px' }}>{error}</p>}
    </div>
  );
}

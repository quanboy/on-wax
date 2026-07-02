import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNowPlaying } from '../api/spotifyApi';
import { getActiveSession, createSession } from '../api/sessionApi';
import VinylRecord from '../components/VinylRecord';
import coleTweet from '../assets/inspiration/coletweet.png';
import { t, btn } from '../theme';

const heroBtn = {
  fontFamily: t.mono,
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  padding: '16px 34px',
  borderRadius: '4px',
};

function StatusLine({ children }) {
  return (
    <p style={{
      fontFamily: t.mono, fontSize: '12px', letterSpacing: '0.35em',
      textTransform: 'uppercase', color: t.accent, margin: 0,
    }}>
      <span style={{ marginRight: '10px' }}>●</span>{children}
    </p>
  );
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

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
      <button onClick={() => window.location.assign(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'}/spotify/login`)} style={{ ...btn.primary, ...heroBtn }}>
        Connect Spotify
      </button>
    </div>
  );

  // --- Idle turntable ---
  if (!nowPlaying || !nowPlaying.isPlaying) return (
    <div style={{ ...center, minHeight: '85vh', gap: 0, padding: '40px 24px' }}>
      <VinylRecord size={300} />
      <div style={{ marginTop: '56px' }}>
        <StatusLine>Turntable — Idle</StatusLine>
      </div>
      <h1 style={{
        fontFamily: t.serif, fontStyle: 'italic', fontWeight: '500', fontSize: 'clamp(38px, 5vw, 56px)',
        color: t.text, margin: '18px 0 22px 0', textAlign: 'center',
      }}>
        Nothing on the turntable
      </h1>
      <p style={{ fontFamily: t.serif, color: t.muted, fontSize: '19px', lineHeight: 1.7, textAlign: 'center', margin: 0 }}>
        Pick a record, spin it once, and leave your verdict.<br />
        First listen, one shot — that's the ritual.
      </p>
      <div style={{ display: 'flex', gap: '16px', marginTop: '44px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => window.open('https://open.spotify.com', '_blank', 'noopener')} style={{ ...btn.primary, ...heroBtn }}>
          Drop a Record
        </button>
        <button onClick={() => navigate('/feed')} style={{ ...btn.ghost, ...heroBtn }}>
          Browse the Feed
        </button>
      </div>
    </div>
  );

  // --- Now spinning ---
  const { albumName, albumArtist, albumArtUrl, trackNumber, totalTracks, progressMs, durationMs, releaseYear } = nowPlaying;
  const side = trackNumber <= Math.ceil(totalTracks / 2) ? 'A' : 'B';
  const progressPct = durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;
  const metadata = [releaseYear, `${totalTracks} tracks`].filter(Boolean).join(' · ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '72px',
        flexWrap: 'wrap', maxWidth: '1200px', width: '100%', minHeight: '60vh',
      }}>
        <VinylRecord src={albumArtUrl} alt={albumName} size={400} spinning artRatio={0.62} />
        <div style={{ flex: 1, minWidth: '340px', maxWidth: '560px' }}>
          <StatusLine>Now Spinning — First Listen</StatusLine>
          <h1 style={{
            fontFamily: t.serif, fontStyle: 'italic', fontWeight: '600', fontSize: 'clamp(36px, 4.5vw, 58px)',
            color: t.text, margin: '20px 0 10px 0', lineHeight: 1.1,
          }}>
            {albumName}
          </h1>
          <p style={{ fontFamily: t.serif, color: t.text, fontSize: '24px', margin: '0 0 10px 0', opacity: 0.85 }}>
            {albumArtist}
          </p>
          <p style={{ fontFamily: t.mono, color: t.muted, fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 36px 0' }}>
            {metadata}
          </p>

          <div style={{ height: '4px', background: t.faint, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: t.accent, borderRadius: '2px' }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontFamily: t.mono, fontSize: '12px', letterSpacing: '0.12em', color: t.muted, margin: '10px 0 40px 0',
          }}>
            <span>{formatTime(progressMs)}</span>
            <span style={{ textTransform: 'uppercase' }}>Side {side} · Track {trackNumber}</span>
            <span>{formatTime(durationMs)}</span>
          </div>

          <button onClick={handleStartSession} style={{ ...btn.primary, ...heroBtn }}>
            Leave Your Verdict
          </button>
          {error && <p style={{ color: t.error, marginTop: '14px', fontSize: '14px' }}>{error}</p>}
        </div>
      </div>
      <img src={coleTweet} alt="J. Cole tweet" style={{ maxWidth: '440px', width: '100%', borderRadius: '8px', opacity: 0.9, marginTop: '48px' }} />
    </div>
  );
}

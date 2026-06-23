import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNowPlaying } from '../api/spotifyApi';
import { getActiveSession, createSession } from '../api/sessionApi';
import coleTweet from '../assets/inspiration/coletweet.png';

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
      getActiveSession()
        .then((session) => {
          if (session) navigate('/session');
        })
        .catch((err) => {
          if (err.response?.status !== 401) {
            setFetchError(err.response?.data?.message || 'Failed to check active session');
          }
        }),
      getNowPlaying()
        .then((data) => {
          setAuthenticated(true);
          setNowPlaying(data);
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            setAuthenticated(false);
          } else {
            setFetchError(err.response?.data?.message || 'Failed to fetch now playing');
          }
        }),
    ]).finally(() => setLoading(false));
  }, [navigate]);

  const fetchNowPlaying = () => {
    getNowPlaying()
      .then((data) => {
        setAuthenticated(true);
        setNowPlaying(data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setAuthenticated(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setNowPlaying(null);
        }
      });
  };

  useEffect(() => {
    intervalRef.current = setInterval(fetchNowPlaying, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStartSession = async () => {
    setError(null);
    try {
      await createSession();
      navigate('/session');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start session');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p>Loading...</p>
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

  if (!authenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <button onClick={() => { window.location.assign(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'}/spotify/login`); }} style={{ padding: '12px 24px', fontSize: '18px', cursor: 'pointer' }}>
          Connect Spotify
        </button>
      </div>
    );
  }

  if (!nowPlaying || !nowPlaying.isPlaying) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '20px' }}>
        <p style={{ fontSize: '18px', color: '#888' }}>Nothing playing on Spotify</p>
        <img src={coleTweet} alt="J. Cole tweet" style={{ maxWidth: '400px', borderRadius: '8px' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
      <img
        src={nowPlaying.albumArtUrl}
        alt={nowPlaying.albumName}
        style={{ width: '300px', height: '300px', objectFit: 'cover' }}
      />
      <h2 style={{ marginTop: '20px', marginBottom: '4px' }}>{nowPlaying.albumName}</h2>
      <p style={{ color: '#888', margin: '4px 0' }}>{nowPlaying.albumArtist}</p>
      <p style={{ margin: '4px 0' }}>
        Track {nowPlaying.trackNumber}: {nowPlaying.trackName}
      </p>
      <button
        onClick={handleStartSession}
        style={{ marginTop: '20px', padding: '12px 24px', fontSize: '16px', cursor: 'pointer' }}
      >
        Start Session
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeed } from '../api/userApi';
import { t } from '../theme';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function FeedPage() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFeed().then(setFeed).catch(() => setError('Failed to load feed.')).finally(() => setLoading(false));
  }, []);

  const center = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' };
  if (loading) return <div style={center}><p style={{ color: t.muted, fontFamily: t.serif, fontStyle: 'italic' }}>Loading…</p></div>;
  if (error) return <div style={center}><p style={{ color: t.error }}>{error}</p></div>;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: t.serif, fontSize: '28px', fontWeight: '700', color: t.text, marginBottom: '28px' }}>
        What's Spinning
      </h1>

      {feed.length === 0 ? (
        <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, fontSize: '16px' }}>
          Follow some listeners to see what they're rating.
        </p>
      ) : (
        <div>
          {feed.map((item) => (
            <Link key={item.sessionId} to={`/scorecard/${item.sessionId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                display: 'flex', gap: '16px', alignItems: 'center',
                padding: '14px 0', borderBottom: `1px solid ${t.border}`,
                cursor: 'pointer',
              }}>
                {item.albumArtUrl && (
                  <img src={item.albumArtUrl} alt={item.albumName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: t.serif, fontWeight: '700', fontSize: '15px', color: t.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.albumName}
                  </p>
                  <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, fontSize: '13px', margin: '2px 0 6px 0' }}>{item.albumArtist}</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', fontFamily: t.mono }}>
                    <Link to={`/users/${item.username}`} onClick={e => e.stopPropagation()}
                      style={{ color: t.accent, textDecoration: 'none' }}>
                      @{item.username}
                    </Link>
                    <span style={{ color: t.faint }}>·</span>
                    <span style={{ color: t.muted }}>{timeAgo(item.completedAt)}</span>
                  </div>
                </div>
                {item.finalScore != null && (
                  <span style={{ fontFamily: t.mono, fontSize: '22px', fontWeight: '700', color: t.gold, flexShrink: 0 }}>
                    {parseFloat(item.finalScore).toFixed(1)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

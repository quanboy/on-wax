import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeed } from '../api/userApi';

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
    getFeed()
      .then(setFeed)
      .catch(() => setError('Failed to load feed.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#aaa' }}>Loading...</div>;
  if (error) return <div style={{ padding: '40px', color: '#f55' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px', color: '#fff' }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Feed</div>
      {feed.length === 0 ? (
        <div style={{ color: '#666', fontSize: '14px' }}>
          Nothing here yet. Follow some listeners to see their sessions.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {feed.map((item) => (
            <Link
              key={item.sessionId}
              to={`/scorecard/${item.sessionId}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: '#1a1a1a',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
              }}>
                {item.albumArtUrl && (
                  <img
                    src={item.albumArtUrl}
                    alt={item.albumName}
                    style={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.albumName}
                  </div>
                  <div style={{ color: '#888', fontSize: '13px' }}>{item.albumArtist}</div>
                  <div style={{ marginTop: '6px', fontSize: '13px', color: '#aaa' }}>
                    <Link to={`/users/${item.username}`} style={{ color: '#1db954', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}>
                      @{item.username}
                    </Link>
                    {' · '}
                    {timeAgo(item.completedAt)}
                  </div>
                </div>
                {item.finalScore != null && (
                  <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#1db954', flexShrink: 0 }}>
                    {parseFloat(item.finalScore).toFixed(1)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

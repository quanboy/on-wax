import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getFollowers, getFollowing, followUser, unfollowUser, getMyProfile } from '../api/userApi';
import { t, btn } from '../theme';

export default function FollowListPage() {
  const { username } = useParams();
  const { pathname } = useLocation();
  const isFollowers = pathname.endsWith('/followers');

  const [users, setUsers] = useState([]);
  const [myUsername, setMyUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    setLoading(true); setError(null);
    const fetchList = isFollowers ? getFollowers(username) : getFollowing(username);
    Promise.all([fetchList, getMyProfile().catch(() => null)])
      .then(([list, me]) => {
        setUsers(list);
        setMyUsername(me?.username ?? null);
      })
      .catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false));
  }, [username, isFollowers]);

  const handleFollow = async (u) => {
    setFollowLoading(f => ({ ...f, [u.username]: true }));
    try {
      if (u.isFollowing) {
        await unfollowUser(u.username);
        setUsers(prev => prev.map(p => p.username === u.username
          ? { ...p, isFollowing: false, followersCount: p.followersCount - 1 } : p));
      } else {
        await followUser(u.username);
        setUsers(prev => prev.map(p => p.username === u.username
          ? { ...p, isFollowing: true, followersCount: p.followersCount + 1 } : p));
      }
    } catch (_) {}
    setFollowLoading(f => ({ ...f, [u.username]: false }));
  };

  const center = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' };
  if (loading) return <div style={center}><p style={{ color: t.muted, fontFamily: t.serif, fontStyle: 'italic' }}>Loading…</p></div>;
  if (error) return <div style={center}><p style={{ color: t.error }}>{error}</p></div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <Link to={`/users/${username}`} style={{ fontFamily: t.mono, fontSize: '11px', color: t.muted, textDecoration: 'none', letterSpacing: '0.08em' }}>
          ← @{username}
        </Link>
        <h1 style={{ fontFamily: t.serif, fontSize: '24px', fontWeight: '700', color: t.text, margin: '10px 0 0 0' }}>
          {isFollowers ? 'Followers' : 'Following'}
        </h1>
      </div>

      {users.length === 0 ? (
        <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.muted, fontSize: '15px' }}>
          {isFollowers ? 'No followers yet.' : 'Not following anyone yet.'}
        </p>
      ) : (
        <div>
          {users.map((u) => (
            <div key={u.username} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 0', borderBottom: `1px solid ${t.border}`,
            }}>
              <Link to={`/users/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, textDecoration: 'none', minWidth: 0 }}>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.displayName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${t.border}`, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: t.surface, border: `1px solid ${t.border}`, flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: t.serif, fontWeight: '700', fontSize: '15px', color: t.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.displayName || u.username}
                  </p>
                  <p style={{ fontFamily: t.mono, fontSize: '11px', color: t.muted, margin: '2px 0 0 0' }}>@{u.username}</p>
                </div>
              </Link>
              {myUsername && myUsername !== u.username && (
                <button
                  onClick={() => handleFollow(u)}
                  disabled={!!followLoading[u.username]}
                  style={{
                    ...btn.primary,
                    ...(u.isFollowing ? { background: 'transparent', color: t.muted, border: `1px solid ${t.border}` } : {}),
                    padding: '6px 16px', fontSize: '12px', letterSpacing: '0.06em', flexShrink: 0,
                    opacity: followLoading[u.username] ? 0.5 : 1,
                  }}
                >
                  {u.isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

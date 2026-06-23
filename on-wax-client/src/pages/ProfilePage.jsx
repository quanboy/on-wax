import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProfile, getBadges, followUser, unfollowUser } from '../api/userApi';

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getProfile(username), getBadges(username)])
      .then(([p, b]) => {
        setProfile(p);
        setBadges(b);
      })
      .catch((err) => {
        if (err.response?.status === 404) setError('User not found.');
        else setError('Failed to load profile.');
      })
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await unfollowUser(username);
        setProfile(p => ({ ...p, isFollowing: false, followersCount: p.followersCount - 1 }));
      } else {
        await followUser(username);
        setProfile(p => ({ ...p, isFollowing: true, followersCount: p.followersCount + 1 }));
      }
    } catch (_) {}
    setFollowLoading(false);
  };

  if (loading) return <div style={{ padding: '40px', color: '#aaa' }}>Loading...</div>;
  if (error) return <div style={{ padding: '40px', color: '#f55' }}>{error}</div>;

  const badgesByAlbum = badges.reduce((acc, b) => {
    if (!acc[b.spotifyAlbumId]) acc[b.spotifyAlbumId] = [];
    acc[b.spotifyAlbumId].push(b);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        {profile.avatarUrl && (
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{profile.displayName || profile.username}</div>
          <div style={{ color: '#888', fontSize: '14px' }}>@{profile.username}</div>
          {profile.bio && <div style={{ marginTop: '6px', fontSize: '14px', color: '#ccc' }}>{profile.bio}</div>}
        </div>
        {profile.isFollowing !== null && profile.isFollowing !== undefined && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              cursor: 'pointer',
              background: profile.isFollowing ? 'transparent' : '#1db954',
              color: profile.isFollowing ? '#888' : '#000',
              border: profile.isFollowing ? '1px solid #555' : 'none',
              borderRadius: '20px',
              fontWeight: 'bold',
            }}
          >
            {profile.isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', fontSize: '14px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{profile.sessionCount}</div>
          <div style={{ color: '#888' }}>sessions</div>
        </div>
        <Link to={`/users/${username}/followers`} style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{profile.followersCount}</div>
          <div style={{ color: '#888' }}>followers</div>
        </Link>
        <Link to={`/users/${username}/following`} style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{profile.followingCount}</div>
          <div style={{ color: '#888' }}>following</div>
        </Link>
      </div>

      <div style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: '16px' }}>Badges</div>
      {badges.length === 0 ? (
        <div style={{ color: '#666', fontSize: '14px' }}>No badges yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(badgesByAlbum).map(([albumId, albumBadges]) => (
            <div key={albumId} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px 16px' }}>
              {albumBadges.map((b) => (
                <div key={b.code} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>{b.code === 'FULL_ALBUM' ? '🏆' : '⭐'}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{b.name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

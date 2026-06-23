import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProfile, getBadges, followUser, unfollowUser, getMyProfile, updateMyProfile } from '../api/userApi';

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', displayName: '', bio: '' });
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setEditing(false);
    Promise.all([
      getProfile(username),
      getBadges(username),
      getMyProfile().catch(() => null),
    ]).then(([p, b, me]) => {
      setProfile(p);
      setBadges(b);
      setIsOwnProfile(me?.username === username);
    }).catch((err) => {
      if (err.response?.status === 404) setError('User not found.');
      else setError('Failed to load profile.');
    }).finally(() => setLoading(false));
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

  const startEditing = () => {
    setEditForm({
      username: profile.username,
      displayName: profile.displayName || '',
      bio: profile.bio || '',
    });
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateMyProfile({
        username: editForm.username !== profile.username ? editForm.username : undefined,
        displayName: editForm.displayName || undefined,
        bio: editForm.bio || undefined,
      });
      setProfile(updated);
      setEditing(false);
      if (editForm.username !== username) {
        navigate(`/users/${editForm.username}`, { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 409) setSaveError('That username is already taken.');
      else setSaveError('Failed to save. Check that username is 3–30 lowercase characters or hyphens.');
    }
    setSaving(false);
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
      {editing ? (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Edit Profile</div>
          {[
            { label: 'Username', key: 'username', placeholder: 'lowercase, hyphens ok' },
            { label: 'Display name', key: 'displayName', placeholder: 'Your name' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>{label}</div>
              <input
                value={editForm[key]}
                onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 12px',
                  background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px',
                  color: '#fff', fontSize: '14px',
                }}
              />
            </div>
          ))}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Bio</div>
            <textarea
              value={editForm.bio}
              onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="A little about you"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 12px',
                background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px',
                color: '#fff', fontSize: '14px', resize: 'vertical',
              }}
            />
          </div>
          {saveError && <div style={{ color: '#f55', fontSize: '13px', marginBottom: '12px' }}>{saveError}</div>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 20px', background: '#1db954', border: 'none',
                borderRadius: '20px', color: '#000', fontWeight: 'bold',
                fontSize: '14px', cursor: 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '8px 20px', background: 'transparent', border: '1px solid #555',
                borderRadius: '20px', color: '#888', fontSize: '14px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
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
          {isOwnProfile ? (
            <button
              onClick={startEditing}
              style={{
                padding: '8px 20px', fontSize: '14px', cursor: 'pointer',
                background: 'transparent', color: '#888', border: '1px solid #555',
                borderRadius: '20px',
              }}
            >
              Edit profile
            </button>
          ) : (profile.isFollowing !== null && profile.isFollowing !== undefined) && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                padding: '8px 20px', fontSize: '14px', cursor: 'pointer',
                background: profile.isFollowing ? 'transparent' : '#1db954',
                color: profile.isFollowing ? '#888' : '#000',
                border: profile.isFollowing ? '1px solid #555' : 'none',
                borderRadius: '20px', fontWeight: 'bold',
              }}
            >
              {profile.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', fontSize: '14px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{profile.sessionCount}</div>
          <div style={{ color: '#888' }}>sessions</div>
        </div>
        <Link to={`/users/${profile.username}/followers`} style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{profile.followersCount}</div>
          <div style={{ color: '#888' }}>followers</div>
        </Link>
        <Link to={`/users/${profile.username}/following`} style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
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

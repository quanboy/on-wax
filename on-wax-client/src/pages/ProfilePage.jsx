import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProfile, getBadges, followUser, unfollowUser, getMyProfile, updateMyProfile } from '../api/userApi';
import { t, btn } from '../theme';

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
    setLoading(true); setError(null); setEditing(false);
    Promise.all([
      getProfile(username), getBadges(username),
      getMyProfile().catch(() => null),
    ]).then(([p, b, me]) => {
      setProfile(p); setBadges(b);
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
    setEditForm({ username: profile.username, displayName: profile.displayName || '', bio: profile.bio || '' });
    setSaveError(null); setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      const updated = await updateMyProfile({
        username: editForm.username !== profile.username ? editForm.username : undefined,
        displayName: editForm.displayName || undefined,
        bio: editForm.bio || undefined,
      });
      setProfile(updated); setEditing(false);
      if (editForm.username !== username) navigate(`/users/${editForm.username}`, { replace: true });
    } catch (err) {
      if (err.response?.status === 409) setSaveError('That username is already taken.');
      else setSaveError('Invalid — username must be 3–30 lowercase characters or hyphens.');
    }
    setSaving(false);
  };

  const center = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' };
  if (loading) return <div style={center}><p style={{ color: t.muted, fontFamily: t.serif, fontStyle: 'italic' }}>Loading…</p></div>;
  if (error) return <div style={center}><p style={{ color: t.error }}>{error}</p></div>;

  const badgesByAlbum = badges.reduce((acc, b) => {
    if (!acc[b.spotifyAlbumId]) acc[b.spotifyAlbumId] = [];
    acc[b.spotifyAlbumId].push(b); return acc;
  }, {});

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: t.surface, border: `1px solid ${t.border}`,
    color: t.text, fontFamily: t.serif, fontStyle: 'italic',
    fontSize: '15px', borderRadius: '2px', outline: 'none',
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px' }}>

      {editing ? (
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontFamily: t.serif, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.muted, marginBottom: '20px' }}>
            Edit Profile
          </p>
          {[
            { label: 'Username', key: 'username', placeholder: 'lowercase, hyphens ok' },
            { label: 'Display Name', key: 'displayName', placeholder: 'Your name' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: '14px' }}>
              <p style={{ fontFamily: t.mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: '6px' }}>{label}</p>
              <input value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontFamily: t.mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginBottom: '6px' }}>Bio</p>
            <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="A little about you" rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          {saveError && <p style={{ color: t.error, fontSize: '13px', marginBottom: '14px' }}>{saveError}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} disabled={saving} style={{ ...btn.primary, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} style={btn.ghost}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '28px', paddingBottom: '28px', borderBottom: `1px solid ${t.border}` }}>
          {profile.avatarUrl && (
            <img src={profile.avatarUrl} alt={profile.displayName} style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${t.border}`, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: t.serif, fontSize: '22px', fontWeight: '700', color: t.text, margin: '0 0 2px 0' }}>
              {profile.displayName || profile.username}
            </h1>
            <p style={{ fontFamily: t.mono, fontSize: '11px', color: t.muted, margin: '0 0 8px 0' }}>@{profile.username}</p>
            {profile.bio && <p style={{ fontFamily: t.serif, fontStyle: 'italic', fontSize: '14px', color: t.muted }}>{profile.bio}</p>}
          </div>
          {isOwnProfile ? (
            <button onClick={startEditing} style={{ ...btn.ghost, padding: '7px 16px', fontSize: '11px', letterSpacing: '0.08em', flexShrink: 0 }}>Edit</button>
          ) : (profile.isFollowing !== null && profile.isFollowing !== undefined) && (
            <button onClick={handleFollow} disabled={followLoading} style={{
              ...btn.primary,
              ...(profile.isFollowing ? { background: 'transparent', color: t.muted, border: `1px solid ${t.border}` } : {}),
              padding: '7px 18px', fontSize: '12px', letterSpacing: '0.06em', flexShrink: 0,
            }}>
              {profile.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '36px' }}>
        {[
          { label: 'Sessions', value: profile.sessionCount, to: null },
          { label: 'Followers', value: profile.followersCount, to: `/users/${profile.username}/followers` },
          { label: 'Following', value: profile.followingCount, to: `/users/${profile.username}/following` },
        ].map(({ label, value, to }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            {to ? (
              <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
                <p style={{ fontFamily: t.mono, fontSize: '20px', fontWeight: '700', color: t.text, margin: 0 }}>{value}</p>
                <p style={{ fontFamily: t.mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginTop: '4px' }}>{label}</p>
              </Link>
            ) : (
              <>
                <p style={{ fontFamily: t.mono, fontSize: '20px', fontWeight: '700', color: t.text, margin: 0 }}>{value}</p>
                <p style={{ fontFamily: t.mono, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.muted, marginTop: '4px' }}>{label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Badges */}
      <p style={{ fontFamily: t.serif, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.muted, marginBottom: '16px' }}>Badges</p>
      {badges.length === 0 ? (
        <p style={{ fontFamily: t.serif, fontStyle: 'italic', color: t.faint, fontSize: '14px' }}>No badges yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(badgesByAlbum).map(([albumId, albumBadges]) => (
            <div key={albumId} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '2px', padding: '12px 16px' }}>
              {albumBadges.map((b) => (
                <div key={b.code} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ color: t.gold, fontSize: '16px' }}>{b.code === 'FULL_ALBUM' ? '◈' : '◇'}</span>
                  <div>
                    <p style={{ fontFamily: t.serif, fontWeight: '700', fontSize: '13px', color: t.text, margin: 0 }}>{b.name}</p>
                    <p style={{ fontFamily: t.serif, fontStyle: 'italic', fontSize: '12px', color: t.muted, margin: 0 }}>{b.description}</p>
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

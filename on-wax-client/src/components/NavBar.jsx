import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import client from '../api/client';
import { getMyProfile } from '../api/userApi';
import { t } from '../theme';

const link = {
  textDecoration: 'none',
  color: t.muted,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontFamily: t.serif,
  padding: '4px 0',
};

const activeLink = { ...link, color: t.accent, borderBottom: `1px solid ${t.accent}` };

export default function NavBar() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    getMyProfile().then(p => setUsername(p.username)).catch(() => setUsername(null));
  }, []);

  const handleLogout = async () => {
    try { await client.get('/spotify/logout'); } catch (_) {}
    window.location.href = '/';
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 32px',
      background: t.surface,
      borderBottom: `1px solid ${t.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <span style={{ fontFamily: t.serif, fontSize: '20px', fontStyle: 'italic', color: t.text, letterSpacing: '0.02em' }}>
          on&#8202;·&#8202;wax
        </span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <NavLink to="/" end style={({ isActive }) => isActive ? activeLink : link}>Home</NavLink>
          <NavLink to="/feed" style={({ isActive }) => isActive ? activeLink : link}>Feed</NavLink>
          <NavLink to="/history" style={({ isActive }) => isActive ? activeLink : link}>History</NavLink>
          {username && (
            <NavLink to={`/users/${username}`} style={({ isActive }) => isActive ? activeLink : link}>Profile</NavLink>
          )}
        </div>
      </div>
      <button onClick={handleLogout} style={{
        background: 'transparent', border: `1px solid ${t.border}`,
        color: t.muted, padding: '6px 18px', fontSize: '11px',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        fontFamily: t.serif, cursor: 'pointer',
      }}>
        Logout
      </button>
    </nav>
  );
}

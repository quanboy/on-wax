import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import client from '../api/client';
import { getMyProfile } from '../api/userApi';

const linkStyle = {
  textDecoration: 'none',
  color: '#888',
  padding: '8px 16px',
  fontSize: '14px',
};

const activeLinkStyle = {
  ...linkStyle,
  color: '#fff',
  fontWeight: 'bold',
};

export default function NavBar() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    getMyProfile()
      .then(p => setUsername(p.username))
      .catch(() => setUsername(null));
  }, []);

  const handleLogout = async () => {
    try {
      await client.get('/spotify/logout');
    } catch (_) {}
    window.location.href = '/';
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      backgroundColor: '#111',
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px', marginRight: '16px' }}>on-wax</span>
        <NavLink to="/" end style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}>
          Home
        </NavLink>
        <NavLink to="/feed" style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}>
          Feed
        </NavLink>
        <NavLink to="/history" style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}>
          History
        </NavLink>
        {username && (
          <NavLink to={`/users/${username}`} style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}>
            Profile
          </NavLink>
        )}
      </div>
      <button
        onClick={handleLogout}
        style={{
          background: 'transparent',
          border: '1px solid #555',
          color: '#888',
          padding: '6px 16px',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </nav>
  );
}

import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <h1>404</h1>
      <p style={{ color: '#888' }}>Page not found</p>
      <Link to="/" style={{ marginTop: '12px' }}>Go home</Link>
    </div>
  );
}

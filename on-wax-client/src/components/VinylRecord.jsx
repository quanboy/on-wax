export default function VinylRecord({ src, alt, size = 300 }) {
  const disc = size * 1.18;
  const art = size * 0.56;

  return (
    <div style={{ position: 'relative', width: disc, height: disc, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'repeating-radial-gradient(circle, #0a0806 0px, #141010 1.5px, #0a0806 3px)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.85)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle, transparent 26%, rgba(255,255,255,0.015) 27%, transparent 28%, rgba(255,255,255,0.01) 45%, transparent 46%)',
      }} />
      <img src={src} alt={alt} style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: art, height: art,
        borderRadius: '50%',
        objectFit: 'cover',
        boxShadow: '0 0 0 2px #0a0806, 0 0 0 3px rgba(200,117,51,0.3)',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 10, height: 10, borderRadius: '50%',
        background: '#0e0a06',
        border: '1px solid #3a2415',
        zIndex: 10,
      }} />
    </div>
  );
}

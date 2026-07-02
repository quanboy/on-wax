// Renders a vinyl disc. With `src`, the album art becomes the record label;
// without it, a blank on·wax house label is shown (idle turntable).
// `spinning` rotates the whole disc via the vinyl-spin keyframes in index.css.
export default function VinylRecord({ src, alt, size = 300, spinning = false, artRatio = 0.56 }) {
  const disc = size * 1.18;
  const art = size * artRatio;

  return (
    <div style={{
      position: 'relative', width: disc, height: disc, flexShrink: 0,
      animation: spinning ? 'vinyl-spin 12s linear infinite' : 'none',
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'repeating-radial-gradient(circle, #0a0806 0px, #141010 1.5px, #0a0806 3px)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.85)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle, transparent 26%, rgba(255,255,255,0.015) 27%, transparent 28%, rgba(255,255,255,0.01) 45%, transparent 46%)',
      }} />
      {src ? (
        <img src={src} alt={alt} style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: art, height: art,
          borderRadius: '50%',
          objectFit: 'cover',
          boxShadow: '0 0 0 2px #0a0806, 0 0 0 3px rgba(200,117,51,0.3)',
        }} />
      ) : (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: art, height: art,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 35%, #e0954e 0%, #c87533 55%, #a35d26 100%)',
          boxShadow: '0 0 0 2px #0a0806, 0 0 0 3px rgba(200,117,51,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ transform: 'rotate(-90deg)', textAlign: 'center', lineHeight: 1.5 }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700, fontSize: art * 0.14, color: '#2a1608' }}>
              on·wax
            </div>
            <div style={{ fontFamily: "'Space Mono', 'Courier New', monospace", fontSize: art * 0.07, letterSpacing: '0.2em', color: '#4a2a12' }}>
              33⅓ RPM
            </div>
          </div>
        </div>
      )}
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

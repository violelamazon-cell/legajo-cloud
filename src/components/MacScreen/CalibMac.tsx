import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MAC_SCREEN } from '../../config/calibration';

export function CalibMac() {
  const [v, setV] = useState({ ...MAC_SCREEN });
  useEffect(() => {
    const dirs: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const on = (e: KeyboardEvent) => {
      const d = dirs[e.key];
      if (!d) return;
      e.preventDefault();
      const step = e.ctrlKey ? 0.005 : 0.001;               // Ctrl = paso grande
      setV((p) => e.shiftKey
        ? { ...p, w: p.w + d[0] * step, h: p.h + d[1] * step }   // Shift + flechas = tamaño
        : { ...p, l: p.l + d[0] * step, t: p.t + d[1] * step }); // flechas = posición
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const line = `MAC_SCREEN = { l: ${v.l.toFixed(4)}, t: ${v.t.toFixed(4)}, w: ${v.w.toFixed(4)}, h: ${v.h.toFixed(4)} };`;
  return (
    <>
      <div style={{ position: 'absolute', left: `${v.l * 100}%`, top: `${v.t * 100}%`, width: `${v.w * 100}%`, height: `${v.h * 100}%`,
        outline: '2px solid #ff2bd6', background: 'rgba(255,43,214,.08)', pointerEvents: 'none', zIndex: 50 }} />
      {createPortal(
        <pre style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 9999, margin: 0, padding: '8px 12px', color: '#ff2bd6',
          background: '#000c', font: '14px monospace' }}>{line}</pre>, document.body)}
    </>
  );
}

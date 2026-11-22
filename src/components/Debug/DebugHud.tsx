import { useEffect, useState } from 'react';
import { sceneStore, rig } from '../../animations/rig';

export function DebugHud() {
  const [t, setT] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      const q = (s: string) => document.querySelector(s) as HTMLElement | null;
      const st = (s: string) => { const e = q(s); if (!e) return s + ': NO EXISTE'; const c = getComputedStyle(e); return `${s}: op=${(+c.opacity).toFixed(2)} vis=${c.visibility}`; };
      const r = q('.mac-screen')?.getBoundingClientRect();
      setT([
        `scene=${sceneStore.get().scene} p=${sceneStore.get().progress.toFixed(3)}`,
        `rig s=${rig.s.toFixed(2)} tx=${Math.round(rig.tx)} ty=${Math.round(rig.ty)}`,
        st('#scene-4'), st('.mac-plate'), st('.strat-layer'), st('.strat-card'),
        `zoom: ${q('.mac-zoom')?.style.transform || '-'}`,
        r ? `screen: ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}` : 'screen: NO EXISTE',
      ].join('\n'));
    }, 150);
    return () => clearInterval(id);
  }, []);
  return <pre style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 99999, margin: 0, padding: 8, font: '12px monospace', color: '#0f0', background: '#000c', pointerEvents: 'none' }}>{t}</pre>;
}

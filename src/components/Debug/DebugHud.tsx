import { useEffect, useState } from 'react';
import { sceneStore, rig } from '../../animations/rig';

export function DebugHud() {
  const [t, setT] = useState('');
  const [lt, setLt] = useState<string[]>([]);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;
    const po = new PerformanceObserver((list) => {
      const rows = list.getEntries().map((e) => `${Math.round(e.duration)}ms @p=${sceneStore.get().progress.toFixed(3)}`);
      setLt((p) => [...rows, ...p].slice(0, 5));
    });
    try { po.observe({ entryTypes: ['longtask'] }); } catch {}
    return () => po.disconnect();
  }, []);

  useEffect(() => {
    let frames = 0;
    let worst = 0;
    let lastTime = performance.now();
    let secondStart = lastTime;
    let fpsText = '-- fps | peor frame -- ms';
    let rafId: number;

    const loop = (now: number) => {
      frames++;
      const dt = now - lastTime;
      lastTime = now;
      if (dt > worst) worst = dt;
      if (now - secondStart >= 1000) {
        fpsText = `${frames} fps | peor frame ${Math.round(worst)} ms`;
        frames = 0;
        worst = 0;
        secondStart = now;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const id = setInterval(() => {
      const q = (s: string) => document.querySelector(s) as HTMLElement | null;
      const st = (s: string) => { const e = q(s); if (!e) return s + ': NO EXISTE'; const c = getComputedStyle(e); return `${s}: op=${(+c.opacity).toFixed(2)} vis=${c.visibility}`; };
      const r = q('.mac-screen')?.getBoundingClientRect();
      setT([
        fpsText,
        `longtasks: ${lt.join(' | ') || '-'}`,
        `scene=${sceneStore.get().scene} p=${sceneStore.get().progress.toFixed(3)}`,
        `rig s=${rig.s.toFixed(2)} tx=${Math.round(rig.tx)} ty=${Math.round(rig.ty)}`,
        st('#scene-4'), st('.mac-plate'), st('.strat-layer'), st('.strat-card'),
        `zoom: ${q('.mac-zoom')?.style.transform || '-'}`,
        r ? `screen: ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}` : 'screen: NO EXISTE',
      ].join('\n'));
    }, 150);
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(id);
    };
  }, [lt]);
  return <pre style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 99999, margin: 0, padding: 8, font: '12px monospace', color: '#0f0', background: '#000c', pointerEvents: 'none' }}>{t}</pre>;
}

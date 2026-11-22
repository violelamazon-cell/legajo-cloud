import { useEffect } from 'react';
import { stepScene } from './navigation';

export function useWheelNav() {
  useEffect(() => {
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;                      // zoom del navegador
      e.preventDefault();
      const now = performance.now();
      const gap = now - last;
      last = now;                                 // un flujo continuo (inercia del trackpad) sigue bloqueando
      if (gap < 250 || Math.abs(e.deltaY) < 4) return;
      stepScene(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);
}

import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { diagramBuilders } from './diagramTimelines';
import { sceneStore } from '../../animations/rig';

export function useDiagram(root: RefObject<HTMLElement | null>, id: keyof typeof diagramBuilders) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    const ctx = gsap.context(() => { tl.current = diagramBuilders[id](gsap.timeline({ paused: true })); }, root);
    // al salir de la escena 05, todos los diagramas vuelven al inicio (aunque no haya pointerleave)
    const off = sceneStore.subscribe(() => { if (sceneStore.get().scene !== 4) tl.current?.pause(0); });
    return () => { off(); ctx.revert(); };
  }, [id, root]);
  return {
    enter: () => tl.current?.timeScale(1).play(),
    leave: () => tl.current?.timeScale(1.6).reverse(),
    toggle: () => tl.current?.restart(),
  };
}

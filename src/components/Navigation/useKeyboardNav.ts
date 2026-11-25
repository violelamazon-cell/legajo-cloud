import { useEffect } from 'react';
import { stepScene, goToStop } from './navigation';
import { sceneStore } from '../../animations/rig';
import { startBoot } from '../../animations/bootAnimations';

export function useKeyboardNav() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typeof window !== 'undefined' && window.location.search.includes('calib')) {
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && typeof t.closest === 'function') {
        if (t.closest('input, textarea, select, [contenteditable="true"], [data-no-nav]')) {
          return;
        }
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.repeat && ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return;
      if (e.key === 'Enter' || e.key === ' ') {
        const s = sceneStore.get();
        if (!s.booted && s.introShown && !s.bootStarted) {
          e.preventDefault();
          startBoot();
        }
        return;
      }
      const map: Record<string, () => void> = {
        ArrowDown: () => stepScene(1),
        ArrowRight: () => stepScene(1),
        ArrowUp: () => stepScene(-1),
        ArrowLeft: () => stepScene(-1),
        Home: () => goToStop(0),
        End: () => goToStop(sceneStore.get().migrationBooted ? 6 : 3),
      };
      const fn = map[e.key];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

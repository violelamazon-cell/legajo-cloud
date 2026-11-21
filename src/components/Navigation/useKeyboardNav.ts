import { useEffect } from 'react';
import { stepScene, goToScene } from './navigation';
import { SCENE_COUNT } from '../../animations/timeline';
import { sceneStore } from '../../animations/rig';

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
      const map: Record<string, () => void> = {
        ArrowDown: () => stepScene(1),
        ArrowRight: () => stepScene(1),
        ArrowUp: () => stepScene(-1),
        ArrowLeft: () => stepScene(-1),
        Home: () => goToScene(0),
        End: () => goToScene(sceneStore.get().migrationBooted ? SCENE_COUNT - 1 : 3),
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

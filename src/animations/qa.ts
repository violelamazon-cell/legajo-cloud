import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { goToScene } from '../components/Navigation/navigation';
import { SCENE_COUNT } from './timeline';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function installQA() {
  if (typeof window === 'undefined') return;
  (window as any).__qa = {
    async stress(ms = 30000) {
      console.log(`[QA] Iniciando stress test (${ms}ms)...`);
      const triggers0 = ScrollTrigger.getAll().length;
      const t0 = performance.now();
      let steps = 0;
      while (performance.now() - t0 < ms) {
        goToScene(Math.floor(Math.random() * SCENE_COUNT));
        steps++;
        await wait(80 + Math.random() * 500);
      }
      goToScene(0);
      await wait(2000);
      const triggersEnd = ScrollTrigger.getAll().length;
      const activeTweens = gsap.globalTimeline.getChildren(true, true, false).length;
      const report = {
        ms,
        steps,
        triggersBefore: triggers0,
        triggersAfter: triggersEnd,
        triggersLeaked: triggersEnd - triggers0,
        activeTweens,
        success: triggersEnd === triggers0,
      };
      console.log('[QA] Stress test finalizado:', report);
      return report;
    },
  };
}

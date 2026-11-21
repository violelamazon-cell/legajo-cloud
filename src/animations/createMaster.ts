import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { sceneStore } from './rig';
import { SCENE_COUNT } from './timeline';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const FREE_RANGES: Array<[number, number]> = [[2, 3], [3, 4]]; // entre s2-s3 (paneo) y s3-s4 (zoom estrategias): sin snap agresivo

export function createMaster(stage: HTMLElement, tl: gsap.core.Timeline) {
  const stops = () => Array.from({ length: SCENE_COUNT }, (_, i) => tl.labels['s' + i] / tl.duration());
  const nearest = (p: number) =>
    stops().reduce((best, s, i, a) => (Math.abs(s - p) < Math.abs(a[best] - p) ? i : best), 0);

  return ScrollTrigger.create({
    animation: tl,
    trigger: stage,
    start: 'top top',
    end: () => '+=' + tl.duration() * window.innerHeight,
    pin: true,
    scrub: 0.6,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    snap: {
      snapTo: (v: number, self?: ScrollTrigger) => {
        const s = stops();
        const maxStop = sceneStore.get().migrationBooted ? 1.0 : s[3];
        const clampedV = Math.min(v, maxStop);

        for (const [a, b] of FREE_RANGES) {
          if (clampedV > s[a] && clampedV < s[b]) return clampedV;
        }
        const dir = self?.direction ?? 1;
        const validStops = s.filter((val) => val <= maxStop + 1e-4);
        const next = dir > 0
          ? validStops.find((x) => x >= clampedV - 1e-4)
          : [...validStops].reverse().find((x) => x <= clampedV + 1e-4);
        return next ?? clampedV;
      },
      duration: { min: 0.25, max: 0.8 },
      delay: 0.15,
      ease: 'power2.inOut',
    },
    onUpdate: (self) => {
      const s3Progress = tl.labels['s3'] / tl.duration();
      const isBooted = sceneStore.get().migrationBooted;
      if (!isBooted && self.progress > s3Progress) {
        // Fijar la animación en el estado de reposo s3 sin desincronización
        tl.progress(s3Progress);
        const maxScroll = self.start + s3Progress * (self.end - self.start);
        if (self.scroll() > maxScroll) {
          self.scroll(maxScroll);
        }
        sceneStore.set({ progress: s3Progress, scene: 3 });
        return;
      }
      sceneStore.set({ progress: self.progress, scene: nearest(self.progress) });
    },
  });
}

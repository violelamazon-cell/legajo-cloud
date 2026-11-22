import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { sceneStore } from './rig';
import { STOP_COUNT, sceneOfStop } from './timeline';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const FREE_RANGES: Array<[number, number]> = [[2, 3], [3, 4]]; // entre s2-s3 (paneo) y s3-s4 (zoom estrategias): sin snap agresivo

let lastSceneDataset: string | null = null;
const updateSceneDataset = (scene: number) => {
  const s = String(scene);
  if (s !== lastSceneDataset) {
    lastSceneDataset = s;
    document.documentElement.dataset.scene = s;
  }
};

export function createMaster(stage: HTMLElement, tl: gsap.core.Timeline) {
  const stops = () => Array.from({ length: STOP_COUNT }, (_, i) => tl.labels['s' + i] / tl.duration());
  const nearest = (p: number) =>
    stops().reduce((best, s, i, a) => (Math.abs(s - p) < Math.abs(a[best] - p) ? i : best), 0);

  return ScrollTrigger.create({
    animation: tl,
    trigger: stage,
    start: 'top top',
    end: () => '+=' + tl.duration() * window.innerHeight * 1.25,
    pin: true,
    scrub: 1,
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
      duration: { min: 0.7, max: 1.6 },
      delay: 0.1,
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
        const sc = sceneOfStop(3);
        updateSceneDataset(sc);
        sceneStore.set({ progress: s3Progress, stop: 3, scene: sc });
        return;
      }
      const idx = nearest(self.progress);
      const sc = sceneOfStop(idx);
      updateSceneDataset(sc);
      sceneStore.set({ progress: self.progress, stop: idx, scene: sc });
    },
  });
}

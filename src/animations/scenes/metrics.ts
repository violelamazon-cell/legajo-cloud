import type { SceneBuilder } from '../timeline';
import { rig } from '../rig';

export const buildMetrics: SceneBuilder = (tl) => {
  const t = tl.duration();
  tl.to('#scene-5', { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t);
  tl.to('#scene-6', { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, t + 0.35);
  tl.to(rig, { s: 1, era: 0.95, duration: 1, ease: 'power2.inOut' }, t);
  tl.addLabel('s5', t + 1);
};

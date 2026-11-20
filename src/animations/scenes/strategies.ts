import type { SceneBuilder } from '../timeline';
import { rig } from '../rig';

export const buildStrategies: SceneBuilder = (tl) => {
  const t = tl.duration();
  tl.to('#scene-4', { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t);
  tl.to('#scene-5', { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, t + 0.35);
  tl.to(rig, { s: 1.15, era: 0.85, duration: 1, ease: 'power2.inOut' }, t);
  tl.addLabel('s4', t + 1);
};

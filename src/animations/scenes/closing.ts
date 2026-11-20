import type { SceneBuilder } from '../timeline';
import { rig } from '../rig';

export const buildClosing: SceneBuilder = (tl) => {
  const t = tl.duration();
  tl.to('#scene-6', { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t);
  tl.to('#scene-7', { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, t + 0.35);
  tl.to(rig, { s: 0.9, era: 1, duration: 1, ease: 'power2.inOut' }, t);
  tl.addLabel('s6', t + 1);
};

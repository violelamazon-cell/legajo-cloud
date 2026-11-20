import type { SceneBuilder } from '../timeline';
import { rig } from '../rig';

export const buildWrapper: SceneBuilder = (tl) => {
  const t = tl.duration();
  tl.to(rig, { s: 1, tx: 0, ty: 0, era: 0.3, duration: 1, ease: 'power2.inOut' }, t);
  tl.to('#scene-2', { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t);
  tl.to('#scene-3', { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, t + 0.35);
  tl.addLabel('s2', t + 1);
};

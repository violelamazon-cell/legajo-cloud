import type { SceneBuilder } from '../timeline';
import { rig } from '../rig';
import { SCREEN_ZOOM, SCREEN_TX, SCREEN_TY } from '../../config/calibration';

export const buildDecision: SceneBuilder = (tl) => {
  const t = tl.duration();
  tl.to(rig, { s: SCREEN_ZOOM, tx: SCREEN_TX, ty: SCREEN_TY, era: 0.1, duration: 1, ease: 'power2.inOut' }, t);
  tl.to('#scene-1', { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t);
  tl.to('#scene-2', { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, t + 0.35);
  tl.addLabel('s1', t + 1);
};

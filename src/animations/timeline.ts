import gsap from 'gsap';
import { rig, applyRig } from './rig';

export const SCENE_COUNT = 7;
export type SceneBuilder = (tl: gsap.core.Timeline) => void;

export function buildMaster(builders: SceneBuilder[]) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: applyRig });
  tl.set(rig, { tx: 0, ty: 0, s: 1, era: 0 }, 0); // estado inicial único
  tl.set('#scene-1', { autoAlpha: 1 }, 0);
  tl.set(['#scene-2', '#scene-3', '#scene-4', '#scene-5', '#scene-6', '#scene-7'], { autoAlpha: 0 }, 0);
  tl.addLabel('s0', 0);
  builders.forEach((b) => b(tl));                  // escenas 02..07 en orden
  return tl;
}

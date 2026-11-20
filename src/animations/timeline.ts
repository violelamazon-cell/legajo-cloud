import gsap from 'gsap';
import { rig, applyRig } from './rig';

export const SCENE_COUNT = 7;
export type SceneBuilder = (tl: gsap.core.Timeline) => void;

export function buildMaster(builders: SceneBuilder[]) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: applyRig });
  tl.set(rig, { tx: 0, ty: 0, s: 1, era: 0 }, 0); // estado inicial único
  tl.addLabel('s0', 0);
  builders.forEach((b) => b(tl));                  // escenas 02..07, en orden
  return tl;
}

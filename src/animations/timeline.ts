import gsap from 'gsap';
import { rig, applyRig } from './rig';
import { fx, FX_INITIAL } from '../three/fx';

export const SCENE_COUNT = 7;
export const STOP_COUNT = 8;
export const sceneOfStop = (i: number) => Math.min(i, SCENE_COUNT - 1);
export type SceneBuilder = (tl: gsap.core.Timeline) => void;

export function endScene(tl: gsap.core.Timeline, label: string, at: number) {
  tl.addLabel(label, at);
  tl.set({}, {}, at); // hijo vacío en `at`: obliga a que tl.duration() llegue hasta el label
}

export function buildMaster(builders: SceneBuilder[]) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: applyRig });
  tl.set(rig, { tx: 0, ty: 0, s: 1, era: 0 }, 0); // estado inicial único
  tl.set(fx, FX_INITIAL, 0);
  tl.set('#pc-scalable-frame', { scale: 1 }, 0); // computadora al 100% en escenas 01 y 02
  tl.set('#scene-1', { autoAlpha: 1 }, 0);
  tl.set(['#scene-2', '#scene-3', '#scene-4', '#scene-5', '.strat-layer'], { autoAlpha: 0 }, 0);
  tl.set('#migration-bg-overlay', { opacity: 0 }, 0); // fondo carbón oculto al inicio
  tl.addLabel('s0', 0);
  builders.forEach((b) => b(tl));                  // escenas 02..07 en orden
  return tl;
}

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { sceneStore } from '../../animations/rig';
import { SCENE_COUNT } from '../../animations/timeline';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

let st: ScrollTrigger | null = null;
let tlRef: gsap.core.Timeline | null = null;
let pending: number | null = null;

export const bindNavigation = (trigger: ScrollTrigger, tl: gsap.core.Timeline) => {
  st = trigger;
  tlRef = tl;
};

export const unbindNavigation = () => {
  st = null;
  tlRef = null;
  pending = null;
};

export function goToScene(i: number) {
  if (!sceneStore.get().booted) return; // bloqueado hasta terminar el encendido
  if (!st || !tlRef) return;
  const idx = Math.max(0, Math.min(SCENE_COUNT - 1, i));
  pending = idx;
  const p = tlRef.labels['s' + idx] / tlRef.duration();
  const y = st.start + p * (st.end - st.start);
  gsap.to(window, {
    scrollTo: { y, autoKill: true },
    duration: 1.1,
    ease: 'power2.inOut',
    overwrite: true,
    onComplete: () => {
      pending = null;
    },
    onInterrupt: () => {
      pending = null;
    },
  });
}

export const stepScene = (d: 1 | -1) => {
  const current = pending ?? sceneStore.get().scene;
  goToScene(current + d);
};

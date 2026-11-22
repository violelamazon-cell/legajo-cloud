import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { sceneStore } from '../../animations/rig';
import { STOP_COUNT } from '../../animations/timeline';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

let st: ScrollTrigger | null = null;
let tlRef: gsap.core.Timeline | null = null;
let pending: number | null = null;

export const isNavigating = () => pending !== null;

export const bindNavigation = (trigger: ScrollTrigger, tl: gsap.core.Timeline) => {
  st = trigger;
  tlRef = tl;
};

export const unbindNavigation = () => {
  st = null;
  tlRef = null;
  pending = null;
};

export function goToStop(i: number) {
  if (!sceneStore.get().booted) return; // bloqueado hasta terminar el encendido CRT
  if (i > 3 && !sceneStore.get().migrationBooted) return; // bloqueado hasta encender la MacBook
  if (!st || !tlRef) return;
  const idx = Math.max(0, Math.min(STOP_COUNT - 1, i));
  if (idx === sceneStore.get().stop) return;
  pending = idx;
  const p = tlRef.labels['s' + idx] / tlRef.duration();
  const y = st.start + p * (st.end - st.start);
  gsap.to(window, {
    scrollTo: { y, autoKill: true },
    duration: 2.0,
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

export const goToScene = (i: number) => goToStop(i);

export const stepScene = (d: 1 | -1) => {
  if (pending !== null) return;
  goToStop(sceneStore.get().stop + d);
};

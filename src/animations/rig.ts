import { invalidate } from '@react-three/fiber';

type Listener = () => void;
let state = { scene: 0, progress: 0, booted: false };
const listeners = new Set<Listener>();
export const sceneStore = {
  get: () => state,
  set(p: Partial<typeof state>) { state = { ...state, ...p }; listeners.forEach((l) => l()); },
  subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l); },
};
// En React: useSyncExternalStore(sceneStore.subscribe, () => sceneStore.get().scene)
// El progreso NO es estado de React: se lee con sceneStore.get().progress.

export const rig = { tx: 0, ty: 0, s: 1, era: 0 };
let worldEl: HTMLElement | null = null;
export const bindWorld = (el: HTMLElement | null) => { worldEl = el; };

export function applyRig() {
  if (worldEl) {
    worldEl.style.transform = `translate3d(${rig.tx}px, ${rig.ty}px, 0) scale(${rig.s})`;
    document.documentElement.style.setProperty('--era', String(rig.era));
  }
  invalidate(); // R3F: re-render solo cuando algo cambió
}

import { invalidate } from '@react-three/fiber';
import { fx } from '../three/fx';

type Listener = () => void;
let state = {
  scene: 0,
  stop: 0,
  progress: 0,
  booted: false,
  migrationBootStarted: false,
  migrationBooted: false,
};
const listeners = new Set<Listener>();

export const sceneStore = {
  get: () => state,
  set(p: Partial<typeof state>) {
    state = { ...state, ...p };
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export const rig = { tx: 0, ty: 0, s: 1, era: 0 };
let worldEl: HTMLElement | null = null;
export const bindWorld = (el: HTMLElement | null) => {
  worldEl = el;
};

let lastThreeKey = '';
let lastWrittenEra: number | null = null;

export function applyRig() {
  if (worldEl) {
    worldEl.style.transform = `translate3d(${rig.tx}px, ${rig.ty}px, 0) scale(${rig.s})`;
    const e = Math.round(rig.era * 20) / 20;
    if (e !== lastWrittenEra) {
      lastWrittenEra = e;
      document.documentElement.style.setProperty('--era', String(e));
    }
  }
  const threeKey = `${rig.tx}|${rig.ty}|${rig.s}|` + Object.values(fx).join('|');
  if (threeKey !== lastThreeKey) {
    lastThreeKey = threeKey;
    try {
      invalidate();
    } catch {
      // R3F Canvas aún no montado en Etapa 1
    }
  }
}

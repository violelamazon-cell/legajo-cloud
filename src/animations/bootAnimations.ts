import gsap from 'gsap';
import { sceneStore } from './rig';
import { typeInto } from './typeInto';

/** Cuatro líneas exactas del PDF — sección «01. Encendido y Arranque del Sistema Legado» */
const BOOT_LINES = [
  '// SISTEMA LEGADO v1.0',
  '> INICIANDO...',
  '> MÓDULO: OPERACIONES',
  '> ESTADO: ACTIVO',
] as const;

export interface BootElements {
  /** Div del flash blanco/verdoso (clase crt-flash) */
  flashEl: HTMLElement;
  /** Div contenedor del contenido fósforo (comienza en opacity:0) */
  screenEl: HTMLElement;
  /** Cuatro <span> vacíos donde se tipean las líneas, en orden */
  lineEls: [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
  /** Span del cursor rectangular parpadeante */
  cursorEl: HTMLElement;
}

/**
 * Aplica inmediatamente el estado final del boot sin animación.
 * Usado cuando prefers-reduced-motion está activo o al volver a la escena.
 */
export function applyBootFinalState(els: BootElements): void {
  const { flashEl, screenEl, lineEls, cursorEl } = els;
  gsap.set(flashEl, { opacity: 0, scaleY: 0 });
  gsap.set(screenEl, { opacity: 1 });
  BOOT_LINES.forEach((text, i) => {
    lineEls[i].textContent = text;
  });
  gsap.set(cursorEl, { opacity: 1 });
}

/**
 * Crea y ejecuta el timeline cinematográfico de encendido CRT.
 * Timeline por tiempo, independiente del maestro de scroll.
 * Al completarse setea sceneStore.booted = true.
 */
export function runBootSequence(els: BootElements): gsap.core.Timeline {
  const { flashEl, screenEl, lineEls, cursorEl } = els;

  // ── Estado inicial ───────────────────────────────────────
  gsap.set(flashEl, { opacity: 0, scaleY: 0, scaleX: 1 });
  gsap.set(screenEl, { opacity: 0 });
  gsap.set(cursorEl, { opacity: 0 });
  lineEls.forEach((el) => { el.textContent = ''; });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onComplete() {
      sceneStore.set({ booted: true });
    },
  });

  // ── 1. Destello: línea delgada aparece en el centro ─────
  tl.to(flashEl, { opacity: 1, scaleY: 0.012, duration: 0.1, ease: 'power2.out' }, 0);

  // ── 2. Destello se expande verticalmente ────────────────
  tl.to(flashEl, { scaleY: 1, duration: 0.38, ease: 'power2.out' }, 0.1);

  // ── 3. Destello desaparece ───────────────────────────────
  tl.to(flashEl, { opacity: 0, duration: 0.28, ease: 'power1.in' }, 0.44);

  // ── 4. Fósforo verde aparece (screen fade-in) ───────────
  tl.to(screenEl, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0.5);

  // ── 5. Tipeo de las cuatro líneas ───────────────────────
  // Velocidad: ~40-50ms por caracter. Pausas entre líneas para efecto natural.
  const BASE = 0.95;
  const CHAR_MS = 0.048; // segundos por caracter
  const GAPS = [0.08, 0.14, 0.12, 0.10]; // pausa post-línea

  let cursor = BASE;
  BOOT_LINES.forEach((text, i) => {
    const dur = text.length * CHAR_MS;
    typeInto(tl, lineEls[i], text, cursor, dur);
    cursor += dur + GAPS[i];
  });

  // ── 6. Cursor aparece al terminar ───────────────────────
  tl.to(cursorEl, { opacity: 1, duration: 0.08, ease: 'none' }, cursor);

  return tl;
}

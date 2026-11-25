import gsap from 'gsap';
import { sceneStore } from './rig';
import { typeInto } from './typeInto';
import { getPrefersReducedMotion } from '../config/motion';

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

let registeredEls: BootElements | null = null;
let activeTl: gsap.core.Timeline | null = null;
let introBusy = false;

export function registerBootElements(els: BootElements | null): void {
  registeredEls = els;
}

function getEls(): BootElements | null {
  if (registeredEls) return registeredEls;
  const flashEl = document.querySelector<HTMLElement>('[data-boot="flash"]');
  const screenEl = document.querySelector<HTMLElement>('[data-boot="screen"]');
  const line0 = document.querySelector<HTMLElement>('[data-boot="line-0"]');
  const line1 = document.querySelector<HTMLElement>('[data-boot="line-1"]');
  const line2 = document.querySelector<HTMLElement>('[data-boot="line-2"]');
  const line3 = document.querySelector<HTMLElement>('[data-boot="line-3"]');
  const cursorEl = document.querySelector<HTMLElement>('[data-boot="cursor"]');
  if (!flashEl || !screenEl || !line0 || !line1 || !line2 || !line3 || !cursorEl) {
    return null;
  }
  return { flashEl, screenEl, lineEls: [line0, line1, line2, line3], cursorEl };
}

export function killBootTimeline(): void {
  if (activeTl) {
    activeTl.kill();
    activeTl = null;
  }
  introBusy = false;
  const els = getEls();
  if (els) {
    gsap.killTweensOf([els.flashEl, els.screenEl, els.cursorEl, ...els.lineEls]);
  }
  gsap.killTweensOf(['.intro-layer', '.intro-layer p, .intro-sep, .intro-row']);
}

/**
 * Aplica inmediatamente el estado final del boot sin animación.
 * Usado cuando prefers-reduced-motion está activo o al volver a la escena.
 */
export function applyBootFinalState(els: BootElements): void {
  const { flashEl, screenEl, lineEls, cursorEl } = els;
  gsap.set(flashEl, { opacity: 0, scaleY: 0 });
  gsap.set(screenEl, { autoAlpha: 1 });
  gsap.set('.intro-layer', { autoAlpha: 0 });
  BOOT_LINES.forEach((text, i) => {
    lineEls[i].textContent = text;
  });
  gsap.set(cursorEl, { opacity: 1 });
}

/**
 * Enciende el CRT (destello, fósforo) y muestra la pantalla institucional
 * dentro del monitor sin iniciar todavía el tipeo del boot.
 */
export function showIntro(): gsap.core.Timeline | null {
  if (introBusy) return null;
  killBootTimeline();
  const els = getEls();
  if (!els) return null;
  const { flashEl, screenEl, lineEls, cursorEl } = els;

  lineEls.forEach((el) => { el.textContent = ''; });
  gsap.set(cursorEl, { opacity: 0 });
  gsap.set(screenEl, { autoAlpha: 0 });

  if (getPrefersReducedMotion()) {
    gsap.set(flashEl, { opacity: 0, scaleY: 0 });
    gsap.set('.intro-layer', { autoAlpha: 1 });
    gsap.set('.intro-layer p, .intro-sep, .intro-row', { autoAlpha: 1, clearProps: 'transform' });
    sceneStore.set({ introShown: true });
    return null;
  }

  // ── Estado inicial ───────────────────────────────────────
  gsap.set(flashEl, { opacity: 0, scaleY: 0, scaleX: 1 });
  gsap.set('.intro-layer', { autoAlpha: 0 });

  introBusy = true;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onComplete() {
      introBusy = false;
      sceneStore.set({ introShown: true });
    },
    onInterrupt() {
      introBusy = false;
    },
  });
  activeTl = tl;

  // ── 1. Destello: línea delgada aparece en el centro ─────
  tl.to(flashEl, { opacity: 1, scaleY: 0.012, duration: 0.1, ease: 'power2.out' }, 0);

  // ── 2. Destello se expande verticalmente ────────────────
  tl.to(flashEl, { scaleY: 1, duration: 0.38, ease: 'power2.out' }, 0.1);

  // ── 3. Destello desaparece ───────────────────────────────
  tl.to(flashEl, { opacity: 0, duration: 0.28, ease: 'power1.in' }, 0.44);

  // ── 4. Pantalla institucional dentro del CRT ────────────
  tl.to('.intro-layer', { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0.95);
  tl.fromTo(
    '.intro-layer p, .intro-sep, .intro-row',
    { autoAlpha: 0, y: 6 },
    { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.3, ease: 'power2.out' },
    0.95
  );

  return tl;
}

/**
 * Desvanece la pantalla institucional y ejecuta el tipeo de las 4 líneas del boot.
 */
export function startBoot(): gsap.core.Timeline | null {
  const s = sceneStore.get();
  if (introBusy || !s.introShown || s.bootStarted) return null;

  killBootTimeline();
  const els = getEls();
  if (!els) return null;
  const { screenEl, lineEls, cursorEl } = els;

  sceneStore.set({ bootStarted: true });
  lineEls.forEach((el) => { el.textContent = ''; });
  gsap.set(cursorEl, { opacity: 0 });
  gsap.set(screenEl, { autoAlpha: 0 });

  if (getPrefersReducedMotion()) {
    applyBootFinalState(els);
    sceneStore.set({ booted: true });
    return null;
  }

  introBusy = true;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onComplete() {
      introBusy = false;
      sceneStore.set({ booted: true });
    },
    onInterrupt() {
      introBusy = false;
    },
  });
  activeTl = tl;

  tl.to('.intro-layer', { autoAlpha: 0, duration: 0.5, ease: 'power1.inOut' }, 0);
  tl.set(screenEl, { autoAlpha: 1 }, 0.5);

  // ── Tipeo de las cuatro líneas ──────────────────────────
  const CHAR_MS = 0.048; // segundos por caracter
  const GAPS = [0.08, 0.14, 0.12, 0.10]; // pausa post-línea

  let cursor = 0.5;
  BOOT_LINES.forEach((text, i) => {
    const dur = text.length * CHAR_MS;
    typeInto(tl, lineEls[i], text, cursor, dur);
    cursor += dur + GAPS[i];
  });

  // ── Cursor aparece al terminar ──────────────────────────
  tl.to(cursorEl, { opacity: 1, duration: 0.08, ease: 'none' }, cursor);

  return tl;
}

/**
 * Vuelve desde el boot terminado a la pantalla institucional sin re-animar.
 */
export function backToIntro(): void {
  if (introBusy) return;
  killBootTimeline();
  const els = getEls();
  if (els) {
    els.lineEls.forEach((el) => { el.textContent = ''; });
    gsap.set(els.cursorEl, { opacity: 0 });
    gsap.set(els.screenEl, { autoAlpha: 0 });
  }
  gsap.set('.intro-layer', { autoAlpha: 1 });
  gsap.set('.intro-layer p, .intro-sep, .intro-row', { autoAlpha: 1, clearProps: 'transform' });
  sceneStore.set({ booted: false, bootStarted: false, introShown: true });
}

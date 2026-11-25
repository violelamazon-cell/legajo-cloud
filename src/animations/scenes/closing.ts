import { endScene, type SceneBuilder } from '../timeline';

export const buildClosing: SceneBuilder = (tl) => {
  const t = tl.duration();
  // Tramo A: zoom out a la MacBook completa y aparece «GRACIAS.» (reposo en s6)
  tl.to('.mac-zoom', { scale: 1, x: 0, y: 0, duration: 2.0, ease: 'power2.inOut' }, t);
  tl.to('.met-layer', { autoAlpha: 0, duration: 0.8, ease: 'power1.inOut' }, t + 0.2);
  tl.to('.close-layer', { autoAlpha: 1, duration: 0.01 }, t + 1.2);
  tl.fromTo('.close-title', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, t + 1.2);
  tl.fromTo('.close-sub', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, t + 1.6);
  tl.fromTo('.close-refs', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, t + 1.8);
  endScene(tl, 's6', t + 2.6);
  // Tramo B: se apaga SOLO la pantalla; la MacBook, sus bordes de luz y el fondo quedan como están
  const u = tl.duration();
  tl.to('.close-layer', { autoAlpha: 0, duration: 0.8, ease: 'power1.in' }, u);
  tl.to('.mac-screen', { autoAlpha: 0, duration: 1.2, ease: 'power1.in' }, u + 0.3);
  endScene(tl, 's7', u + 1.8);
};

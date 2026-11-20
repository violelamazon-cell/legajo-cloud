import type { SceneBuilder } from '../timeline';
import { rig } from '../rig';

// Zoom equilibrado para la escena 02:
// - Mantiene visible el marco beige completo del monitor CRT frontal
// - Mantiene el botón de encendido y el bisel inferior cómodamente visibles
// - Centra la pantalla y la matriz 2×2 dentro del cristal
const DECISION_ZOOM = 1.62;
const DECISION_TX = 0;
const DECISION_TY = 275;

export const buildDecision: SceneBuilder = (tl) => {
  const t = tl.duration();

  // Estados iniciales en t=0 para garantizar reversibilidad determinista
  tl.set('#boot-terminal-layer', { autoAlpha: 1 }, 0);
  tl.set('#scene-2', { autoAlpha: 0 }, 0);
  tl.set('.decision-border', { autoAlpha: 0 }, 0);
  tl.set('.decision-line-h', { scaleX: 0, transformOrigin: 'center center' }, 0);
  tl.set('.decision-line-v', { scaleY: 0, transformOrigin: 'center center' }, 0);
  tl.set('.decision-cell', { autoAlpha: 0, y: 15 }, 0);
  tl.set('.decision-migrar-frame', { autoAlpha: 0, scale: 0.85 }, 0);

  // 1. Zoom suave de cámara hacia el encuadre centrado y equilibrado del monitor CRT
  tl.to(
    rig,
    { s: DECISION_ZOOM, tx: DECISION_TX, ty: DECISION_TY, era: 0.1, duration: 1, ease: 'power2.inOut' },
    t
  );

  // 2. Transición de capas en el cristal: la terminal de boot desaparece por completo
  tl.to('#boot-terminal-layer', { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t);

  // 3. La matriz de decisión aparece en su lugar sobre el cristal del CRT
  tl.to('#scene-2', { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, t + 0.15);

  // 4. Se dibuja la grilla: marco exterior y líneas divisorias
  tl.to('.decision-border', { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, t + 0.35);
  tl.to('.decision-line-h', { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, t + 0.45);
  tl.to('.decision-line-v', { scaleY: 1, duration: 0.35, ease: 'power2.inOut' }, t + 0.55);

  // 5. Las cuatro celdas aparecen con stagger progresivo
  tl.to(
    '.decision-cell',
    { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.28, ease: 'power2.out' },
    t + 0.75
  );

  // 6. Marco angular táctico de [04] MIGRAR
  tl.to(
    '.decision-migrar-frame',
    { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'back.out(1.6)' },
    t + 1.2
  );

  // 7. Reposo de la escena 02
  tl.addLabel('s1', t + 1.45);
};

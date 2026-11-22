import { endScene, type SceneBuilder } from '../timeline';
import { rig, applyRig } from '../rig';
import { fx } from '../../three/fx';
import { MAC_OFFSET_X } from '../../config/calibration';

const fxUpdate = applyRig;

export const buildMigration: SceneBuilder = (tl) => {
  // Estado inicial en t=0 para reversibilidad determinista
  // NOTA: #cloud-screen NO se inicializa aquí — su visibilidad la gestiona React
  // (visibility: hidden cuando isBooted=false). Tocar autoAlpha desde el master
  // timeline rompe la reversibilidad porque el encendido ocurre fuera del timeline.
  tl.set('#scene-4', { autoAlpha: 0 }, 0);
  tl.set('.mac-floor-glow', { opacity: 0 }, 0);
  tl.set('.mac-arrival-flash', { opacity: 0 }, 0);

  const t = tl.duration();
  const DUR = 2.5;

  // ── 1. Revelar contenedor de la escena 04 ────────────────────────────────
  tl.to('#scene-4', { autoAlpha: 1, duration: 0.15, onUpdate: fxUpdate }, t);

  // ── 2. Paneo horizontal continuo: rig.tx 0 → -1920 ───────────────────────
  tl.to(
    rig,
    { tx: -MAC_OFFSET_X, duration: DUR, ease: 'none', onUpdate: fxUpdate },
    t,
  );

  // ── 3. Transición de era (retro → moderno: 0.30 → 0.80) ───────────────────
  tl.to(
    rig,
    { era: 0.80, duration: DUR, ease: 'power1.inOut', onUpdate: fxUpdate },
    t,
  );

  // ── 3b. Ocultación controlada y reversible de la PC retro y cápsula wrapper ──
  tl.to(
    ['#scene-1', '.wrapper-floor', '.wrap-label', '.crt-layer--wrapper'],
    { autoAlpha: 0, duration: DUR * 0.45, ease: 'power1.inOut', onUpdate: fxUpdate },
    t + DUR * 0.25,
  );
  tl.to(
    fx,
    { wrapOpacity: 0, ringsOpacity: 0, duration: DUR * 0.45, ease: 'power1.inOut', onUpdate: fxUpdate },
    t + DUR * 0.25,
  );

  // ── 4. Fondo: oscuro (#050505) → carbón (#111318) a mitad del paneo ──────
  tl.to(
    '#migration-bg-overlay',
    {
      opacity: 1,
      duration: DUR * 0.45,
      ease: 'power1.inOut',
      onUpdate: fxUpdate,
    },
    t + DUR * 0.10,
  );
  //    Al aproximarse a la MacBook, el fondo se oscurece nuevamente a negro
  tl.to(
    '#migration-bg-overlay',
    {
      opacity: 0,
      duration: DUR * 0.35,
      ease: 'power1.in',
      onUpdate: fxUpdate,
    },
    t + DUR * 0.65,
  );

  // ── 5. Haces de fibra óptica: salen de la cápsula retro y avanzan ─────────
  tl.to(
    fx,
    { beamsT: 1, duration: DUR * 0.82, ease: 'power1.inOut', onUpdate: fxUpdate },
    t + 0.05,
  );

  // ── 6. Partículas de datos fluyendo continuamente hacia la MacBook ───────
  tl.to(
    fx,
    { particlesT: 1, duration: DUR, ease: 'none', onUpdate: fxUpdate },
    t,
  );

  // ── 7. Llegada de los haces y destello sutil en el puerto USB-C ──────────
  const arrivalT = t + 0.05 + DUR * 0.82;
  tl.to(
    fx,
    { arrivalFlash: 1, duration: 0.10, ease: 'power3.out', onUpdate: fxUpdate },
    arrivalT,
  );
  tl.to(
    '.mac-arrival-flash',
    { opacity: 0.65, duration: 0.08, ease: 'power3.out', onUpdate: fxUpdate },
    arrivalT,
  );
  tl.to(
    fx,
    { arrivalFlash: 0, duration: 0.20, ease: 'power2.in', onUpdate: fxUpdate },
    arrivalT + 0.10,
  );
  tl.to(
    '.mac-arrival-flash',
    { opacity: 0, duration: 0.20, ease: 'power2.in', onUpdate: fxUpdate },
    arrivalT + 0.08,
  );

  // ── 8. Atenuación completa de los haces tras completar la transferencia ──
  tl.to(
    fx,
    { beamsFade: 1.0, duration: 0.35, ease: 'power2.in', onUpdate: fxUpdate },
    arrivalT + 0.10,
  );

  // ── 9. Reposo de la Escena 04 (FASE B: Espera interactiva) ────────────────
  //    La MacBook permanece 100% apagada en el timeline de scroll.
  //    El encendido deliberate ocurre únicamente por interacción del usuario (click).
  endScene(tl, 's3', t + 2.55);
};

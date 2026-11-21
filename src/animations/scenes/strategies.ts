import type { SceneBuilder } from '../timeline';
import { rig, applyRig } from '../rig';
import { fx } from '../../three/fx';

const fxUpdate = applyRig;

export const buildStrategies: SceneBuilder = (tl) => {
  const t = tl.duration();

  // Garantizar estado inicial de fx para reversibilidad
  tl.set(fx, { beamsFade: 1, arrivalFlash: 0 }, t);

  // La MacBook queda protagonista un momento (escena 04 visible)
  // mientras la escena 05 aparece por encima con un fade suave
  tl.to('#scene-4', { autoAlpha: 0, duration: 0.50, ease: 'power1.in', onUpdate: fxUpdate }, t + 0.15);
  tl.to('#scene-5', { autoAlpha: 1, duration: 0.55, ease: 'power1.out', onUpdate: fxUpdate }, t + 0.35);

  // La cámara hace un ligero zoom y continúa la transición de era
  tl.to(rig, { s: 1.15, era: 0.85, duration: 1, ease: 'power2.inOut', onUpdate: fxUpdate }, t);

  // El overlay de fondo carbón vuelve a negro al entrar en la escena 05
  tl.to(
    '#migration-bg-overlay',
    { opacity: 0, duration: 0.5, ease: 'power1.in', onUpdate: fxUpdate },
    t,
  );

  tl.addLabel('s4', t + 1);
};

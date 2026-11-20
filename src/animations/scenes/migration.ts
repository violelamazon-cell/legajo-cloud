import type { SceneBuilder } from '../timeline';
import { rig } from '../rig';

export const buildMigration: SceneBuilder = (tl) => {
  const t = tl.duration();
  // Estado inicial en t=0 para reversibilidad determinista
  tl.set('#scene-4', { autoAlpha: 0 }, 0);

  // Transición de salida de escena 3 y entrada de escena 4
  tl.to('#scene-3', { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, t);
  tl.to('#scene-4', { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, t);
  // Paneo horizontal de 2.5 viewports de scroll vertical continuo
  tl.to(rig, { tx: -1600, era: 0.75, duration: 2.5, ease: 'none' }, t);
  tl.addLabel('s3', t + 2.5);
};

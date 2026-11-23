import { rig } from '../rig';
import { fx } from '../../three/fx';
import { endScene, type SceneBuilder } from '../timeline';
import { macLocalZoom } from '../../config/calibration';

export const buildStrategies: SceneBuilder = (tl) => {
  const t = tl.duration();

  tl.set('#scene-4', { autoAlpha: 1 }, t);
  tl.set('.mac-zoom', { scale: 1, x: 0, y: 0 }, 0);
  tl.to(
    '.mac-zoom',
    {
      scale: () => macLocalZoom().k,
      x: () => macLocalZoom().x,
      y: () => macLocalZoom().y,
      duration: 2.0,
      ease: 'power2.inOut',
      force3D: true,
    },
    t
  );
  tl.to(rig, { era: 1, duration: 2.0, ease: 'power2.inOut' }, t);

  // Ocultar capas pesadas externas a la pantalla durante el zoom
  tl.to(
    ['.mac-plate--reflection', '.mac-floor-glow', '.mac-arrival-flash', '#stage canvas'],
    { autoAlpha: 0, duration: 0.3 },
    t
  );

  // Garantizar extinción total de haces de fibra al entrar en estrategias
  tl.to(fx, { beamsFade: 1.0, duration: 0.2 }, t);
  tl.to('.retro-layer',          { autoAlpha: 0, duration: 0.4 }, t);
  // Cloud desaparece recién al terminar el zoom; luego aparecen las tarjetas.
  tl.to('#cloud-screen-wrapper', { autoAlpha: 0, duration: 0.4, ease: 'power1.inOut' }, t + 2.0);
  tl.to('.strat-layer',          { autoAlpha: 1, duration: 0.01 }, t + 2.3);
  tl.to('.strat-card',           { autoAlpha: 1, y: 0, stagger: 0.2, duration: 0.5, ease: 'power2.out' }, t + 2.4);
  endScene(tl, 's4', t + 3.5);
};

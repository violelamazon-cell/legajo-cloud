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
      duration: 1.6,
      ease: 'power2.inOut',
    },
    t
  );
  tl.to(rig, { era: 1, duration: 1.6, ease: 'power2.inOut' }, t);

  // Garantizar extinción total de haces de fibra al entrar en estrategias
  tl.to(fx, { beamsFade: 1.0, duration: 0.2 }, t);
  tl.to('.retro-layer',          { autoAlpha: 0, duration: 0.4 }, t + 0.5);
  // Cross-fade: Cloud desaparece, .strat-layer aparece.
  tl.to('#cloud-screen-wrapper', { autoAlpha: 0, duration: 0.5, ease: 'power1.inOut' }, t + 0.9);
  tl.to('.strat-layer',          { autoAlpha: 1, duration: 0.01 }, t + 1.2);
  tl.to('.strat-card',           { autoAlpha: 1, y: 0, stagger: 0.2, duration: 0.5, ease: 'power2.out' }, t + 1.3);
  endScene(tl, 's4', t + 2.6);
};

import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SceneBuilder } from '../../animations/timeline';

type GSTimeline = Parameters<SceneBuilder>[0];

export const bindNavigation = (_trigger: ScrollTrigger, _tl: GSTimeline): void => {
  // Stub para Etapa 1
};

export function goToScene(_i: number): void {
  // Stub para Etapa 1
}

export const stepScene = (_d: 1 | -1): void => {
  // Stub para Etapa 1
};

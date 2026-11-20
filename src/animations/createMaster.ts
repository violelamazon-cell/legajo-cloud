import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SceneBuilder } from './timeline';

type GSTimeline = Parameters<SceneBuilder>[0];

/**
 * Contrato de createMaster (se implementará en Etapa 1)
 */
export type MasterScrollTrigger = ScrollTrigger | null;

export function createMaster(_stage: HTMLElement, _tl: GSTimeline): MasterScrollTrigger {
  return null;
}

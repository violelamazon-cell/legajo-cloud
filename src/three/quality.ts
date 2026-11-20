export type QualityTier = 'high' | 'medium' | 'low' | 'fallback';

export interface QualityConfig {
  tier: QualityTier;
  maxDpr: number;
  particles: number;
  enableBloom: boolean;
  antialias: boolean;
  webgl: boolean;
}

export const QUALITY_PRESETS: Record<QualityTier, QualityConfig> = {
  high: {
    tier: 'high',
    maxDpr: 2,
    particles: 600,
    enableBloom: true,
    antialias: true,
    webgl: true,
  },
  medium: {
    tier: 'medium',
    maxDpr: 2,
    particles: 300,
    enableBloom: false,
    antialias: true,
    webgl: true,
  },
  low: {
    tier: 'low',
    maxDpr: 1,
    particles: 100,
    enableBloom: false,
    antialias: false,
    webgl: true,
  },
  fallback: {
    tier: 'fallback',
    maxDpr: 1,
    particles: 0,
    enableBloom: false,
    antialias: false,
    webgl: false,
  },
};

export function getQualityTier(): QualityConfig {
  if (typeof window === 'undefined') return QUALITY_PRESETS.medium;

  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('quality') as QualityTier | null;

  if (qParam && qParam in QUALITY_PRESETS) {
    return QUALITY_PRESETS[qParam];
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    return QUALITY_PRESETS.low;
  }

  return QUALITY_PRESETS.medium;
}

export const quality = getQualityTier();

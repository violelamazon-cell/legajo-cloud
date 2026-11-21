import { CanvasTexture } from 'three';

let pTex: CanvasTexture | null = null;

export function getParticleTexture(): CanvasTexture {
  if (pTex) return pTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;

  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(210, 250, 255, 0.90)');
  gr.addColorStop(0.25, 'rgba(34, 230, 216, 0.70)');
  gr.addColorStop(0.60, 'rgba(120, 160, 255, 0.35)');
  gr.addColorStop(0.85, 'rgba(165, 107, 255, 0.10)');
  gr.addColorStop(1, 'rgba(165, 107, 255, 0)');

  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);

  pTex = new CanvasTexture(c);
  return pTex;
}

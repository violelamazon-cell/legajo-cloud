import { CanvasTexture } from 'three';

let tex: CanvasTexture | null = null;
export function getGlowTexture() {
  if (tex) return tex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, 'rgba(160,255,200,0.95)');
  gr.addColorStop(0.45, 'rgba(25,245,140,0.35)');
  gr.addColorStop(1, 'rgba(25,245,140,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  tex = new CanvasTexture(c);
  return tex;
}

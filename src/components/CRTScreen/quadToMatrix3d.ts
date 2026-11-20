import type { ScreenCorners } from '../../config/calibration';

/**
 * Calcula una matriz de transformación CSS matrix3d a partir de las 4 esquinas del cuadrilátero destino
 * utilizando una homografía proyectiva 2D exacta.
 *
 * Formato de coordenadas:
 * Cada esquina es una tupla [x, y] en píxeles dentro del sistema de referencia del plate contenedor.
 * - topLeft: esquina superior izquierda
 * - topRight: esquina superior derecha
 * - bottomRight: esquina inferior derecha
 * - bottomLeft: esquina inferior izquierda
 *
 * @param corners Coordenadas de las 4 esquinas en píxeles
 * @param srcWidth Ancho del contenedor de contenido origen
 * @param srcHeight Alto del contenedor de contenido origen
 * @returns Cadena CSS 'matrix3d(...)' aplicable con 'transform-origin: 0 0'
 */
export function quadToMatrix3d(
  corners: ScreenCorners,
  srcWidth: number,
  srcHeight: number,
): string {
  const [x0, y0] = corners.topLeft;
  const [x1, y1] = corners.topRight;
  const [x2, y2] = corners.bottomRight;
  const [x3, y3] = corners.bottomLeft;

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const sx = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sy = y0 - y1 + y2 - y3;

  let h00: number;
  let h01: number;
  let h02: number;
  let h10: number;
  let h11: number;
  let h12: number;
  let h20: number;
  let h21: number;

  // Si sx y sy son cero, el cuadrilátero es un paralelogramo (transformación afín)
  if (Math.abs(sx) < 1e-6 && Math.abs(sy) < 1e-6) {
    h00 = x1 - x0;
    h01 = x3 - x0;
    h02 = x0;
    h10 = y1 - y0;
    h11 = y3 - y0;
    h12 = y0;
    h20 = 0;
    h21 = 0;
  } else {
    // Transformación proyectiva completa (con perspectiva real 3D)
    const det = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(det) < 1e-8) {
      return 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';
    }

    h20 = (sx * dy2 - sy * dx2) / det;
    h21 = (dx1 * sy - dy1 * sx) / det;
    h00 = x1 - x0 + h20 * x1;
    h01 = x3 - x0 + h21 * x3;
    h02 = x0;
    h10 = y1 - y0 + h20 * y1;
    h11 = y3 - y0 + h21 * y3;
    h12 = y0;
  }

  // Normalizar dividiendo por las dimensiones fuente para que el elemento [0..srcWidth]x[0..srcHeight]
  // se ajuste de forma exacta al cuadrilátero destino
  const m11 = h00 / srcWidth;
  const m12 = h10 / srcWidth;
  const m13 = 0;
  const m14 = h20 / srcWidth;

  const m21 = h01 / srcHeight;
  const m22 = h11 / srcHeight;
  const m23 = 0;
  const m24 = h21 / srcHeight;

  const m31 = 0;
  const m32 = 0;
  const m33 = 1;
  const m34 = 0;

  const m41 = h02;
  const m42 = h12;
  const m43 = 0;
  const m44 = 1;

  return `matrix3d(${m11},${m12},${m13},${m14},${m21},${m22},${m23},${m24},${m31},${m32},${m33},${m34},${m41},${m42},${m43},${m44})`;
}

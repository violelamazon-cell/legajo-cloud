export interface ScreenCorners {
  topLeft: [number, number];
  topRight: [number, number];
  bottomRight: [number, number];
  bottomLeft: [number, number];
}

// Dimensiones de referencia del plate (public/plates/pc-off.png)
export const PLATE_WIDTH = 1536;
export const PLATE_HEIGHT = 1024;

// Coordenadas calibradas del cristal CRT en el espacio de píxeles del plate (vista frontal simétrica)
// Cristal: X=[488..1048] (ancho 560px, centro X=768), Y=[106..496] (alto 390px, centro Y=301)
export const CRT_SCREEN_CORNERS: ScreenCorners = {
  topLeft: [488, 106],
  topRight: [1048, 106],
  bottomRight: [1048, 496],
  bottomLeft: [488, 496],
};

// Calibración placeholder para pantalla MacBook (etapas posteriores)
export const MAC_SCREEN_CORNERS: ScreenCorners = {
  topLeft: [0, 0],
  topRight: [1920, 0],
  bottomRight: [1920, 1080],
  bottomLeft: [0, 1080],
};

// Valores derivados de calibración para zoom al cristal de la PC retro frontal
// Centro del cristal = (768, 301) -> Delta respecto al centro del plate (768, 512) = (0, -211)
export const SCREEN_ZOOM = 2.6;
export const SCREEN_TX = 0;
export const SCREEN_TY = 549;

// Dimensiones de la PC reducida en espacio base (plate de 1536×1024)
export const PC_BOX = { w: 560, h: 490 };

// Dimensiones y orientación de la cápsula dicroica envolvente en espacio base
// Al multiplicarse por scale en Three.js, la cápsula ocupa ~74% del alto disponible
// y la computadora ocupa ~66-70% del interior de la cápsula con aire visible alrededor.
export const WRAP = {
  w: 840,       // ancho que encuadra perfectamente con margen
  h: 740,       // alto que entra completo en el viewport sin cortes
  d: 380,       // profundidad moderada
  radius: 60,   // esquinas muy redondeadas idénticas a la referencia
  rotX: 0.04,   // perspectiva superior sutil (~2.3°)
  rotY: 0.11,   // perspectiva lateral sutil (~6.3°)
  centerY: -10, // compensación sutil para concentricidad con el monitor y teclado
};

// Radios orbitales proporcionados a la cápsula (ceñidos elegantemente alrededor del vidrio)
export const RING = {
  r1: 435, tiltX1: 1.15, tiltZ1: -0.15, phase1: 0.0,
  r2: 458, tiltX2: 0.94, tiltZ2: 0.18,  phase2: 1.1,
};

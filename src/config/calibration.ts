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

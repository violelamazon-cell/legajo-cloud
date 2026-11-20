export interface ScreenCorners {
  topLeft: [number, number];
  topRight: [number, number];
  bottomRight: [number, number];
  bottomLeft: [number, number];
}

// Dimensiones de referencia del plate (public/plates/pc-off.png)
export const PLATE_WIDTH = 1536;
export const PLATE_HEIGHT = 1024;

// Coordenadas calibradas del cristal CRT en el espacio de píxeles del plate
export const CRT_SCREEN_CORNERS: ScreenCorners = {
  topLeft: [533, 126],
  topRight: [1053, 126],
  bottomRight: [1048, 524],
  bottomLeft: [536, 524],
};

// Calibración placeholder para pantalla MacBook (etapas posteriores)
export const MAC_SCREEN_CORNERS: ScreenCorners = {
  topLeft: [0, 0],
  topRight: [1920, 0],
  bottomRight: [1920, 1080],
  bottomLeft: [0, 1080],
};

// Valores derivados de calibración para zoom al cristal de la PC retro (~2.6x para encuadre con bisel como en el PDF)
// Centro del cristal = (793, 325) -> Delta respecto al centro del plate (768, 512) = (+25, -187)
export const SCREEN_ZOOM = 2.6;
export const SCREEN_TX = -65;
export const SCREEN_TY = 486;

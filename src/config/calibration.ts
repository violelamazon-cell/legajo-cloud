export interface ScreenCorners {
  topLeft: [number, number];
  topRight: [number, number];
  bottomRight: [number, number];
  bottomLeft: [number, number];
}

// Calibración placeholder para pantalla CRT (Etapa 2 medirá los valores exactos)
export const CRT_SCREEN_CORNERS: ScreenCorners = {
  topLeft: [0, 0],
  topRight: [1920, 0],
  bottomRight: [1920, 1080],
  bottomLeft: [0, 1080],
};

// Calibración placeholder para pantalla MacBook
export const MAC_SCREEN_CORNERS: ScreenCorners = {
  topLeft: [0, 0],
  topRight: [1920, 0],
  bottomRight: [1920, 1080],
  bottomLeft: [0, 1080],
};

export const SCREEN_ZOOM = 3.5;
export const SCREEN_TX = 0;
export const SCREEN_TY = 0;

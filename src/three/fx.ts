export interface FXState {
  wrapY: number;
  wrapRotY: number;
  wrapOpacity: number;
  wrapGlow: number;
  ringsScale: number;
  ringsOpacity: number;
  ringsT: number;
  beamsT: number;
  particlesT: number;
  /** 0→1: los haces se atenúan una vez que completan la transferencia */
  beamsFade: number;
  /** 0→1: destello de llegada al puerto de la MacBook */
  arrivalFlash: number;
}

export const FX_INITIAL: FXState = {
  wrapY: 1100,
  wrapRotY: 1.1,
  wrapOpacity: 0,
  wrapGlow: 0,
  ringsScale: 0.6,
  ringsOpacity: 0,
  ringsT: 0,
  beamsT: 0,
  particlesT: 0,
  beamsFade: 0,
  arrivalFlash: 0,
};

export const fx: FXState = { ...FX_INITIAL };

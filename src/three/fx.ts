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
};

export const fx: FXState = { ...FX_INITIAL };

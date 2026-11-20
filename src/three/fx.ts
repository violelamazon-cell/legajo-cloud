/**
 * Estado mutable de efectos 3D compartido entre GSAP y R3F
 */
export interface FXState {
  wrapperY: number;
  ringsT: number;
  beamsT: number;
  particlesT: number;
}

export const fx: FXState = {
  wrapperY: 0,
  ringsT: 0,
  beamsT: 0,
  particlesT: 0,
};

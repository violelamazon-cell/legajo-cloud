import { ShaderMaterial, AdditiveBlending } from 'three';

const vert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWP;

void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const frag = /* glsl */ `
varying vec2 vUv;
varying vec3 vWP;

uniform float uProgress;
uniform float uOpacity;
uniform float uPulse;
uniform float uIsHalo;
uniform float uFade;
uniform float uArrivalFlash;

void main() {
  // vUv.x va de 0.0 (origen PC retro) a 1.0 (destino MacBook)
  float head = uProgress;

  // Revelado progresivo del haz gobernado por uProgress
  float reveal = smoothstep(head + 0.012, head - 0.04, vUv.x);

  // Pulso sutil y uniforme en la cabeza del haz (sin saturación blanca agresiva)
  float distToHead = abs(vUv.x - head);
  float leadGlow = exp(-distToHead * 45.0) * 0.45;

  // Destello de llegada sutil y concentrado exclusivamente en el puerto (vUv.x > 0.96)
  float atPort = smoothstep(0.96, 1.0, vUv.x);
  float arrivalGlow = uArrivalFlash * atPort * 1.2;

  // Degradé cromático cinematográfico controlado: cian → azul cobalto → violeta
  vec3 colCyan   = vec3(0.12, 0.90, 0.95);
  vec3 colMid    = vec3(0.25, 0.45, 0.95);
  vec3 colViolet = vec3(0.70, 0.25, 0.95);
  vec3 colFlash  = vec3(0.85, 0.95, 1.00);

  float t = smoothstep(0.0, 1.0, vUv.x);
  vec3 baseCol = t < 0.5
    ? mix(colCyan, colMid, t * 2.0)
    : mix(colMid, colViolet, (t - 0.5) * 2.0);

  // El color mantiene su tono uniforme cian/violeta durante el recorrido;
  // solo se ilumina en la punta del puerto al llegar
  vec3 col = baseCol + colCyan * (leadGlow * 0.25) + colFlash * (arrivalGlow * 0.45);

  // Perfil cilíndrico del tubo
  float tubeEdge = sin(vUv.y * 3.14159265);
  float tubeProfile;
  if (uIsHalo > 0.5) {
    tubeProfile = pow(max(tubeEdge, 0.0), 1.6);
  } else {
    tubeProfile = pow(max(tubeEdge, 0.0), 0.6); // núcleo nítido y uniforme
  }

  // Brillo base calibrado para evitar saturación bloom
  float baseBrightness = uIsHalo > 0.5 ? 0.45 : 0.95;
  float fadeOut = 1.0 - uFade;
  float alpha = reveal * tubeProfile * (baseBrightness + leadGlow * 0.2 + arrivalGlow * 0.3) * uOpacity * fadeOut;
  if (uIsHalo > 0.5) {
    alpha *= 0.30;
  }

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`;

export function makeFiberMaterial(isHalo = false) {
  return new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uProgress: { value: 0 },
      uOpacity: { value: 0 },
      uPulse: { value: 0 },
      uIsHalo: { value: isHalo ? 1 : 0 },
      uFade: { value: 0 },
      uArrivalFlash: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
}

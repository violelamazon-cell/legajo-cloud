import { ShaderMaterial, FrontSide, BackSide, NormalBlending, Vector3 } from 'three';

const vert = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vWP;
varying vec3 vLocalPos;
varying vec3 vLocalNorm;

void main() {
  vLocalPos = position;
  vLocalNorm = normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const frag = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vWP;
varying vec3 vLocalPos;
varying vec3 vLocalNorm;

uniform float uOpacity;
uniform float uGlow;
uniform float uBack;
uniform float uShift;
uniform vec3 uDim;

// Coordenada perimetral horaria [0, 1] a lo largo del contorno rectangular:
// Inicia en la esquina superior izquierda (-1, 1) y recorre Top -> Right -> Bottom -> Left
float getPerimeterT(vec2 p) {
  vec2 cp = clamp(p, vec2(-1.0), vec2(1.0));
  float wRel = 1.135;
  float hRel = 1.000;
  float perim = 2.0 * (wRel + hRel);

  float d = 0.0;
  if (cp.y >= cp.x && cp.y >= -cp.x) {
    // Borde superior: de x=-1 a x=1
    d = (cp.x + 1.0) * 0.5 * wRel;
  } else if (cp.x >= cp.y && cp.x >= -cp.y) {
    // Borde derecho: de y=1 a y=-1
    d = wRel + (1.0 - cp.y) * 0.5 * hRel;
  } else if (cp.y <= cp.x && cp.y <= -cp.x) {
    // Borde inferior: de x=1 a x=-1
    d = wRel + hRel + (1.0 - cp.x) * 0.5 * wRel;
  } else {
    // Borde izquierdo: de y=-1 a y=1
    d = wRel + hRel + wRel + (cp.y + 1.0) * 0.5 * hRel;
  }
  return d / perim;
}

// Progresión dicroica continua y calibrada exactamente según la referencia:
// Superior Izquierda: Magenta -> Superior Centro: Violeta y Cian -> Superior Derecha: Verde esmeralda
// Lateral Derecha: Verde esmeralda a Dorado -> Inferior: Cian y Verde -> Lateral Izquierda: Violeta y Magenta
vec3 getDichroicColor(float t) {
  t = fract(t);
  vec3 c_mag = vec3(0.96, 0.18, 0.72); // Magenta
  vec3 c_vio = vec3(0.55, 0.28, 1.00); // Violeta
  vec3 c_cya = vec3(0.00, 0.94, 1.00); // Cian
  vec3 c_gre = vec3(0.06, 0.98, 0.52); // Verde esmeralda brillante
  vec3 c_gol = vec3(1.00, 0.80, 0.22); // Dorado

  if (t < 0.12) {
    float f = smoothstep(0.0, 1.0, t / 0.12);
    return mix(c_mag, c_vio, f);
  } else if (t < 0.22) {
    float f = smoothstep(0.0, 1.0, (t - 0.12) / 0.10);
    return mix(c_vio, c_cya, f);
  } else if (t < 0.32) {
    float f = smoothstep(0.0, 1.0, (t - 0.22) / 0.10);
    return mix(c_cya, c_gre, f);
  } else if (t < 0.50) {
    float f = smoothstep(0.0, 1.0, (t - 0.32) / 0.18);
    return mix(c_gre, c_gol, f);
  } else if (t < 0.65) {
    float f = smoothstep(0.0, 1.0, (t - 0.50) / 0.15);
    return mix(c_gol, c_cya, f);
  } else if (t < 0.82) {
    float f = smoothstep(0.0, 1.0, (t - 0.65) / 0.17);
    return mix(c_cya, c_vio, f);
  } else {
    float f = smoothstep(0.0, 1.0, (t - 0.82) / 0.18);
    return mix(c_vio, c_mag, f);
  }
}

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  vec3 locN = abs(normalize(vLocalNorm));

  // Medida geométrica de curvatura / bisel:
  // En caras planas (frontal, laterales, superior, inferior), un eje es 1.0 y los otros son 0.0 -> max(x, y, z) = 1.0
  // En los biseles redondeados y esquinas, la normal curva suavemente hacia 0.707 o 0.577.
  float flatness = max(locN.x, max(locN.y, locN.z));
  float bevelFactor = smoothstep(0.996, 0.78, flatness);

  // Ángulo de visión respecto a la superficie
  float ndv = abs(dot(N, V));
  float fresnel = pow(1.0 - ndv, 2.5);

  // Perfil del bisel iluminado:
  // Lleno y suave en toda la curvatura de las aristas, complementado con la silueta
  float rim = bevelFactor * (0.80 + 0.50 * fresnel);
  float silhouette = pow(1.0 - ndv, 3.5);
  rim = clamp(max(rim, silhouette * 0.95), 0.0, 1.0);

  // Reflejo vítreo en caras planas (laterales y superior):
  // Es sutil, transparente y libre de artefactos o franjas
  float flatSheen = fresnel * (1.0 - bevelFactor) * 0.06;

  // Fase cromática calculada con el perímetro exacto
  vec3 halfDim = max(uDim * 0.5, vec3(1.0));
  vec3 lp = vLocalPos / halfDim;
  float tPerim = getPerimeterT(lp.xy);

  // Variación en Z sutil para profundidad tridimensional
  float t = fract(tPerim + lp.z * 0.04 + uShift);
  vec3 dichroicCol = getDichroicColor(t);

  // Núcleo especular blanco brillante en la cresta del bisel (hot core highlight)
  float core = pow(bevelFactor, 2.8) * (0.38 + 0.62 * pow(1.0 - ndv, 3.0));
  vec3 edgeCol = mix(dichroicCol, vec3(1.0, 1.0, 1.0), core * 0.72);

  // Color final:
  vec3 col = edgeCol * rim * (1.35 + uGlow * 1.5) + dichroicCol * flatSheen * 0.35;

  // Opacidad:
  // Frente: prácticamente 100% transparente (~0.012)
  // Laterales: transparentes y limpios (~0.03 - 0.04) para ver la computadora retro
  // Biseles y bordes: relieve dicroico hasta 0.92
  float a = mix(0.012, 0.92, pow(rim, 1.35)) + flatSheen * 0.3;

  // Pasada trasera (BackSide) más sutil (36%) para brindar profundidad 3D real sin oscurecer
  a *= uOpacity * mix(1.0, 0.36, uBack);

  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}`;

export function makeGlassMaterial(back: boolean) {
  return new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uOpacity: { value: 0 },
      uGlow: { value: 0 },
      uBack: { value: back ? 1 : 0 },
      uShift: { value: 0 },
      uDim: { value: new Vector3(840, 740, 380) },
    },
    transparent: true,
    depthWrite: false,
    side: back ? BackSide : FrontSide,
    blending: NormalBlending,
    toneMapped: false,
  });
}

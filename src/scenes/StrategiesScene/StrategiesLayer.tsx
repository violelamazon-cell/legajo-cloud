import { useRef, type ReactNode } from 'react';
import { useDiagram } from './useDiagram';
import { BigBang, Paralelo, Strangler } from './diagrams';
import type { diagramBuilders } from './diagramTimelines';
import './strategies.css';

const CARDS = [
  { id: 'bigbang',   n: '01', title: 'BIG BANG',      cap: 'Reemplazo directo en un solo paso',        D: BigBang },
  { id: 'paralelo',  n: '02', title: 'PARALELO',      cap: 'Dos sistemas operando y sincronizados',    D: Paralelo },
  { id: 'strangler', n: '03', title: 'STRANGLER FIG', cap: 'Reemplazo modular y progresivo', D: Strangler, reco: true },
] as const;

function Card({ id, n, title, cap, D, reco }: {
  id: keyof typeof diagramBuilders; n: string; title: string; cap: string; D: () => ReactNode; reco?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { enter, leave, toggle } = useDiagram(root, id);
  return (
    <div
      ref={root}
      className={`strat-card${reco ? ' is-reco' : ''}`}
      tabIndex={0}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocus={enter}
      onBlur={leave}
      onClick={toggle}
    >
      <div className="strat-card-header">
        <span className="strat-n">[{n}]</span>
        {reco && <em className="strat-badge">RECOMENDADA</em>}
      </div>
      <h3>{title}</h3>
      <div className="strat-diag-wrap">
        <D />
      </div>
      <p>{cap}</p>
    </div>
  );
}

/** Fondo ambiental futurista con ondas abstractas luminosas en esquinas */
function AmbientBackground() {
  return (
    <svg className="strat-ambient-bg" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none">
      <defs>
        <radialGradient id="ambGlowTR" cx="90%" cy="10%" r="45%">
          <stop offset="0%" stopColor="#22e6d8" stopOpacity="0.14" />
          <stop offset="60%" stopColor="#a56bff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#04050a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ambGlowBL" cx="10%" cy="90%" r="45%">
          <stop offset="0%" stopColor="#a56bff" stopOpacity="0.12" />
          <stop offset="60%" stopColor="#22e6d8" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#04050a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="waveGradTR1" x1="600" y1="0" x2="1000" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22e6d8" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#3dff8a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a56bff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="waveGradTR2" x1="700" y1="0" x2="1000" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a56bff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#22e6d8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="waveGradBL1" x1="0" y1="300" x2="450" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a56bff" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#22e6d8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22e6d8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="waveGradBL2" x1="0" y1="420" x2="350" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3dff8a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a56bff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Resplandores atmosféricos en esquinas */}
      <rect x="0" y="0" width="1000" height="600" fill="url(#ambGlowTR)" />
      <rect x="0" y="0" width="1000" height="600" fill="url(#ambGlowBL)" />

      {/* Ondas abstractas luminosas — Esquina Superior Derecha */}
      <path
        d="M 680 0 C 760 120, 880 180, 1000 130"
        stroke="url(#waveGradTR1)"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M 740 0 C 810 100, 910 140, 1000 90"
        stroke="url(#waveGradTR2)"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M 620 0 C 720 160, 860 220, 1000 180"
        stroke="url(#waveGradTR1)"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        fill="none"
      />

      {/* Ondas abstractas luminosas — Esquina Inferior Izquierda */}
      <path
        d="M 0 420 C 130 460, 240 520, 380 600"
        stroke="url(#waveGradBL1)"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M 0 490 C 90 510, 180 540, 260 600"
        stroke="url(#waveGradBL2)"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M 0 360 C 160 410, 280 480, 440 600"
        stroke="url(#waveGradBL1)"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        fill="none"
      />
    </svg>
  );
}

export function StrategiesLayer() {
  return (
    <div className="strat-layer">
      <AmbientBackground />
      <div className="strat-grid">
        {CARDS.map((c) => (
          <Card key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}

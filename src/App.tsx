import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bindWorld, sceneStore, rig, applyRig } from './animations/rig';
import { buildMaster } from './animations/timeline';
import { createMaster } from './animations/createMaster';
import { bindNavigation, unbindNavigation, goToScene } from './components/Navigation/navigation';
import { useKeyboardNav } from './components/Navigation/useKeyboardNav';
import { installQA } from './animations/qa';

import { buildDecision } from './animations/scenes/decision';
import { buildWrapper } from './animations/scenes/wrapper';
import { buildMigration } from './animations/scenes/migration';
import { buildStrategies } from './animations/scenes/strategies';
import { buildMetrics } from './animations/scenes/metrics';
import { buildClosing } from './animations/scenes/closing';

import { BootScene } from './scenes/BootScene/BootScene';
import { WrapperScene } from './scenes/WrapperScene/WrapperScene';
import { MigrationScene } from './scenes/MigrationScene/MigrationScene';
import { StrategiesScene } from './scenes/StrategiesScene/StrategiesScene';
import { MetricsScene } from './scenes/MetricsScene/MetricsScene';
import { ClosingScene } from './scenes/ClosingScene/ClosingScene';
import { Stage3D } from './three/Stage3D';

import { ProgressIndicator } from './components/ProgressIndicator';
import { DebugHUD } from './components/DebugHUD';

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  // Hook centralizado para navegación por teclado
  useKeyboardNav();

  useEffect(() => {
    // Exponer handles para debug y QA
    if (typeof window !== 'undefined') {
      (window as any).ScrollTrigger = ScrollTrigger;
      (window as any).__legado_sceneStore = sceneStore;
      (window as any).__legado_goToScene = goToScene;
      (window as any).__legado_rig = rig;
      (window as any).__legado_applyRig = applyRig;
    }

    // Instalación de utilidades de QA en window.__qa
    installQA();

    if (!stageRef.current || !worldRef.current) return;

    // Vincular elemento DOM #world al rig de cámara
    bindWorld(worldRef.current);

    // Contexto GSAP aislado para garantizar limpieza y evitar fugas
    const ctx = gsap.context(() => {
      const tl = buildMaster([
        buildDecision,
        buildWrapper,
        buildMigration,
        buildStrategies,
        buildMetrics,
        buildClosing,
      ]);

      const st = createMaster(stageRef.current!, tl);
      if (st) {
        bindNavigation(st, tl);
      }
    }, stageRef);

    return () => {
      unbindNavigation();
      bindWorld(null);
      ctx.revert();
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Indicador superior con los 7 segmentos */}
      <ProgressIndicator />

      {/* HUD de depuración activo con ?debug */}
      <DebugHUD />

      {/* Contenedor estático para aislar la manipulación de pin-spacer de GSAP */}
      <div id="pin-container" className="w-full">
        {/* Contenedor del ScrollTrigger maestro (stage que se pinea) */}
        <div
          id="stage"
          ref={stageRef}
          className="relative w-full h-screen overflow-hidden"
        >
          {/* Capa de mundo transformada por el rig de cámara */}
          <div
            id="world"
            ref={worldRef}
            className="absolute inset-0 w-full h-full origin-center z-20 pointer-events-none"
          >
            <BootScene />
            <WrapperScene />
            <MigrationScene />
            <StrategiesScene />
            <MetricsScene />
            <ClosingScene />
          </div>

          {/* Overlay de fondo carbón para la escena 04 de migración.
              opacity 0 = negro base; opacity 1 = #111318 carbón.
              z-0 queda detrás de todo el contenido (world y Canvas). */}
          <div
            id="migration-bg-overlay"
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: '#111318',
              opacity: 0,
            }}
          />

          {/* Capa 3D única compartida gobernada por rig y CameraSync */}
          <Stage3D />
        </div>
      </div>
    </div>
  );
}

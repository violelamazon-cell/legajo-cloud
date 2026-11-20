import React, { useSyncExternalStore } from 'react';
import { sceneStore } from '../../animations/rig';
import { goToScene } from '../Navigation/navigation';

const SCENE_NAMES = [
  '01 BOOT',
  '02 MATRIZ',
  '03 WRAPPER',
  '04 MIGRACIÓN',
  '05 ESTRATEGIAS',
  '06 MÉTRICAS',
  '07 CIERRE',
];

export const ProgressIndicator: React.FC = () => {
  const currentScene = useSyncExternalStore(sceneStore.subscribe, () => sceneStore.get().scene);
  const progress = useSyncExternalStore(sceneStore.subscribe, () => sceneStore.get().progress);

  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 select-none">
      <nav
        aria-label="Progreso de la presentación"
        className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#0c0d10]/85 border border-[#1b1d22] backdrop-blur-md shadow-2xl"
      >
        {SCENE_NAMES.map((name, index) => {
          const isActive = currentScene === index;
          return (
            <button
              key={name}
              type="button"
              onClick={() => goToScene(index)}
              title={`Ir a ${name}`}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 font-mono text-xs ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-[0_0_12px_rgba(34,230,216,0.3)] border border-[#22e6d8]/50'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-[#3dff8a] shadow-[0_0_6px_#3dff8a]'
                    : 'bg-zinc-600 group-hover:bg-zinc-400'
                }`}
              />
              <span className="text-[11px] font-medium tracking-wide">{name}</span>
            </button>
          );
        })}

        {/* Mini barra de progreso general */}
        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden mx-2 hidden sm:block">
          <div
            className="h-full bg-gradient-to-r from-[#3dff8a] via-[#22e6d8] to-[#a56bff] transition-all duration-100 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </nav>
    </header>
  );
};

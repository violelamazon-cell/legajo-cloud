import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneStore, rig } from '../animations/rig';

const SCENE_TITLES = [
  '01 Boot / Introducción',
  '02 Matriz de decisión',
  '03 Wrapper / Encapsulamiento',
  '04 Migración horizontal',
  '05 Estrategias de migración',
  '06 Métricas de éxito',
  '07 Cierre',
];

export const DebugHUD: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [triggersCount, setTriggersCount] = useState(0);
  const [isStressRunning, setIsStressRunning] = useState(false);
  const [stressResult, setStressResult] = useState<string | null>(null);

  const scene = useSyncExternalStore(sceneStore.subscribe, () => sceneStore.get().scene);
  const progress = useSyncExternalStore(sceneStore.subscribe, () => sceneStore.get().progress);
  const booted = useSyncExternalStore(sceneStore.subscribe, () => sceneStore.get().booted);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsVisible(params.has('debug'));
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setTriggersCount(ScrollTrigger.getAll().length);
    }, 500);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const handleRunStress = async () => {
    if (isStressRunning) return;
    setIsStressRunning(true);
    setStressResult('Ejecutando test de estrés (10s)...');
    try {
      const qa = (window as any).__qa;
      if (qa?.stress) {
        const res = await qa.stress(10000);
        setStressResult(`Éxito: ${res.steps} pasos. Triggers: ${res.triggersBefore} → ${res.triggersAfter}`);
      }
    } catch (err) {
      setStressResult(`Error: ${String(err)}`);
    } finally {
      setIsStressRunning(false);
    }
  };

  return (
    <aside
      aria-label="HUD de depuración"
      className="fixed bottom-4 left-4 z-50 p-4 rounded-lg bg-black/90 border border-zinc-700/80 font-mono text-xs text-zinc-300 shadow-2xl backdrop-blur max-w-sm select-none"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 font-bold text-[#22e6d8]">
        <span>DEBUG HUD (?debug)</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">STAGE 1</span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div>
          <span className="text-zinc-500">Escena activa:</span>{' '}
          <strong className="text-white">[{scene + 1}/7]</strong> {SCENE_TITLES[scene] ?? ''}
        </div>
        <div>
          <span className="text-zinc-500">Progreso general:</span>{' '}
          <strong className="text-[#3dff8a]">{(progress * 100).toFixed(1)}%</strong>
        </div>
        <div>
          <span className="text-zinc-500">ScrollTriggers activos:</span>{' '}
          <strong className={triggersCount === 1 ? 'text-[#3dff8a]' : 'text-amber-400'}>
            {triggersCount}
          </strong>
        </div>
        <div>
          <span className="text-zinc-500">Rig cámara:</span>{' '}
          <span className="text-zinc-400">
            tx: {rig.tx.toFixed(0)}px | s: {rig.s.toFixed(2)} | era: {rig.era.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-zinc-500">Navegación:</span>{' '}
          <span className={booted ? 'text-[#3dff8a]' : 'text-amber-400'}>
            {booted ? 'Habilitada (booted)' : 'Bloqueada'}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-zinc-800">
        <button
          type="button"
          onClick={handleRunStress}
          disabled={isStressRunning}
          className="w-full py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium border border-zinc-600 disabled:opacity-50 transition-colors"
        >
          {isStressRunning ? 'Ejecutando test (10s)...' : 'Test de estrés QA (10s)'}
        </button>
        {stressResult && (
          <div className="mt-2 text-[10px] text-zinc-400 p-1.5 bg-zinc-900 rounded border border-zinc-800">
            {stressResult}
          </div>
        )}
      </div>
    </aside>
  );
};

import { CheckCircle2, SquareCheck, CalendarDays, Database, Timer } from 'lucide-react';
import { METRICS as M } from '../../config/metrics.data';
import '../../styles/metrics.css';

export function MetricsLayer() {
  return (
    <div className='met-layer'>
      <div className='met-grid'>
        <section className='met-card met-1'><div className='met-body'>
          <span className='met-n'>[01]</span>
          <h4>INTEGRIDAD<br />DE DATOS</h4>
          <div className='met-big'><b className='met-int-pct'>0%</b><CheckCircle2 className='met-ico' /></div>
          <div className='met-track'><i className='met-fill met-fill-int' /></div>
          <span className='met-cap'>{M.integridad.label}</span>
        </div></section>

        <section className='met-card met-2'><div className='met-body'>
          <span className='met-n'>[02]</span>
          <h4>PARIDAD<br />FUNCIONAL</h4>
          {M.paridad.checks.map((c) => (
            <div className='met-row' key={c}><SquareCheck /><span>{c}</span></div>
          ))}
          <div className='met-track'><i className='met-fill met-fill-par' /></div>
        </div></section>

        <section className='met-card met-3'><div className='met-body'>
          <span className='met-n'>[03]</span>
          <h4>RENDIMIENTO</h4>
          <svg className='met-chart' viewBox='0 0 160 60'>
            <path className='met-curve met-curve-old' d='M0 46 C 25 36, 50 44, 80 38 S 130 30, 160 28' pathLength={1} />
            <path className='met-curve met-curve-new' d='M0 50 C 25 22, 50 52, 80 26 S 130 8, 160 6' pathLength={1} />
          </svg>
          <span className='met-cap'>Latencia y throughput · nuevo vs legado</span>
        </div></section>

        <section className='met-card met-4'><div className='met-body'>
          <span className='met-n'>[04]</span>
          <h4>DESVIACIÓN CRONOGRAMA<br />Y PRESUPUESTO</h4>
          <div className='met-row'><CalendarDays /><div className='met-track'><i className='met-fill met-fill-sched' /></div><em>{M.desviacion.cronograma.label}</em></div>
          <div className='met-row'><Database /><div className='met-track'><i className='met-fill met-fill-budget' /></div><em>{M.desviacion.presupuesto.label}</em></div>
        </div></section>

        <section className='met-card met-5'><div className='met-body'>
          <span className='met-n'>[05]</span>
          <h4>ADOPCIÓN Y PRODUCTIVIDAD</h4>
          <div className='met-row'><Timer /><div className='met-track'><i className='met-fill met-fill-before' /></div><em>{M.adopcion.antes.min} min</em></div>
          <div className='met-row'><span style={{ width: '1.6cqw' }} /><div className='met-track'><i className='met-fill met-fill-after' /></div><em>{M.adopcion.despues.min} min</em></div>
        </div></section>
      </div>
      <p className='met-note'>{M.nota}</p>
    </div>
  );
}

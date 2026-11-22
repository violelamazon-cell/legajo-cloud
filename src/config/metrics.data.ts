export const METRICS = {
  integridad: { pct: 100, label: 'verificado' },
  paridad: { pct: 0.8, checks: ['Reglas de negocio', 'Flujos críticos', 'Reportes'] },
  desviacion: { cronograma: { label: '±0%', fill: 0.88 }, presupuesto: { label: '+2%', fill: 0.7 } },
  adopcion: { antes: { min: 24, fill: 0.88 }, despues: { min: 8, fill: 0.33 } },
  nota: 'Datos ilustrativos de ejemplo académico',
} as const;

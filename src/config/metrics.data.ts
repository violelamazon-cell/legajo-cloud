/**
 * Datos ilustrativos de ejemplo académico para la escena de métricas (placeholder).
 */
export interface MetricItem {
  id: string;
  title: string;
  value: number;
  suffix?: string;
  description?: string;
}

export const METRICS_DATA: MetricItem[] = [];

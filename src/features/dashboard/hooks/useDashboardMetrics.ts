import type { DashboardMetric } from '../types'

const MOCK_METRICS: DashboardMetric[] = [
  { id: '1', label: 'Usuarios activos', value: 1284 },
  { id: '2', label: 'Sesiones hoy', value: 342 },
  { id: '3', label: 'Tasa de conversion', value: 12 },
]

export function useDashboardMetrics() {
  return {
    metrics: MOCK_METRICS,
    isLoading: false,
  }
}

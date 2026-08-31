import { Card } from '@/components/ui'
import type { DashboardMetric } from '../types'

interface MetricCardProps {
  metric: DashboardMetric
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card title={metric.label}>
      <p className="text-3xl font-bold text-text">{metric.value.toLocaleString()}</p>
    </Card>
  )
}

import { Button, Card } from '@/components/ui'
import { MetricCard, useDashboardMetrics } from '@/features/dashboard'

export function HomePage() {
  const { metrics } = useDashboardMetrics()

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted">
          Front limpio con componentes reutilizables y arquitectura por features.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <Card title="Componentes base" description="Ejemplo de uso de Button e Input">
        <div className="flex flex-wrap gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </Card>
    </div>
  )
}

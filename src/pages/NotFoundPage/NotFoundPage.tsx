import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-text">404</h1>
      <p className="text-text-muted">La pagina que buscas no existe.</p>
      <Link to={ROUTES.HOME}>
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  )
}

/** Un error de render no deja la pantalla en blanco · 2026-11-09
 *
 *  **Sin esto, React 19 desmonta el árbol entero** ante un error que nadie
 *  atrapa: queda la página vacía, sin un mensaje y sin salida. Es el mismo
 *  modo de falla que el `index.html` cacheado, y se ve igual.
 *
 *  **El reporte no sale de acá, sale de la raíz** · `onCaughtError` en
 *  `main.tsx`. React lo llama con todo lo que una frontera atrapa, así que
 *  reportar también acá lo mandaría dos veces.
 */
import { Component } from 'react'
import type { ReactNode } from 'react'
import { SurfaceMessage } from '../surfaces/console/SurfaceMessage'

type Props = { children: ReactNode }
type State = { fallo: boolean }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { fallo: false }

  static getDerivedStateFromError(): State {
    return { fallo: true }
  }

  override render() {
    if (this.state.fallo) {
      return (
        <SurfaceMessage
          title="Algo falló en esta pantalla"
          detail="Quedó registrado. Recargá la página para seguir."
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}

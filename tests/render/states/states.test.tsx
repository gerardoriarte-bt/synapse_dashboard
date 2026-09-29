// @vitest-environment jsdom

/** Los estados · F1.13d.
 *
 *  §8: qué pasa, por qué, y qué se puede hacer. **Un estado sin salida es una
 *  queja**, así que lo que se verifica no es que el botón exista sino que
 *  DISPARE — un CTA que no llama a nada se ve igual que uno que funciona.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BlockedState } from '@/render/states/BlockedState'
import { EmptyState } from '@/render/states/EmptyState'
import { ErrorState } from '@/render/states/ErrorState'
import { ForbiddenState } from '@/render/states/ForbiddenState'
import { LoadingState } from '@/render/states/LoadingState'

describe('la salida de cada estado dispara de verdad', () => {
  it('ErrorState llama a onRetry', async () => {
    // Se escribió mal una vez —`onRetry` donde `Exit` espera `onClick`— y el
    // spread de JSX lo dejó pasar sin que el compilador lo viera: el botón se
    // pintaba y no hacía nada.
    const onRetry = vi.fn()
    render(<ErrorState message="Falló" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /reintentar este panel/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('BlockedState llama a onUnblock', async () => {
    const onUnblock = vi.fn()
    render(
      <BlockedState reason="Feed vencido" unblockedBy="Corrida del ETL" onUnblock={onUnblock} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /resolver/i }))
    expect(onUnblock).toHaveBeenCalledTimes(1)
  })

  it('ForbiddenState llama a onRequest', async () => {
    const onRequest = vi.fn()
    render(<ForbiddenState requestTo="Dirección comercial" onRequest={onRequest} />)
    await userEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))
    expect(onRequest).toHaveBeenCalledTimes(1)
  })

  it('SIN manejador no se pinta el botón · un CTA muerto promete lo que no hay', () => {
    // Misma regla que `RecoBody` con `puedeResponder`: «un botón que se aprieta
    // y devuelve 403 es peor que un botón ausente». El estado NO se queda sin
    // salida: el `detail` sigue diciendo qué hacer.
    render(<ErrorState message="Falló" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/El resto de los paneles cargó normalmente/)).toBeInTheDocument()
  })

  it('lo mismo en bloqueado y sin permiso · los dos estaban muertos hasta hoy', () => {
    // `PanelInGrid` no reenviaba `onUnblock` ni `onRequestAccess`, así que en
    // producción «Resolver» y «Solicitar acceso» se pintaban y no hacían nada.
    const { unmount } = render(<BlockedState reason="Feed vencido" unblockedBy="ETL" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/Qué lo desbloquea · ETL/)).toBeInTheDocument()
    unmount()

    render(<ForbiddenState requestTo="Dirección comercial" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/Quién lo decide · Dirección comercial/)).toBeInTheDocument()
  })
})

describe('cada estado dice qué pasa y por qué · §8', () => {
  it('el bloqueado declara que NO hay valor aproximado', () => {
    // La ausencia de cifra ES la información, no una carencia de la pantalla.
    render(<BlockedState reason="Feed vencido" unblockedBy="Corrida del ETL" />)
    expect(screen.getByText(/sin valor aproximado/i)).toBeInTheDocument()
    expect(screen.getByText(/Corrida del ETL/)).toBeInTheDocument()
  })

  it('el error dice que el resto cargó bien · el reintento es por panel', () => {
    render(<ErrorState message="Falló al resolver" />)
    expect(screen.getByText(/El resto de los paneles cargó normalmente/)).toBeInTheDocument()
  })

  it('el vacío es una invitación, no un error', () => {
    render(<EmptyState phrase="No hay datos en este período." detail="Ventana · 30 días" />)
    expect(screen.getByText('No hay datos en este período.')).toBeInTheDocument()
    // «Sin datos» va al árbol de accesibilidad: la marca es un icono aria-hidden.
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })
})

describe('LoadingState · esqueleto, nunca spinner', () => {
  it('se anuncia como ocupado y no dibuja un spinner', () => {
    // Los paneles cargan en paralelo: un spinner por panel sería una pantalla
    // de ruletas girando a destiempo.
    const { container } = render(<LoadingState />)
    expect(screen.getByLabelText('Cargando')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('`SIN_PERMISO` pinta el copy DEL SERVICIO · 2026-09-29', () => {
  it('muestra la razón y el desbloqueo que manda el servicio, no los nuestros', () => {
    // **Esta prueba existe porque una mutación SOBREVIVIÓ.** Se cableó el copy
    // del servicio de punta a punta —contrato, adaptador, `Panel`, estado— y al
    // revertir el estado a su frase fija **las 53 pruebas seguían pasando**: la
    // del adaptador verifica que el campo VIAJE, y ninguna que se PINTE.
    //
    // Es el mismo modo de falla que la cadena de `chart`: un campo que llega y
    // que nadie dibuja no rompe nada y la pantalla se ve bien.
    render(
      <ForbiddenState
        requestTo="admin"
        reason="Tu rol no tiene acceso a esta métrica"
        unlocksWith="Pedile al administrador del tenant que la habilite para tu rol"
      />,
    )

    expect(screen.getByText('Tu rol no tiene acceso a esta métrica')).toBeVisible()
    expect(
      screen.getByText('Pedile al administrador del tenant que la habilite para tu rol'),
    ).toBeVisible()
    // Y la nuestra NO se pinta cuando la del servicio está.
    expect(screen.queryByText(/no está disponible para tu rol/)).toBeNull()
  })

  it('sin razón del servicio cae a la nuestra · un panel mudo es peor', () => {
    render(<ForbiddenState requestTo="admin" />)
    expect(screen.getByText(/no está disponible para tu rol/)).toBeVisible()
    expect(screen.getByText(/Quién lo decide · admin/)).toBeVisible()
  })
})

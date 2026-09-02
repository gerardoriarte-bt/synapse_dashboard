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

  it('sin callback el botón sigue ahí y no revienta al hacer clic', async () => {
    // La superficie decide si engancha algo. Un CTA muerto es un problema; un
    // CTA que revienta es peor.
    render(<ErrorState message="Falló" />)
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(screen.getByText('Falló')).toBeInTheDocument()
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

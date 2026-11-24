// @vitest-environment jsdom

/** `ask` pregunta con el contexto VIGENTE, no con el del primer render · 2026-11-24
 *
 *  `oxlint` marcaba `exhaustive-deps` en el `useCallback` de `ask`: lee
 *  `contexto` y no lo declaraba, y declaraba `clave`, que no lee. Era a
 *  propósito —el llamador pasa un literal, y `[contexto]` recrearía `ask` en
 *  cada render—, y `clave` cubría todos los campos del contexto, así que no
 *  había un contexto viejo en vuelo. Pero la garantía dependía de que alguien
 *  mantuviera `clave` al día con `ContextoDeChat`: un campo nuevo que no
 *  entrara en la clave viajaría viejo sin que nada avisara.
 *
 *  **Lo que se afirma es el cuerpo que sale por la red**, igual que
 *  `agenteDelAdmin.test.tsx`: cambiar de período o de pestaña entre dos
 *  preguntas tiene que cambiar el `period` y el `tab_id` que viajan.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useChat } from '@/api/useChat'
import type { ContextoDeChat } from '@/api/useChat'
import { API } from '../mocks/handlers'
import { server } from '../mocks/server'

function trama(evento: string, datos: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`
}

function escuchar() {
  const cuerpos: Record<string, unknown>[] = []
  server.use(
    http.post(`${API}/config/chat`, async ({ request }) => {
      cuerpos.push((await request.json()) as Record<string, unknown>)
      return new HttpResponse(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()
            controller.enqueue(encoder.encode(trama('delta', { text: 'Listo.' })))
            controller.enqueue(encoder.encode(trama('done', {})))
            controller.close()
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
      )
    }),
  )
  return cuerpos
}

function montar(inicial: ContextoDeChat) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(({ contexto }: { contexto: ContextoDeChat }) => useChat(contexto), {
    initialProps: { contexto: inicial },
    wrapper,
  })
}

describe('el contexto que viaja es el vigente', () => {
  it('cambiar de período entre dos preguntas cambia el `period` que se manda', async () => {
    const cuerpos = escuchar()
    const { result, rerender } = montar({ tabId: 'tab-1', periodo: '2026-10' })

    await act(() => result.current.ask('¿Cómo vamos?'))
    // El llamador pasa un literal nuevo en cada render, como `ChatSheet`.
    rerender({ contexto: { tabId: 'tab-1', periodo: '2026-11' } })
    await act(() => result.current.ask('¿Y ahora?'))

    expect(cuerpos.map((c) => c['tab_context'])).toEqual([
      { tab_id: 'tab-1', period: '2026-10' },
      { tab_id: 'tab-1', period: '2026-11' },
    ])
  })

  it('cambiar de pestaña a panel cambia de rama del cable', async () => {
    const cuerpos = escuchar()
    const { result, rerender } = montar({ tabId: 'tab-1', periodo: '2026-11' })

    rerender({ contexto: { panelId: 'p-7', periodo: '2026-11' } })
    await act(() => result.current.ask('¿Por qué bajó?'))

    expect(cuerpos).toHaveLength(1)
    expect(cuerpos[0]?.['panel_context']).toEqual({ panel_id: 'p-7', period: '2026-11' })
    expect(cuerpos[0]).not.toHaveProperty('tab_context')
  })
})

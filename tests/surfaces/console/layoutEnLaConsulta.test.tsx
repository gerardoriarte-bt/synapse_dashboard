// @vitest-environment jsdom

/** La consola pide la pestaña ACOTADA a su layout · F5.1 · 2026-09-29
 *
 *  ── EL DEFECTO, MEDIDO CONTRA EL SERVICIO ───────────────────────────────────
 *
 *  Se publicó una pestaña en el dashboard «Marca», se cambió a él y la consola
 *  quedó **con encabezado y cero paneles**: `/config/me` devolvía la pestaña, la
 *  superficie pintaba su pregunta operativa, y `GET /config/tabs/{ese mismo id}`
 *  contestaba **404 «pestaña no encontrada»**.
 *
 *  **No era del backend.** Su handler —`dd_config_handler.go`, leído en
 *  `de881e1`— acepta `?layoutId=` y `?dashboardId=`, y sin ninguno de los dos
 *  resuelve contra el layout del dashboard **por defecto**. Una pestaña que vive
 *  en otro dashboard no existe para esa consulta. `ConsoleContainer` llamaba
 *  `useTab(activeTab?.id)` sin el parámetro desde siempre.
 *
 *  ── POR QUÉ NADA LO ENCONTRÓ ANTES ──────────────────────────────────────────
 *
 *  **Andaba de casualidad.** Mientras hubo un solo dashboard, el activo y el de
 *  por defecto eran el mismo y la caída del backend acertaba. Es el modo de
 *  falla que este repositorio persigue: correcto por coincidencia, y el día que
 *  deja de serlo **no falla el código que está mal**.
 *
 *  Y MSW no podía verlo por la misma razón que no vio la `Authorization` del
 *  chat: sus handlers coinciden con la ruta **sin mirar el query string**, así
 *  que responden igual con parámetro y sin él. Por eso esta prueba no afirma lo
 *  que se dibuja —eso pasaba ya— sino **lo que se pidió**.
 *
 *  ── LA ASERCIÓN ES LA URL, Y NO HAY OTRA FORMA ──────────────────────────────
 *
 *  El handler captura la petición y guarda su `layoutId`. Un mock que devolviera
 *  el panel igual demuestra que el panel se dibuja, no que la consulta esté
 *  acotada — y acotarla es todo lo que este arreglo hace.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, ok, tab } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireMetric, WirePanel } from '@/api/adapt'

const metrica: WireMetric = {
  id: 'm-1',
  tenant_id: 't-1',
  key: 'ventas',
  name: 'Ventas',
  shape: 'scalar',
  family: 'demand',
  layer: 'GOLD',
  source: 'Snowflake',
  base: '48 tiendas sobre 52',
  unit: 'USD',
  min_grain: 'month',
  measurement_window: 'Mes calendario seleccionado',
  dimensions: [],
  catalog_version: 1,
}

const panel: WirePanel = {
  id: 'p-1',
  metric_id: 'm-1',
  type: 'kpi',
  col_start: 1,
  col_span: 3,
  row_span: 4,
  chart: '',
  note: '',
}

const VALOR = {
  status: 'AVAILABLE',
  value: { shape: 'scalar', v: 42 },
  governance: {
    base: '48 tiendas sobre 52',
    layer: 'GOLD',
    source: 'Snowflake',
    freshness: '2026-09-02T08:00:00Z',
    catalog_version: 1,
    measurement_window: 'Mes calendario seleccionado',
  },
}

/** Monta la consola y devuelve lo que la petición de la pestaña llevó en la
 *  URL. `null` mientras no llegó; `undefined` si llegó sin el parámetro. */
function montar() {
  const visto: { layoutId?: string | null } = {}
  server.use(
    http.get(`${API}/config/catalog`, () => ok([metrica])),
    http.get(`${API}/config/tabs/:tabId`, ({ request }) => {
      visto.layoutId = new URL(request.url).searchParams.get('layoutId')
      return ok({ tab, panels: [panel] })
    }),
    http.post(`${API}/config/panels:batch`, () => ok({ [panel.id]: VALOR })),
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return visto
}

describe('la pestaña se pide acotada al layout activo · F5.1', () => {
  it('la consulta lleva el `layoutId` que declaró `/config/me`', async () => {
    const visto = montar()

    // Se espera al dibujo y no a la petición: si se afirmara sobre `visto` antes
    // de que la consola pida, la prueba pasaría por carrera y no por el código.
    expect(await screen.findByText('Ventas')).toBeVisible()

    // `l-1` es el `active_layout_id` del contexto compartido de `handlers.ts`,
    // leído de ahí y no inventado acá.
    expect(visto.layoutId).toBe('l-1')
  })

  it('**y no viaja vacío**, que daría 400 en vez de la caída de antes', async () => {
    // El cliente omite el parámetro cuando es `undefined`; una cadena vacía
    // viajaría como `?layoutId=` y el handler contesta «layoutId inválido».
    const visto = montar()
    await screen.findByText('Ventas')

    expect(visto.layoutId).not.toBe('')
  })
})

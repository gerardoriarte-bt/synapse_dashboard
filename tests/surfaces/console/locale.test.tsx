// @vitest-environment jsdom

/** F1.13b · el locale sale del TENANT, no de una constante ni del navegador
 *
 *  Hasta el 2026-09-26 `ConsoleContainer` tenía `createFormat('es-MX')` como
 *  constante de módulo, con su supuesto declarado. El contrato no tenía dónde
 *  poner el campo; desde hoy lo declara y `/config/me` lo trae.
 *
 *  ── POR QUÉ ESTO NO SE PRUEBA CON EL FIXTURE COMPARTIDO ────────────────────
 *
 *  Porque ahí el locale es `es-MX` y **el default del front también es
 *  `es-MX`**: una prueba que use el fixture pasaría igual con el campo
 *  desconectado. Es la forma exacta de «una prueba escrita desde la
 *  implementación no puede fallar nunca».
 *
 *  Así que acá el tenant declara `es-CO` —que es, además, lo que el servicio
 *  devuelve hoy de verdad, medido contra `8633b10`— y se afirma la diferencia
 *  que ese locale produce: coma decimal y punto de miles.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, context, kpiMetric, kpiPanel, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireContext, WirePayload } from '@/api/adapt'

const governance = {
  base: '48 tiendas sobre 52',
  layer: 'GOLD',
  source: 'Snowflake',
  freshness: '2026-09-02T08:00:00Z',
  catalog_version: 1,
  measurement_window: '',
}

/** Una cifra que se ve DISTINTA en los dos locales, que es lo único que sirve
 *  para probar esto: `4280000` da `USD 4.28M` en `es-MX` y `USD 4,28M` en
 *  `es-CO`. Con un entero redondo las dos salidas coincidirían. */
const payload: WirePayload = {
  status: 'AVAILABLE',
  value: { shape: 'scalar', v: 4280000 },
  governance,
} as WirePayload

function conLocale(locale: string) {
  const ctx: WireContext = { ...context, tenant: { ...context.tenant, locale } }
  server.use(
    http.get(`${API}/config/me`, () => ok(ctx)),
    http.get(`${API}/config/catalog`, () => ok([kpiMetric])),
    http.get(`${API}/config/tabs/:tabId`, () => ok({ tab: context.tabs[0], panels: [kpiPanel] })),
    http.post(`${API}/config/panels:batch`, () => ok({ [kpiPanel.id]: payload })),
  )
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsoleContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('F1.13b · la cifra se formatea con el locale del tenant', () => {
  it('con `es-CO` la cifra lleva COMA decimal', async () => {
    // Es el valor que el servicio devuelve hoy para «Under Armour México» —el
    // default de la migración, dato a cargar con `PUT /admin/tenants/{id}`— y
    // acá sirve porque es distinto del default del front.
    conLocale('es-CO')
    montar()

    expect(await screen.findByText('USD 4,28M')).toBeVisible()
  })

  it('con `es-MX` lleva PUNTO · la misma cifra, otro tenant', async () => {
    conLocale('es-MX')
    montar()

    expect(await screen.findByText('USD 4.28M')).toBeVisible()
  })

  it('un tenant SIN locale cargado no rompe · cae al default', async () => {
    // El campo es `string` sin `omitempty` del lado del servicio, así que un
    // tenant sin cargar manda cadena vacía. **`Intl` con `''` TIRA**, y sin el
    // default la consola quedaría en blanco sin decir por qué.
    conLocale('')
    montar()

    expect(await screen.findByText('USD 4.28M')).toBeVisible()
  })
})

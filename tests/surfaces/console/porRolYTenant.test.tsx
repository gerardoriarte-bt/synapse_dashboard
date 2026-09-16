// @vitest-environment jsdom

/** «Cambiar tenant/rol recomponen dashboard sin deploy» · §17, casilla 7 · F5.10
 *
 *  ── POR QUÉ ESTABA 🔒 Y POR QUÉ YA NO ───────────────────────────────────────
 *
 *  La auditoría del 2026-09-04 la dejó bloqueada con la razón escrita: «necesita
 *  el contrato de admin y builder, que no existe». Existe desde F4.22
 *  —`contracts/synapse-admin-wire.yaml`— y la vista previa por rol está
 *  construida en F4.12. La razón venció; la casilla no.
 *
 *  ── QUÉ AFIRMA ESTA CASILLA, QUE NO ES LO MISMO QUE LA PRIMERA ──────────────
 *
 *  La casilla 1 —«layout viene de `GET /config/tabs`, no de código»— dice que la
 *  composición llega del servidor. Ésta dice algo más fuerte y sobre otro eje:
 *  que **el tenant y el rol son los que la mueven**, y que moverla no toca el
 *  front. Un front que pintara el layout que llega y además tuviera escrito en
 *  algún lado «si el rol es CEO, esta pestaña no» cumpliría la primera y fallaría
 *  ésta — y la diferencia solo se ve cambiando el rol, que es lo que acá se hace.
 *
 *  Por eso se monta **el mismo componente dos veces** contra dos contextos
 *  distintos, y se compara lo que dibuja. No hay build en el medio: si algo de la
 *  composición estuviera escrito en el front, las dos corridas coincidirían en
 *  ese algo.
 *
 *  ── Y EL FRONT NO REIMPLEMENTA EL FILTRO ───────────────────────────────────
 *
 *  `tab_ids`, `hidden_metric_ids` y `layout_overrides` los aplica el servidor,
 *  una sola vez, en `GetTab`. La tercera prueba lo fija por el lado que duele:
 *  si el front filtrara por su cuenta, un layout que referencia una métrica que
 *  este rol no ve se pintaría distinto. No se pinta distinto — se dice que no se
 *  resuelve, que es lo que `RolePreview` explica que no hay que simular.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ConsoleContainer } from '@/surfaces/console/ConsoleContainer'
import { API, kpiMetric, kpiPanel, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { WireContext, WireMetric, WirePanel } from '@/api/adapt'

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ConsoleContainer />
    </QueryClientProvider>,
  )
}

/** Un contexto entero, del cable. Lo que cambia entre corridas es el tenant, el
 *  rol y sus pestañas — que es exactamente lo que la casilla pone a prueba. */
const contextoDe = (
  tenant: string,
  rol: string,
  tab: { id: string; name: string; pregunta: string },
): WireContext => ({
  user: { id: 'u-1', email: 'prueba@uamx.test', first_name: 'Prueba', last_name: 'Uno' },
  tenant: { id: `t-${tenant}`, name: tenant },
  role: { id: `r-${rol}`, name: rol },
  tabs: [{ id: tab.id, name: tab.name, operational_question: tab.pregunta, sort_order: 1 }],
  periods: ['2026-07'],
  catalog_version: 1,
})

/** Sirve UN contexto con SU composición. Los tres endpoints a la vez, porque el
 *  rol los mueve a los tres: el catálogo llega filtrado, y el layout también. */
function servir(
  contexto: WireContext,
  metricas: WireMetric[],
  panels: WirePanel[],
  payloads: Record<string, unknown>,
) {
  server.use(
    http.get(`${API}/config/me`, () => ok(contexto)),
    http.get(`${API}/config/catalog`, () => ok(metricas)),
    http.get(`${API}/config/tabs/:tabId`, () =>
      ok({ tab: contexto.tabs[0], panels }),
    ),
    http.post(`${API}/config/panels:batch`, () => ok(payloads)),
  )
}

const escalar = (v: number) => ({
  status: 'AVAILABLE',
  value: { shape: 'scalar', v },
  governance: {
    base: '48 tiendas sobre 52',
    layer: 'GOLD',
    source: 'Snowflake',
    freshness: '2026-09-02T08:00:00Z',
    catalog_version: 1,
  },
})

describe('cambiar tenant/rol recompone el dashboard · §17 casilla 7', () => {
  it('el mismo código dibuja dos dashboards distintos para dos contextos distintos', async () => {
    // ── Corrida 1 · Under Armour México, rol Planner ──────────────────────────
    servir(
      contextoDe('Under Armour México', 'Planner', {
        id: 'tab-inv',
        name: 'Inventory & Shopping',
        pregunta: '¿Tenemos stock y lo estamos mostrando?',
      }),
      [kpiMetric],
      [kpiPanel],
      { [kpiPanel.id]: escalar(4280000) },
    )

    const primera = montar()
    expect(await screen.findByText('¿Tenemos stock y lo estamos mostrando?')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('Venta diaria')
    expect(await screen.findByText('USD 4.28M')).toBeInTheDocument()
    primera.unmount()

    // ── Corrida 2 · otro tenant, otro rol, otra composición ───────────────────
    //
    // **Ni una línea del front cambió entre las dos.** Otra pestaña, otra
    // pregunta operativa, otra métrica, otro tipo de panel y otra cifra.
    const prosa: WireMetric = {
      ...kpiMetric,
      id: 'm-prosa',
      tenant_id: 't-Otro Retail',
      key: 'resumen',
      name: 'Resumen ejecutivo',
      shape: 'prose',
    }
    const panelProsa: WirePanel = {
      id: 'p-2',
      metric_id: 'm-prosa',
      type: 'prose',
      col_start: 1,
      col_span: 8,
      row_span: 4,
    }

    servir(
      contextoDe('Otro Retail', 'CEO', {
        id: 'tab-dir',
        name: 'Dirección',
        pregunta: '¿Qué movió el negocio esta semana?',
      }),
      [prosa],
      [panelProsa],
      {
        [panelProsa.id]: {
          status: 'AVAILABLE',
          // Del cable · `headline` y `pillars[].value`, no `titular` ni `valor`:
          // esos son los nombres del CONTRATO y los pone el adaptador. Escribirlo
          // de memoria salió mal en el primer intento y lo corrigió el yaml.
          value: {
            shape: 'prose',
            headline: 'La venta creció por medios pagos.',
            pillars: [{ label: 'Medios', value: 'USD 1.1M' }],
          },
          governance: {
            base: '48 tiendas sobre 52',
            layer: 'GOLD',
            source: 'Snowflake',
            freshness: '2026-09-02T08:00:00Z',
            catalog_version: 1,
          },
        },
      },
    )

    montar()
    expect(await screen.findByText('¿Qué movió el negocio esta semana?')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('Resumen ejecutivo')
    expect(await screen.findByText('La venta creció por medios pagos.')).toBeInTheDocument()

    // Y lo de la primera corrida NO quedó pegado en ningún lado.
    expect(screen.queryByText('¿Tenemos stock y lo estamos mostrando?')).not.toBeInTheDocument()
    expect(screen.queryByText('USD 4.28M')).not.toBeInTheDocument()
  })

  it('el MISMO tenant con otro rol ve otra composición · el rol solo la mueve', async () => {
    // El eje del rol aislado: mismo tenant, misma pestaña, y el servidor sirve
    // menos paneles porque `hidden_metric_ids` ya se aplicó. El front dibuja lo
    // que llega — dos paneles o uno — sin saber por qué son dos o uno.
    const tab = { id: 'tab-1', name: 'Resumen', pregunta: '¿Qué movió el negocio?' }
    const segundo: WirePanel = { ...kpiPanel, id: 'p-2', col_start: 5 }

    servir(
      contextoDe('Under Armour México', 'CEO', tab),
      [kpiMetric],
      [kpiPanel, segundo],
      { [kpiPanel.id]: escalar(4280000), [segundo.id]: escalar(120000) },
    )

    const conDos = montar()
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2))
    conDos.unmount()

    servir(
      contextoDe('Under Armour México', 'Planner', tab),
      [kpiMetric],
      [kpiPanel],
      { [kpiPanel.id]: escalar(4280000) },
    )

    montar()
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1))
  })

  it('el front NO reimplementa el filtro por rol · lo dice, no lo simula', async () => {
    // Un layout que referencia una métrica que este rol no ve. El servidor ya
    // filtró el catálogo; el panel sigue en el layout.
    //
    // **Lo que NO puede pasar es que el front lo esconda.** Esconderlo sería
    // reimplementar el filtro del servidor, y un filtro reimplementado termina
    // mostrando algo distinto de lo que muestra la consola — que es la razón por
    // la que `RolePreview` tampoco simula.
    servir(
      contextoDe('Under Armour México', 'Planner', {
        id: 'tab-1',
        name: 'Resumen',
        pregunta: '¿Qué movió el negocio?',
      }),
      [],
      [kpiPanel],
      {},
    )

    montar()
    expect(await screen.findByText(/Métrica no resuelta/)).toBeInTheDocument()
  })
})

// @vitest-environment jsdom
//
// Por lo mismo que `admin.test.tsx`: la base del cliente cae a `/api/v1`, que es
// RELATIVO, y en node `fetch` de una URL relativa tira `Failed to parse URL`.
// Las pruebas del adaptador puro no lo necesitan; las tres de abajo, que pasan
// por `pedir` y por MSW, sí.

/** El adaptador del historial de publicaciones · B6 · §PEN:B6
 *
 *  **LOS DOS FIXTURES SON CAPTURAS, NO MEMORIA.** Están copiados de la medición
 *  del 2026-09-30 contra `:4010` —dashboard «Marca», login `dev@synapse.local`—
 *  y no reescritos. La trampa concreta de esta pantalla es escribir `tabs_added`
 *  como objetos: son **cadenas**, y cada cadena es el NOMBRE de la pestaña
 *  normalizado (`tabKey` = minúsculas y sin espacios al borde), no su `key` ni su
 *  id. El plan decía «la `key`», escrito de una lectura y no de la fuente.
 *
 *  ── POR QUÉ ESTE ARCHIVO EXISTE APARTE ─────────────────────────────────────
 *
 *  Tres veces en septiembre la mutación encontró que **ninguna prueba tocaba el
 *  adaptador**: las pruebas de pantalla construyen el tipo a mano, así que la
 *  frontera queda sin cubrir, y ahí vive siempre la misma distinción —`null` es
 *  «nunca» y `[]` es «vacío»—. Con una pantalla nueva, la prueba del adaptador va
 *  de entrada.
 */
import { describe, expect, it, onTestFinished } from 'vitest'
import { adaptarDetalle, adaptarPublicacion } from '@/api/admin'
import type { WireLayoutPublication } from '@/api/admin'

/** FIXTURE A · la fila con las colecciones vacías en `[]`.
 *
 *  `v-1790712673`, publicada el 2026-09-29 sobre el dashboard «Marca». Escrita
 *  DESPUÉS de `de881e13`, que es el commit que inicializa las ocho listas. */
const filaConListasVacias = {
  id: '471de362-456d-4958-a9b6-177aa4af24b7',
  tenant_id: 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111',
  dashboard_id: 'd0187f9f-1e5b-4738-a538-826db2f61148',
  layout_id: '16009187-188f-4011-8b34-01e5a6a38fef',
  version_id: 'v-1790712673',
  action: 'publish',
  actor_user_id: '33333333-3333-4333-8333-333333333333',
  actor_role: 'admin',
  previous_layout_id: '605596a0-982e-485b-9368-2c1c5ebb4170',
  diff: {
    summary: { tabs_added: 1, panels_added: 7, tabs_removed: 1, panels_changed: 0, panels_removed: 1 },
    tabs_added: ['repertorio con dato real'],
    panels_added: [
      { tab: 'repertorio con dato real', type: 'bars', metric_id: '3a0bc582-14ba-5499-8e27-4ac5ed409b03' },
      { tab: 'repertorio con dato real', type: 'gauge', metric_id: '8bf488be-7534-57ea-afa6-ddccef08873c' },
    ],
    panels_moved: [],
    tabs_removed: ['marca'],
    panels_removed: [{ tab: 'marca', type: 'kpi', metric_id: '0ec90430-794c-5626-9863-a88b610515bd' }],
    panels_retyped: [],
    tabs_reordered: [],
    panels_options_changed: [],
  },
  created_at: '2026-09-29T15:11:13.664957-05:00',
} satisfies WireLayoutPublication

/** FIXTURE B · la fila `rollback` con tres colecciones en `null` y **las tres
 *  formas de cambio a la vez**.
 *
 *  `rollback-v-1790630106`, del 2026-09-28. Escrita ANTES de `de881e13`, y el
 *  diff se PERSISTE en `jsonb`: estas `null` se van a servir así para siempre. */
const filaRollbackConNulos = {
  id: '4e44c16d-d429-473b-9c27-86274c67619d',
  tenant_id: 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111',
  dashboard_id: 'd0187f9f-1e5b-4738-a538-826db2f61148',
  layout_id: 'f1687bc9-457a-496a-9388-b9cfff65150c',
  version_id: 'rollback-v-1790630106',
  action: 'rollback',
  actor_user_id: '33333333-3333-4333-8333-333333333333',
  actor_role: 'admin',
  previous_layout_id: 'bff2251d-4797-47a3-b278-f89c1f53bbdd',
  diff: {
    summary: { tabs_added: 0, panels_added: 0, tabs_removed: 1, panels_changed: 3, panels_removed: 1 },
    tabs_added: null,
    panels_added: null,
    panels_moved: [
      {
        to: { col_span: 3, row_span: 4, col_start: 1 },
        tab: 'marca',
        from: { col_span: 3, row_span: 4, col_start: 4 },
        type: 'kpi',
        metric_id: '0ec90430-794c-5626-9863-a88b610515bd',
      },
    ],
    tabs_removed: ['segunda'],
    panels_removed: [{ tab: 'segunda', type: 'kpi', metric_id: '0ec90430-794c-5626-9863-a88b610515bd' }],
    panels_retyped: [
      { tab: 'marca', type: 'kpi', from_type: 'gauge', metric_id: '0ec90430-794c-5626-9863-a88b610515bd' },
    ],
    tabs_reordered: null,
    panels_options_changed: [
      { tab: 'marca', type: 'kpi', metric_id: '0ec90430-794c-5626-9863-a88b610515bd' },
    ],
  },
  created_at: '2026-09-28T16:16:05.073326-05:00',
} satisfies WireLayoutPublication

describe('adaptarPublicacion · el renombre', () => {
  it('renombra los once campos sin derivar ninguno', () => {
    const p = adaptarPublicacion(filaConListasVacias)

    expect(p.id).toBe('471de362-456d-4958-a9b6-177aa4af24b7')
    expect(p.tenantId).toBe('e65f81ae-50ba-4ceb-bb11-d4c0bb76d111')
    expect(p.dashboardId).toBe('d0187f9f-1e5b-4738-a538-826db2f61148')
    expect(p.layoutId).toBe('16009187-188f-4011-8b34-01e5a6a38fef')
    expect(p.versionId).toBe('v-1790712673')
    expect(p.autorId).toBe('33333333-3333-4333-8333-333333333333')
    expect(p.autorRol).toBe('admin')
    // **El ISO pasa tal cual, con su offset.** El formateo es del locale del
    // tenant y vive en `render/format.ts`; formatear acá sería una segunda
    // fuente para algo que el tenant declara.
    expect(p.creadoEn).toBe('2026-09-29T15:11:13.664957-05:00')
  })

  it('NO traduce el valor del enumerado `action`: es clave del contrato', () => {
    expect(adaptarPublicacion(filaConListasVacias).accion).toBe('publish')
    expect(adaptarPublicacion(filaRollbackConNulos).accion).toBe('rollback')
  })

  it('lee los cinco contadores y no los suma', () => {
    const c = adaptarPublicacion(filaRollbackConNulos).diff?.contadores
    // `panels_changed: 3` con movidos 1 + retipados 1 + parámetro 1. El servicio
    // ya lo sumó; acá se LEE. Si se sumara y algún día dejaran de coincidir, la
    // diferencia quedaría escondida en vez de visible.
    expect(c).toEqual({
      pestanasAnadidas: 0,
      pestanasQuitadas: 1,
      panelesAnadidos: 0,
      panelesQuitados: 1,
      panelesCambiados: 3,
    })
  })

  it('lee `tabs_added` como CADENAS · el nombre normalizado de la pestaña', () => {
    // La trampa de este fixture: no son objetos y no es la `key`. Leído en
    // `internal/core/dashboard/diff.go`, donde `indexTabs` aplica
    // `tabKey(t.Name)`.
    expect(adaptarPublicacion(filaConListasVacias).diff?.pestanasAnadidas).toEqual([
      'repertorio con dato real',
    ])
  })

  it('adapta las tres formas de cambio con sus campos propios', () => {
    const d = adaptarPublicacion(filaRollbackConNulos).diff
    expect(d?.panelesMovidos[0]?.desde).toEqual({ colStart: 4, colSpan: 3, rowSpan: 4 })
    expect(d?.panelesMovidos[0]?.hasta).toEqual({ colStart: 1, colSpan: 3, rowSpan: 4 })
    expect(d?.panelesRetipados[0]?.tipoAnterior).toBe('gauge')
    expect(d?.panelesRetipados[0]?.tipo).toBe('kpi')
    expect(d?.panelesConParametroCambiado[0]?.pestana).toBe('marca')
  })
})

describe('adaptarPublicacion · `null` y `[]` son la MISMA clave en filas distintas', () => {
  it('normaliza a `[]` las ocho listas, vengan `null` o vengan `[]`', () => {
    // **Rompe si alguien escribe `w.diff.panels_moved` sin `?? []`.** No es
    // defensa genérica: está medido que `tabs_added`, `panels_added` y
    // `tabs_reordered` vuelven `null` en esta fila y `[]` en la del 29, porque el
    // diff se persiste y la serialización cambió después.
    const d = adaptarPublicacion(filaRollbackConNulos).diff
    expect(d).not.toBeNull()
    const listas = [
      d?.pestanasAnadidas,
      d?.pestanasQuitadas,
      d?.pestanasReordenadas,
      d?.panelesAnadidos,
      d?.panelesQuitados,
      d?.panelesMovidos,
      d?.panelesRetipados,
      d?.panelesConParametroCambiado,
    ]
    for (const l of listas) {
      expect(Array.isArray(l)).toBe(true)
    }
    // Las tres que venían `null` quedan vacías, no `undefined` ni `null`.
    expect(d?.pestanasAnadidas).toEqual([])
    expect(d?.panelesAnadidos).toEqual([])
    expect(d?.pestanasReordenadas).toEqual([])
  })

  it('un `diff` en `null` NO se colapsa a un diff en cero', () => {
    // El campo es `JSONRaw` y su `MarshalJSON` emite `null` con el valor vacío.
    // «No hay registro de qué cambió» y «no cambió nada» son dos cosas, y pintar
    // la segunda por la primera es el `?? 0` que A5 ya documentó.
    const p = adaptarPublicacion({ ...filaConListasVacias, diff: null })
    expect(p.diff).toBeNull()
  })
})

describe('adaptarPublicacion · los dos punteros con `omitempty`', () => {
  it('`previous_layout_id` presente es la uuid', () => {
    expect(adaptarPublicacion(filaConListasVacias).layoutAnteriorId).toBe(
      '605596a0-982e-485b-9368-2c1c5ebb4170',
    )
  })

  it('`previous_layout_id` AUSENTE es `null` y no `undefined`', () => {
    // Así llega la primera publicación de un dashboard, medido en la fila más
    // vieja de «Marca». Dos casos porque el cable tiene dos.
    const { previous_layout_id: _fuera, ...primeraPublicacion } = filaConListasVacias
    const p = adaptarPublicacion(primeraPublicacion)
    expect(p.layoutAnteriorId).toBeNull()
    expect(p.layoutAnteriorId).not.toBeUndefined()
  })

  it('`actor_user_id` AUSENTE es `null` · el campo es puntero con `omitempty`', () => {
    const { actor_user_id: _fuera, ...sinAutor } = filaConListasVacias
    expect(adaptarPublicacion(sinAutor).autorId).toBeNull()
  })
})

describe('adaptarPublicacion · lo que NO trae, atestiguado', () => {
  it('no tiene `resumen`, `razon`, `autorNombre` ni `direccionSemanticaCambiada`', () => {
    // **La prueba es la que impide que alguien los rellene con una frase
    // compuesta.** Un comentario no avisa; esto rompe. Las cuatro están pedidas
    // en `docs/PROPUESTA-2026-09-30-b6-prosa-del-historial.md`.
    const claves = Object.keys(adaptarPublicacion(filaConListasVacias))
    expect(claves).not.toContain('resumen')
    expect(claves).not.toContain('razon')
    expect(claves).not.toContain('autorNombre')
    expect(claves).not.toContain('direccionSemanticaCambiada')
  })

  it('no tiene `estado` ni `enProduccion`: eso es un cruce entre dos respuestas', () => {
    const claves = Object.keys(adaptarPublicacion(filaConListasVacias))
    expect(claves).not.toContain('estado')
    expect(claves).not.toContain('enProduccion')
  })
})

/** ── LOS DOS ARREGLOS QUE B6 NECESITÓ Y ESTABAN MAL ─────────────────────────
 *
 *  `adaptarVersion` no se exporta, así que se prueba por su superficie pública
 *  —`adaptarDetalle`—, que es la que otro código usa. Es lo que `tests/README.md`
 *  declara y no una limitación que haya que rodear.
 */
const detalle = (status: string) => ({
  layout: {
    id: '16009187-188f-4011-8b34-01e5a6a38fef',
    tenant_id: 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111',
    dashboard_id: 'd0187f9f-1e5b-4738-a538-826db2f61148',
    status: status as 'draft' | 'published' | 'archived',
    version_id: 'v-1790712673',
  },
  tabs: [],
})

describe('adaptarVersion · `archived` era una mentira, no un hueco', () => {
  it('lee `archived` como `archivado`', () => {
    // **Antes de este arreglo devolvía `borrador`**, y son 4 de los 7 layouts
    // que el servicio tiene: `ESTADOS['archived']` era `undefined` y el
    // `?? 'borrador'` lo entregaba como si fuera la lectura segura. Con eso B6 no
    // podía distinguir un borrador de una versión archivada — y `ContextView`
    // ofrecía editar cuatro versiones que no se pueden editar.
    expect(adaptarDetalle(detalle('archived')).layout.estado).toBe('archivado')
  })

  it('los otros dos siguen igual', () => {
    expect(adaptarDetalle(detalle('draft')).layout.estado).toBe('borrador')
    expect(adaptarDetalle(detalle('published')).layout.estado).toBe('publicado')
  })

  it('un estado que no está en el enum SIGUE cayendo en `borrador`', () => {
    // El fallback tiene que seguir siendo fallback y no volverse un mapeo: un
    // layout que no se sabe si está publicado no se trata como publicado.
    expect(adaptarDetalle(detalle('inventado')).layout.estado).toBe('borrador')
  })

  it('conserva `dashboardId` · sin él la pantalla no sabe qué historial pedir', () => {
    // Lo tiraba. El historial se pide **por dashboard** y la única vía desde la
    // versión que el builder tiene abierta es este campo.
    expect(adaptarDetalle(detalle('published')).layout.dashboardId).toBe(
      'd0187f9f-1e5b-4738-a538-826db2f61148',
    )
  })
})

/** ── LA FRONTERA HTTP, QUE NO TENÍA NINGUNA PRUEBA · QA 2026-09-30 ──────────
 *
 *  `adminApi.publicaciones`, `adminApi.revertir`, `usePublications` y
 *  `useRevertLayout` se entregaron **sin una sola prueba que los llamara**: un
 *  grep por sus nombres sobre `src` y `tests` no los encontraba fuera de donde se
 *  definen. Las pruebas de arriba llaman `adaptarPublicacion` directo, así que
 *  cubren el renombre y dejan sin cubrir **la ruta, el método y el cuerpo** —
 *  exactamente la frontera que la mutación encontró sin cubrir tres veces en
 *  septiembre, una capa más abajo.
 *
 *  Tres mutaciones fieles lo confirmaron: pedir el historial a la ruta de
 *  `layouts`, mandar el layout del path como destino de la reversión y olvidar la
 *  quinta invalidación **sobrevivían las tres** a las 69 pruebas entregadas.
 *
 *  Y las tres cosas están documentadas en el código como decisiones medidas con
 *  su razón: si la razón vale, tiene que haber una aserción.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
// **`createElement` y no JSX**: este archivo es `.ts` porque las pruebas del
// adaptador no renderizan nada, y meterle JSX obligaría a renombrarlo. El
// proveedor es el único nodo que hace falta.
import { createElement } from 'react'
import { adminApi } from '@/api/admin'
import { keys, usePublications, useRevertLayout } from '@/api/hooks'
import { ok } from '../mocks/handlers'
import { server } from '../mocks/server'

const API = '*/api/v1'
const DASHBOARD = 'd0187f9f-1e5b-4738-a538-826db2f61148'
const PUBLICADO = '16009187-188f-4011-8b34-01e5a6a38fef'
const DESTINO = 'f1687bc9-457a-496a-9388-b9cfff65150c'

describe('adminApi.publicaciones · va a la ruta de `dashboards`, no a la de `layouts`', () => {
  it('pide `GET /admin/dashboards/{id}/publications` y adapta las filas', async () => {
    /** **La ruta es la decisión de esta pantalla y nada la sostenía.** Las dos
     *  existen y devuelven la misma forma, así que la elección se ve arbitraria:
     *  `ListByLayout` filtra `layout_id = ? OR previous_layout_id = ?` y devuelve
     *  UNA fila, porque revertir copia a un layout nuevo y cada layout se publica
     *  una sola vez. Con la ruta de `layouts` B6 pintaría una tarjeta sola y quien
     *  la mire creería que el servicio está pobre — sin que nada falle.
     *
     *  `onUnhandledRequest: 'error'` hace el resto: si la ruta cambia, la petición
     *  no tiene handler y la prueba lo dice con la URL. */
    server.use(
      http.get(`${API}/admin/dashboards/${DASHBOARD}/publications`, () =>
        ok([filaConListasVacias, filaRollbackConNulos]),
      ),
    )
    const filas = await adminApi.publicaciones(DASHBOARD)
    expect(filas).toHaveLength(2)
    expect(filas[0]?.versionId).toBe('v-1790712673')
    // Y pasa por el adaptador, no por un `as`: la fila vieja llega normalizada.
    expect(filas[1]?.diff?.pestanasAnadidas).toEqual([])
  })
})

describe('adminApi.revertir · el path acota y el CUERPO elige', () => {
  it('hace POST al layout PUBLICADO y manda el DESTINO en `to_layout_id`', async () => {
    /** **Mandar el layout del path como destino sobrevivía.** Es la confusión que
     *  el propio comentario de `adminApi.revertir` advierte —«confundirlos
     *  revertiría al layout equivocado sin que nada falle»— y no había aserción:
     *  el servicio contestaría 409 `CONFLICT_REVERT_SELF` y la pantalla diría que
     *  no se pudo revertir, sin decir por qué.
     *
     *  Los dos uuids son DISTINTOS a propósito: con el mismo valor en los dos
     *  lados, un intercambio no se puede detectar. */
    let cuerpo: unknown = null
    let metodo = ''
    server.use(
      http.post(`${API}/admin/layouts/${PUBLICADO}/revert`, async ({ request }) => {
        metodo = request.method
        cuerpo = await request.json()
        return ok({
          id: DESTINO,
          tenant_id: 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111',
          dashboard_id: DASHBOARD,
          status: 'published',
          version_id: 'rollback-v-1790712673',
        })
      }),
    )

    const v = await adminApi.revertir(PUBLICADO, DESTINO)

    expect(metodo).toBe('POST')
    expect(cuerpo).toEqual({ to_layout_id: DESTINO })
    // La clave del contrato NO se traduce y el destino NO es el del path.
    expect((cuerpo as { to_layout_id: string }).to_layout_id).not.toBe(PUBLICADO)
    // Y la respuesta vuelve por `adaptarVersion`, con su `dashboardId`.
    expect(v.estado).toBe('publicado')
    expect(v.dashboardId).toBe(DASHBOARD)
  })

  it('el 409 de `CONFLICT_REVERT_SELF` sube como error y no como versión', async () => {
    // Las dos compuertas de 409 son lo único medido del lado del servicio. Sin
    // esto, un rechazo se podría estar tragando y la pantalla diría que revirtió.
    server.use(
      http.post(`${API}/admin/layouts/${PUBLICADO}/revert`, () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT_REVERT_SELF', message: 'no se puede revertir a sí mismo' } },
          { status: 409 },
        ),
      ),
    )
    await expect(adminApi.revertir(PUBLICADO, PUBLICADO)).rejects.toThrow()
  })
})

describe('useRevertLayout · la QUINTA invalidación, que el código llama «el defecto silencioso»', () => {
  it('invalida el historial además de las cuatro de publicar', async () => {
    /** **Olvidar `publicaciones` sobrevivía.** Y es el defecto que el comentario
     *  del hook describe en seis líneas: el historial se quedaría mostrando el
     *  estado viejo justo después de la acción que lo cambió, la fila del
     *  `rollback` no aparecería, y quien apretó el botón concluiría que no
     *  funcionó. Todo responde 200 y la pantalla no cambia — el mismo modo de
     *  falla que `usePublishLayout` ya tiene cubierto con sus cuatro. */
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidadas: string[] = []
    const original = qc.invalidateQueries.bind(qc)
    qc.invalidateQueries = ((filtros: { queryKey?: readonly unknown[] }) => {
      invalidadas.push(JSON.stringify(filtros.queryKey))
      return original(filtros)
    }) as typeof qc.invalidateQueries

    server.use(
      http.post(`${API}/admin/layouts/${PUBLICADO}/revert`, () =>
        ok({
          id: DESTINO,
          tenant_id: 't-1',
          dashboard_id: DASHBOARD,
          status: 'published',
          version_id: 'rollback-v-1',
        }),
      ),
    )

    // **Los dos ids viajan en la mutación** · el hook sólo toma tenant y
    // dashboard. Era `useRevertLayout(PUBLICADO, 't-1', DASHBOARD)`, y con el
    // layout publicado en el hook el contenedor tenía que derivarlo por segunda
    // vez para armar la URL; ahora lo pasa el mismo payload que la fila entrega.
    const { result } = renderHook(() => useRevertLayout('t-1', DASHBOARD), {
      wrapper: ({ children }) => createElement(QueryClientProvider, { client: qc }, children),
    })
    result.current.mutate({ layoutId: PUBLICADO, toLayoutId: DESTINO })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // La quinta, que es la de esta pantalla…
    expect(invalidadas).toContain(JSON.stringify(keys.publicaciones(DASHBOARD)))
    // …y las cuatro de publicar, que siguen haciendo falta: revertir PUBLICA.
    expect(invalidadas).toContain(JSON.stringify(keys.layouts('t-1')))
    expect(invalidadas).toContain(JSON.stringify(keys.layout(PUBLICADO)))
    expect(invalidadas).toContain(JSON.stringify(keys.me))
    expect(invalidadas).toContain(JSON.stringify(['config', 'tab']))
  })
})

describe('usePublications · la guarda de `enabled`, que evita pedir con el id vacío', () => {
  /** `queryFn` hace `adminApi.publicaciones(dashboardId as string)`: el `as`
   *  borra el `null`, así que lo único que impide una petición a
   *  `/admin/dashboards//publications` es el `enabled`. El builder monta antes de
   *  saber el dashboard —sale de `version.dashboardId`, que llega con el detalle—,
   *  así que el caso ocurre en el arranque, no en el borde.
   *
   *  `onUnhandledRequest: 'error'` es lo que lo hace visible: si se pidiera con el
   *  id vacío, no hay handler para esa URL y la prueba lo diría. */
  const envolver = (qc: QueryClient) => ({
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
  })

  /** **Se CUENTAN las peticiones, y la primera versión de esta prueba no lo
   *  hacía.** Afirmaba `fetchStatus === 'idle'` y `data === undefined`, y eso es
   *  cierto en los DOS mundos: una consulta deshabilitada nunca sale de `idle`,
   *  y una que salió y falló vuelve a `idle` con `data` en `undefined` también.
   *  La mutación que saca `&& dashboardId !== ''` **sobrevivió** a esa versión.
   *
   *  Lo que distingue los dos mundos es si hubo petición, así que se cuenta. */
  const contarPeticiones = (): (() => string[]) => {
    const urls: string[] = []
    const escuchar = ({ request }: { request: Request }) => urls.push(request.url)
    server.events.on('request:start', escuchar)
    onTestFinished(() => {
      server.events.removeListener('request:start', escuchar)
    })
    return () => urls
  }

  it('con `null` no pide NADA y la consulta queda deshabilitada', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const urls = contarPeticiones()
    const { result } = renderHook(() => usePublications(null), envolver(qc))
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    // Una consulta deshabilitada se queda en `pending`; una que falló va a
    // `error`. Es la diferencia que `data === undefined` no ve.
    expect(result.current.status).toBe('pending')
    expect(urls()).toEqual([])
  })

  it('con la cadena vacía TAMPOCO pide · es el caso que un `!== null` solo deja pasar', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const urls = contarPeticiones()
    const { result } = renderHook(() => usePublications(''), envolver(qc))
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(result.current.status).toBe('pending')
    // Sin esto, la petición sale a `/admin/dashboards//publications` — con el
    // segmento vacío— y lo único que la delata es que no tenga handler.
    expect(urls()).toEqual([])
  })

  it('con un uuid pide y devuelve las filas adaptadas', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    server.use(
      http.get(`${API}/admin/dashboards/${DASHBOARD}/publications`, () =>
        ok([filaConListasVacias]),
      ),
    )
    const { result } = renderHook(() => usePublications(DASHBOARD), envolver(qc))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0]?.versionId).toBe('v-1790712673')
  })
})

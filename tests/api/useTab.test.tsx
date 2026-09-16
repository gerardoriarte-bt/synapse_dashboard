// @vitest-environment jsdom
//
// Por lo mismo que `client.test.ts`: la base cae a `/api/v1`, que es RELATIVO,
// y en node `fetch` de una URL relativa tira `Failed to parse URL`.

/** El `layoutId` en la clave de cache · F5.2
 *
 *  ── POR QUÉ ESTO NO LO CUBRÍA `client.test.ts` ──────────────────────────────
 *
 *  Esa prueba verifica la mitad de la URL —«escapa el tabId y agrega el layoutId
 *  solo si vino»— y es la mitad fácil. La otra la pide el criterio con todas las
 *  letras: **«dos layouts no comparten entrada»**.
 *
 *  Son independientes. La URL puede estar perfecta y la clave igual: si
 *  `keys.tab` ignorara el `layoutId`, la PRIMERA pestaña que se pida se
 *  cachearía y la segunda la leería del cache **sin pedir nada**, con la URL
 *  correcta escrita en un fetch que nunca ocurre. El síntoma es el peor de los
 *  posibles: el builder muestra el borrador donde va lo publicado, o al revés, y
 *  los dos se ven igual de bien.
 *
 *  Por eso se afirma sobre lo OBSERVABLE a los dos lados —qué URLs se pidieron y
 *  qué datos llegaron a cada hook—, y no sobre el arreglo que `keys.tab`
 *  devuelve. Una aserción sobre la clave fija la forma de la clave; ésta fija la
 *  consecuencia.
 *
 *  ── EL CACHE HAY QUE DEJARLO PRENDIDO ───────────────────────────────────────
 *
 *  **Y `staleTime: Infinity` no es afinar la prueba hasta que pase.** Con el
 *  default —`staleTime: 0`— una entrada COMPARTIDA se vuelve a pedir igual: el
 *  segundo hook lee del cache y dispara un refetch de fondo, así que la red se
 *  ve idéntica compartiendo entrada y no compartiéndola. Medido: la segunda
 *  prueba salía `['layout-a', 'layout-a']` con el código correcto.
 *
 *  Contar llamadas mide entonces la política de frescura y no la clave, que es
 *  justo lo que hay que separar. Con la frescura congelada, **una llamada
 *  significa una entrada** y el conteo vuelve a hablar de lo que se pregunta.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTab } from '@/api/hooks'
import { server } from '../mocks/server'

const API = '*/api/v1'
const TAB = 'tab-1'

/** Del cable · `TabWithPanels` de `synapse-console-wire.yaml`. El `name` es lo
 *  que distingue una respuesta de la otra, y por eso viaja distinto en cada una. */
const pestana = (name: string) => ({
  tab: { id: TAB, name, operational_question: '¿Qué movió el negocio?', sort_order: 1 },
  panels: [],
})

/** Sin reintentos y con la frescura congelada · la razón está arriba. */
const cliente = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })

function envoltorio(qc: QueryClient) {
  return function Envoltorio({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('el layoutId entra en la clave de cache · F5.2', () => {
  let pedidas: string[]
  let pedidasTab: string[]

  beforeEach(() => {
    pedidas = []
    pedidasTab = []
    server.use(
      http.get(`${API}/config/tabs/:tabId`, ({ request, params }) => {
        pedidasTab.push(String(params['tabId']))
        const url = new URL(request.url)
        const layoutId = url.searchParams.get('layoutId')
        pedidas.push(layoutId ?? '(sin layoutId)')
        return HttpResponse.json({ success: true, data: pestana(layoutId ?? 'publicado') })
      }),
    )
  })

  it('dos layouts distintos NO comparten entrada · se piden los dos', async () => {
    const qc = cliente()
    const Envoltorio = envoltorio(qc)

    const a = renderHook(() => useTab(TAB, 'layout-a'), { wrapper: Envoltorio })
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true))

    const b = renderHook(() => useTab(TAB, 'layout-b'), { wrapper: Envoltorio })
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true))

    // Las dos llamadas ocurrieron, y **cada hook tiene lo suyo**. Sin el
    // `layoutId` en la clave, `pedidas` sería `['layout-a']` y los dos `name`
    // dirían «layout-a».
    expect(pedidas).toEqual(['layout-a', 'layout-b'])
    expect(a.result.current.data?.tab.nombre).toBe('layout-a')
    expect(b.result.current.data?.tab.nombre).toBe('layout-b')
  })

  it('el MISMO layout sí comparte entrada · una sola llamada', async () => {
    // La otra mitad, y sin ella la primera se satisface con una clave que lleve
    // un número al azar: dos layouts no compartirían nada, y el mismo tampoco.
    const qc = cliente()
    const Envoltorio = envoltorio(qc)

    const a = renderHook(() => useTab(TAB, 'layout-a'), { wrapper: Envoltorio })
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true))

    const b = renderHook(() => useTab(TAB, 'layout-a'), { wrapper: Envoltorio })
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true))

    expect(pedidas).toEqual(['layout-a'])
  })

  it('dos PESTAÑAS del mismo layout tampoco comparten entrada', async () => {
    // No lo pide el criterio de F5.2, que habla de layouts. Lo pidió la
    // mutación: sacar el `tabId` de la clave sobrevivía a las tres pruebas de
    // arriba, porque las tres usan una sola pestaña. La clave tiene dos partes
    // variables y ahora las dos están sostenidas.
    const qc = cliente()
    const Envoltorio = envoltorio(qc)

    const a = renderHook(() => useTab('tab-1', 'layout-a'), { wrapper: Envoltorio })
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true))

    const b = renderHook(() => useTab('tab-2', 'layout-a'), { wrapper: Envoltorio })
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true))

    expect(pedidas).toEqual(['layout-a', 'layout-a'])
    expect(pedidasTab).toEqual(['tab-1', 'tab-2'])
  })

  it('sin layoutId no comparte con un layout nombrado · el defecto del rol es otra entrada', async () => {
    // **Sin `layoutId` el backend resuelve el layout por defecto del rol**, que
    // es el segundo punto del criterio. Ese default es una composición más, no
    // «la misma sin el parámetro»: si compartiera entrada con un borrador que se
    // pidió antes, la consola pintaría el borrador.
    const qc = cliente()
    const Envoltorio = envoltorio(qc)

    const a = renderHook(() => useTab(TAB, 'layout-a'), { wrapper: Envoltorio })
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true))

    const b = renderHook(() => useTab(TAB), { wrapper: Envoltorio })
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true))

    expect(pedidas).toEqual(['layout-a', '(sin layoutId)'])
    expect(b.result.current.data?.tab.nombre).toBe('publicado')
  })
})

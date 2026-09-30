// @vitest-environment jsdom

/** El selector de gráfico, y el campo que el builder BORRABA · F4.21 · 2026-09-29
 *
 *  ── LO QUE APARECIÓ AL CONSTRUIRLO, Y ES PEOR QUE LO QUE FALTABA ────────────
 *
 *  El borrador del builder **no llevaba `chart`**: ni `adaptarPanel` lo leía ni
 *  el cuerpo del `PUT` lo mandaba. Eso no era un hueco — **el `PUT` del layout
 *  es un REEMPLAZO COMPLETO**, y el cable lo dice con esas palabras: «se envía el
 *  layout entero y lo que no venga se borra».
 *
 *  Así que abrir en el builder un layout con gráficos y guardar **los borraba
 *  todos**, en silencio, sin que nada fallara y sin que nadie lo pudiera
 *  atribuir a haber apretado Guardar.
 *
 *  **Y la cabecera de `borrador.ts` decía justo lo contrario**: «que el borrador
 *  tenga la forma del cuerpo y no una intermedia es la decisión que sostiene todo
 *  lo demás: no hay una segunda traducción donde perder un campo». Es cierto — y
 *  el campo se perdió igual, porque **la forma nunca lo tuvo**. Tener una sola
 *  traducción protege de perder lo que se transcribió; no protege de lo que no
 *  se transcribió nunca.
 *
 *  Por eso la primera prueba de acá no es del selector: es de la ida y vuelta.
 */
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { adaptarDetalle, adminApi } from '@/api/admin'
import { sembrar, quitarOPonerGrafico } from '@/surfaces/builder/borrador'
import { PlotPicker } from '@/surfaces/builder/PlotPicker'
import { API, ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import type { Plot, Shape } from '@/catalog/types'

/** Un layout con un panel que YA trae gráfico, en la forma del cable admin. */
const detalleCrudo = {
  layout: {
    id: 'l-1',
    tenant_id: 't-1',
    dashboard_id: 'd-1',
    status: 'draft',
    version_id: '',
    published_at: null,
  },
  dashboard: { id: 'd-1', name: 'Marca', slug: 'marca', is_default: false },
  tabs: [
    {
      tab: {
        id: 'tb-1',
        layout_version_id: 'l-1',
        name: 'Overview',
        key: 'overview',
        operational_question: '¿Cómo va?',
        sort_order: 1,
        role_ids: [],
      },
      panels: [
        {
          id: 'p-1',
          metric_id: 'm-1',
          type: 'bars',
          col_start: 1,
          col_span: 4,
          row_span: 4,
          chart: 'donut',
          note: '',
        },
      ],
    },
  ],
}

describe('el gráfico sobrevive la ida y vuelta del builder', () => {
  it('se LEE del layout · antes llegaba al borrador sin gráfico', () => {
    const d = adaptarDetalle(detalleCrudo as never)
    expect(d.tabs[0]?.panels[0]?.grafico).toBe('donut')
  })

  /** Captura el cuerpo REAL del `PUT`. **Más fuerte que exportar `aCuerpo` para
   *  probarla**: lo que importa no es qué devuelve esa función sino qué sale por
   *  el cable, y es lo único que el servicio ve. */
  async function cuerpoDelPut(detalle: unknown) {
    let visto: { tabs: { panels: { chart?: string }[] }[] } | null = null
    server.use(
      http.put(`${API}/admin/layouts/:id`, async ({ request }) => {
        visto = (await request.json()) as typeof visto
        return ok(detalle)
      }),
    )
    await adminApi.guardar('l-1', sembrar(adaptarDetalle(detalle as never)))
    return visto as unknown as { tabs: { panels: { chart?: string }[] }[] }
  }

  it('**y se ESCRIBE en el cuerpo del PUT**, que es donde se perdía', async () => {
    // Sin esto el `PUT` mandaba el panel sin `chart` y el servicio —que
    // reemplaza el layout entero— lo dejaba vacío.
    const cuerpo = await cuerpoDelPut(detalleCrudo)
    expect(cuerpo.tabs[0]?.panels[0]?.chart).toBe('donut')
  })

  it('sin gráfico viaja CADENA VACÍA y no la clave ausente', async () => {
    const sinGrafico = JSON.parse(JSON.stringify(detalleCrudo)) as typeof detalleCrudo
    sinGrafico.tabs[0]!.panels[0]!.chart = ''

    // Explícito y no ausente: el cuerpo dice qué se quiso —sin gráfico elegido,
    // el de por defecto del tipo— en vez de dejarlo a la interpretación.
    const cuerpo = await cuerpoDelPut(sinGrafico)
    expect(cuerpo.tabs[0]?.panels[0]?.chart).toBe('')
  })

  it('**quitar BORRA la clave** · con un `Partial` no habría pasado nada', () => {
    const borrador = sembrar(adaptarDetalle(detalleCrudo as never))
    const sin = quitarOPonerGrafico(borrador, 0, 0, undefined)

    // `editarPanel` mezcla con spread, así que `{ grafico: undefined }` deja la
    // clave intacta: «quitar» se vería funcionando y no haría nada. Es el modo
    // de falla del spread condicional, del otro lado.
    expect('grafico' in (sin[0]?.panels[0] ?? {})).toBe(false)
    expect(quitarOPonerGrafico(borrador, 0, 0, 'pareto')[0]?.panels[0]?.grafico).toBe('pareto')
  })
})

/** Tres entradas del repertorio, capturadas de `/config/plots`. `treemap` sirve
 *  dos formas con umbrales distintos, que es lo que hace discriminante la prueba
 *  del mínimo por forma. */
const REPERTORIO = [
  {
    id: 'bars',
    nombre: 'BARRAS',
    formas: ['categorica', 'ranking'],
    soportaBanda: false,
    minimos: [{ forma: 'categorica', cuando: 'items < 2', razon: 'una barra sola no compara nada' }],
    tope: null,
  },
  {
    id: 'treemap',
    nombre: 'TREEMAP',
    formas: ['categorica', 'composicion'],
    soportaBanda: false,
    minimos: [
      { forma: 'categorica', cuando: 'items < 2', razon: 'una barra sola no compara nada' },
      { forma: 'composicion', cuando: 'partes < 3', razon: 'con dos rectángulos es una barra apilada' },
    ],
    tope: null,
  },
  {
    id: 'donut',
    nombre: 'DONA',
    formas: ['categorica', 'composicion'],
    soportaBanda: false,
    minimos: [{ forma: 'categorica', cuando: 'items < 2', razon: 'una barra sola no compara nada' }],
    tope: { cuando: 'partes > 5', razon: 'más de cinco partes, ilegible en dona' },
  },
] as unknown as Plot[]

function montar(formas: Shape[], onElegir = () => {}) {
  return render(
    <PlotPicker
      tipo="bars"
      formasDelTipo={formas}
      plots={REPERTORIO}
      onElegir={onElegir}
      onVolver={() => {}}
    />,
  )
}

describe('la lista se filtra por FORMA · el primer bullet del criterio', () => {
  it('los incompatibles no se muestran · ni deshabilitados sin explicación', () => {
    // `ranking` lo sirve sólo `bars`. `treemap` y `donut` no tienen que
    // aparecer — y tampoco aparecer en gris, que es lo que el criterio prohíbe.
    montar(['ranking'])

    expect(screen.getByText('BARRAS')).toBeVisible()
    expect(screen.queryByText('TREEMAP')).toBeNull()
    expect(screen.queryByText('DONA')).toBeNull()
  })

  it('un gráfico que sirve DOS formas aparece en los dos grupos', () => {
    // Y no es repetición: su mínimo cambia con la forma, así que quien compone
    // tiene que ver el que le toca en cada grupo.
    montar(['categorica', 'composicion'])
    expect(screen.getAllByText('TREEMAP')).toHaveLength(2)
  })
})

describe('cada opción DECLARA su mínimo y su tope · el segundo bullet', () => {
  it('el mínimo es el de ESA forma, no el primero de la lista', () => {
    montar(['categorica', 'composicion'])

    // `treemap` pide 2 en `categorica` y 3 en `composicion`. Mostrar el primero
    // en los dos grupos le diría a quien compone que necesita dos donde necesita
    // tres — y el panel quedaría vacío en un tenant chico, que es exactamente lo
    // que el criterio quiere evitar.
    expect(screen.getByText(/partes < 3/)).toBeVisible()
    expect(screen.getByText(/con dos rectángulos es una barra apilada/)).toBeVisible()
  })

  it('el tope se declara con su razón', () => {
    montar(['categorica'])
    expect(screen.getByText(/partes > 5/)).toBeVisible()
    expect(screen.getByText(/ilegible en dona/)).toBeVisible()
  })

  it('y NO va en el naranja · el dibujo lo pinta en `$dim`', () => {
    // ── POR QUÉ ESTA ASERCIÓN EXISTE · 2026-09-30 ────────────────────────────
    //
    // El tope se pintaba en `text-acc` con esta razón escrita en el componente:
    // «es donde el `.pen` lo pinta en la variante deshabilitada». **Se leyó el
    // dibujo y es falso.** El frame `B3 · Selector · gráfico deshabilitado por
    // tope` sustituye la DESCRIPCIÓN de la opción por la razón del tope y la
    // deja en `$dim` —el mismo tono que ese renglón ya tenía—; lo que cambia es
    // el nombre, que baja de `$ink` a `$dim`, y el preview, que se apaga.
    //
    // Nada lo ataba, así que la afirmación falsa sobrevivió a la construcción de
    // la pantalla. Es la forma que la auditoría de A2 encontró cinco veces el
    // mismo día: algo declarado en prosa y sin aserción se deshace solo.
    //
    // **Y el color no es cosmética**: el naranja es regla dura —«solo CTAs,
    // estado activo, enlaces y cifras resaltadas en prosa»— y un tope sobre una
    // opción HABILITADA no es ninguna de las cuatro.
    montar(['categorica'])
    const tope = screen.getByText(/partes > 5/)

    // Se mira el elemento Y sus ancestros hasta la opción: el color puede venir
    // de un `<span>` envolvente, que es como estaba puesto.
    let n: HTMLElement | null = tope
    const clases: string[] = []
    while (n !== null && n.tagName !== 'BUTTON') {
      clases.push(n.className)
      n = n.parentElement
    }
    expect(clases.join(' ')).not.toContain('text-acc')
  })

  it('un gráfico SIN mínimo lo dice · no se deja el hueco mudo', () => {
    montar(['ranking'])
    expect(screen.getByText(/Sin mínimo/)).toBeVisible()
  })
})

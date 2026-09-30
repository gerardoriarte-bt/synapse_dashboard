// @vitest-environment jsdom

/** B6 · Historial de versiones · §PEN:B6
 *
 *  **LA PRUEBA QUE IMPORTA ES QUE `REVERTIR A ESTA` DISPARE.** La cadena es
 *  `VersionHistory → VersionCard → onClick` y el salto usa **spread condicional**,
 *  que es obligatorio con `exactOptionalPropertyTypes` y tiene un costo medido:
 *  una prop mal nombrada COMPILA. Pasó tres veces el 2026-09-02 —`onChat`,
 *  `onRetry`, un CTA sin manejador— y el síntoma es siempre el mismo: un callback
 *  que no se dispara, que no ve el compilador ni el lint.
 *
 *  Así que no se afirma que el botón exista. **Un botón muerto se ve igual que
 *  uno que funciona.**
 *
 *  Los datos salen de la medición del 2026-09-30 contra `:4010`: las cinco filas
 *  del dashboard «Marca» y el usuario `dev@synapse.local`.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VersionHistory } from '@/surfaces/builder/VersionHistory'
import { VersionCard } from '@/surfaces/builder/VersionCard'
import { createFormat, LOCALE_POR_DEFECTO } from '@/render/format'
import type { LayoutVersion, Publicacion, Usuario } from '@/api/admin'
import type { Metric } from '@/api/types'

const TENANT = 'e65f81ae-50ba-4ceb-bb11-d4c0bb76d111'
const DASHBOARD = 'd0187f9f-1e5b-4738-a538-826db2f61148'
const PUBLICADO = '16009187-188f-4011-8b34-01e5a6a38fef'
const DESTINO = 'f1687bc9-457a-496a-9388-b9cfff65150c'
const AUTOR = '33333333-3333-4333-8333-333333333333'
const METRICA = '0ec90430-794c-5626-9863-a88b610515bd'

const format = createFormat(LOCALE_POR_DEFECTO)

const sinCambios = () => ({
  contadores: {
    pestanasAnadidas: 0,
    pestanasQuitadas: 0,
    panelesAnadidos: 0,
    panelesQuitados: 0,
    panelesCambiados: 0,
  },
  pestanasAnadidas: [],
  pestanasQuitadas: [],
  pestanasReordenadas: [],
  panelesAnadidos: [],
  panelesQuitados: [],
  panelesMovidos: [],
  panelesRetipados: [],
  panelesConParametroCambiado: [],
})

const fila = (over: Partial<Publicacion>): Publicacion => ({
  id: `pub-${over.layoutId ?? 'x'}-${over.versionId ?? 'v'}`,
  tenantId: TENANT,
  dashboardId: DASHBOARD,
  layoutId: PUBLICADO,
  versionId: 'v-1790712673',
  accion: 'publish',
  autorId: AUTOR,
  autorRol: 'admin',
  layoutAnteriorId: null,
  diff: sinCambios(),
  creadoEn: '2026-09-29T15:11:13.664957-05:00',
  ...over,
})

/** Las cinco filas medidas, más nuevas primero. El orden lo decide el servicio y
 *  la pantalla no reordena. */
const CINCO: Publicacion[] = [
  fila({ layoutId: PUBLICADO, versionId: 'v-1790712673' }),
  fila({ layoutId: '605596a0-982e-485b-9368-2c1c5ebb4170', versionId: 'v-1790692732' }),
  fila({
    layoutId: DESTINO,
    versionId: 'rollback-v-1790630106',
    accion: 'rollback',
    creadoEn: '2026-09-28T16:16:05.073326-05:00',
    diff: {
      ...sinCambios(),
      contadores: { ...sinCambios().contadores, panelesQuitados: 1, panelesCambiados: 1 },
      panelesQuitados: [{ pestana: 'segunda', tipo: 'kpi', metricId: METRICA }],
      panelesMovidos: [
        {
          pestana: 'marca',
          tipo: 'kpi',
          metricId: METRICA,
          desde: { colStart: 4, colSpan: 3, rowSpan: 4 },
          hasta: { colStart: 1, colSpan: 3, rowSpan: 4 },
        },
      ],
    },
  }),
  fila({ layoutId: 'bff2251d-4797-47a3-b278-f89c1f53bbdd', versionId: 'v-1790630165' }),
  fila({ layoutId: '779a4742-0000-4000-8000-000000000001', versionId: 'v-1790630106' }),
]

const layout = (id: string, estado: LayoutVersion['estado']): LayoutVersion => ({
  id,
  tenantId: TENANT,
  dashboardId: DASHBOARD,
  estado,
  versionId: 'x',
  publicadoEn: null,
})

/** **Los cuatro `archivado` son medidos**: `GET /admin/tenants/{id}/layouts`
 *  devuelve 7 versiones y son 4 archivadas, 2 publicadas y 1 borrador. Antes del
 *  arreglo del adaptador las cuatro se leían como borradores. */
const LAYOUTS: LayoutVersion[] = [
  layout(PUBLICADO, 'publicado'),
  layout(DESTINO, 'archivado'),
  layout('605596a0-982e-485b-9368-2c1c5ebb4170', 'archivado'),
  layout('bff2251d-4797-47a3-b278-f89c1f53bbdd', 'archivado'),
  layout('779a4742-0000-4000-8000-000000000001', 'archivado'),
]

const USUARIOS: Usuario[] = [
  {
    id: AUTOR,
    nombre: 'Dev Local',
    email: 'dev@synapse.local',
    rol: 'admin',
    rolId: 'r-1',
    ultimoAccesoEn: null,
    activo: true,
    altaEn: '2026-09-01T00:00:00Z',
    clienteNombre: 'Under Armour México',
  },
]

const METRICAS = [{ id: METRICA, nombre: 'Sales' } as Metric]

function pintar(over: Partial<Parameters<typeof VersionHistory>[0]> = {}) {
  const onRevertir = vi.fn()
  render(
    <VersionHistory
      publicaciones={CINCO}
      layouts={LAYOUTS}
      dashboardNombre="Marca"
      clienteNombre="Under Armour México"
      usuarios={USUARIOS}
      metricas={METRICAS}
      format={format}
      onRevertir={onRevertir}
      {...over}
    />,
  )
  return { onRevertir }
}

describe('B6 · la cabecera y el título', () => {
  it('el título nombra el DASHBOARD y el cliente, no una pestaña', () => {
    // El dibujo pinta «eCommerce Overview · UA MX», que es un nombre de pestaña:
    // es anterior al multi-dashboard. Una publicación versiona el layout entero.
    pintar()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Marca · Under Armour México',
    )
  })

  it('sin nombre de dashboard el título dice sólo el cliente', () => {
    // **`null` es un caso real, no un borde** · el único cable transcripto con
    // nombres de dashboard es `/config/me`, que es del usuario que MIRA: al
    // componer un cliente ajeno el nombre no tiene fuente. Lo que falta para
    // cerrarlo es transcribir `GET /admin/tenants/{tenantId}/dashboards`.
    //
    // Decir menos no es decir algo falso; un id crudo o un «Dashboard» a secas sí.
    pintar({ dashboardNombre: null })
    const titulo = screen.getByRole('heading', { level: 1 })
    expect(titulo).toHaveTextContent('Under Armour México')
    expect(titulo.textContent).not.toContain('·')
  })

  it('imprime el literal normativo de la cabecera', () => {
    pintar()
    expect(
      screen.getByText(/REVERTIR NO PIERDE LO POSTERIOR/i),
    ).toBeInTheDocument()
  })
})

describe('B6 · el badge EN PRODUCCIÓN se deriva', () => {
  it('aparece EXACTAMENTE UNA VEZ, y en la fila del layout publicado', () => {
    // Con dos badges o cero, rompe. El badge no viaja en la fila: sale de cruzar
    // `layoutId` contra el layout cuyo estado es `publicado`.
    pintar()
    const badges = screen.getAllByText(/EN PRODUCCIÓN/i)
    expect(badges).toHaveLength(1)
    // Y está en la tarjeta de `v-1790712673`, que es la del layout publicado.
    const tarjeta = badges[0]?.closest('li')
    expect(tarjeta).toHaveTextContent('v-1790712673')
  })

  it('con las cuatro versiones archivadas leídas como BORRADOR no habría badge', () => {
    // El caso que el arreglo del adaptador destrabó, al revés: si ningún layout
    // llega `publicado`, no hay badge ni botón. Es lo que pasaba cuando
    // `ESTADOS['archived']` era `undefined` y todo caía en `borrador`.
    pintar({ layouts: LAYOUTS.map((l) => layout(l.id, 'borrador')) })
    expect(screen.queryByText(/EN PRODUCCIÓN/i)).toBeNull()
  })
})

describe('B6 · `REVERTIR A ESTA` · la regla de `enabled` del dibujo', () => {
  it('DISPARA con el layout publicado en el path y el destino en el cuerpo', async () => {
    // **No se afirma que el botón exista.** El path es el layout PUBLICADO y el
    // cuerpo el destino: confundirlos revertiría al layout equivocado sin que
    // nada falle. Es lo que `dd_layout_builder_service.go` hace.
    const { onRevertir } = pintar()
    const tarjeta = screen.getByText('rollback-v-1790630106').closest('li')
    expect(tarjeta).not.toBeNull()
    const boton = tarjeta?.querySelector('button')
    expect(boton).not.toBeNull()
    await userEvent.click(boton as HTMLButtonElement)

    expect(onRevertir).toHaveBeenCalledTimes(1)
    expect(onRevertir).toHaveBeenCalledWith({ layoutId: PUBLICADO, toLayoutId: DESTINO })
  })

  it('NO se pinta en la fila que está EN PRODUCCIÓN', () => {
    // La misma regla que el servicio hace cumplir con `CONFLICT_REVERT_SELF`. Un
    // botón que se aprieta y devuelve 409 es peor que un botón ausente.
    pintar()
    const enProduccion = screen.getByText(/EN PRODUCCIÓN/i).closest('li')
    expect(enProduccion?.querySelector('button')).toBeNull()
  })

  it('NO se pinta en NINGUNA fila si no hay layout publicado', () => {
    // Sin destino no hay manejador, y un CTA sin manejador no se pinta. La otra
    // punta de la misma regla.
    pintar({ layouts: LAYOUTS.filter((l) => l.estado !== 'publicado') })
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

describe('B6 · el autor se resuelve en la superficie', () => {
  it('con el uuid en la lista, la línea dice el NOMBRE', () => {
    pintar()
    expect(screen.getAllByText(/DEV LOCAL · 29 sep 2026, 15:11/i).length).toBeGreaterThan(0)
  })

  it('con un uuid que NO está, arranca por el rol y el uuid no aparece en el DOM', () => {
    // Nunca un uuid crudo y nunca un «Desconocido» inventado. Es el caso donde
    // cae también el «SISTEMA» que el dibujo pinta para la publicación de semilla:
    // el cable no tiene marca de actor automático.
    pintar({ publicaciones: [fila({ autorId: 'aaaaaaaa-0000-4000-8000-000000000000' })] })
    expect(screen.getByText(/^admin · /i)).toBeInTheDocument()
    expect(screen.queryByText(/aaaaaaaa/)).toBeNull()
  })

  it('con la fila SIN autor —el cable lo permite— también arranca por el rol', () => {
    pintar({ publicaciones: [fila({ autorId: null })] })
    expect(screen.getByText(/^admin · /i)).toBeInTheDocument()
  })
})

describe('B6 · el nombre de la métrica y el uuid que nunca se pinta', () => {
  it('con un `metricId` del catálogo, la entrada dice el nombre', () => {
    pintar()
    expect(screen.getAllByText(/Sales/).length).toBeGreaterThan(0)
  })

  it('con uno que no está, dice MÉTRICA FUERA DEL CATÁLOGO y el uuid no se pinta', () => {
    pintar({ metricas: [] })
    expect(screen.getAllByText(/MÉTRICA FUERA DEL CATÁLOGO/).length).toBeGreaterThan(0)
    expect(screen.queryByText(new RegExp(METRICA))).toBeNull()
  })
})

describe('B6 · el vacío y el diff sin cambios', () => {
  it('con cero publicaciones pinta el vacío de sistema con su salida, no «cargando»', () => {
    // **El caso está medido**: el dashboard «Overview» tiene un layout publicado
    // y cero publicaciones, porque la auditoría se empezó a escribir con
    // `168a761`. Un historial vacío no es un error ni un dashboard sin publicar.
    pintar({ publicaciones: [] })
    expect(screen.getByText(/SIN PUBLICACIONES REGISTRADAS/i)).toBeInTheDocument()
    expect(screen.getByText(/DEJA SU FILA/i)).toBeInTheDocument()
    expect(screen.queryByText(/cargando/i)).toBeNull()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('con el diff en cero pinta SIN CAMBIOS DE COMPOSICIÓN y no un bloque vacío', () => {
    pintar({ publicaciones: [fila({})] })
    expect(screen.getByText(/SIN CAMBIOS DE COMPOSICIÓN/i)).toBeInTheDocument()
  })

  it('con el diff en `null` NO dice «sin cambios»: dice que no hay registro', () => {
    // `null` es «no sé qué cambió» y cero es «no cambió nada». Colapsarlos afirma
    // lo que no se sabe.
    pintar({ publicaciones: [fila({ diff: null })] })
    expect(screen.getByText(/SIN REGISTRO DE QUÉ CAMBIÓ/i)).toBeInTheDocument()
    expect(screen.queryByText(/SIN CAMBIOS DE COMPOSICIÓN/i)).toBeNull()
  })
})

describe('B6 · lo que el dibujo pide y no se compone', () => {
  it('declara los cinco huecos en vez de inventar la prosa', () => {
    // Una divergencia sin prueba deriva en silencio el día que alguien la
    // «arregle» componiendo la frase.
    pintar()
    expect(screen.getByText(/va a crecer/i)).toBeInTheDocument()
    expect(screen.getByText(/resumen que escribió quien publicó/i)).toBeInTheDocument()
    expect(screen.getByText(/La razón de cada cambio/i)).toBeInTheDocument()
    expect(screen.getByText(/El borrador en curso/i)).toBeInTheDocument()
  })

  it('«REVERSIÓN» se ve, y sólo en la fila que llegó por rollback', () => {
    // No está dibujado. Si una versión llegó por reversión y el historial no lo
    // dice, el historial miente sobre cómo se llegó ahí.
    pintar()
    const chips = screen.getAllByText(/^REVERSIÓN$/i)
    expect(chips).toHaveLength(1)
    expect(chips[0]?.closest('li')).toHaveTextContent('rollback-v-1790630106')
  })

  it('el ORDEN de las filas es el del servicio · más nuevas primero, sin reordenar', () => {
    // **Es el riesgo que ninguna otra prueba miraba.** El servicio ordena por
    // `created_at` descendente y la pantalla no puede reordenar: si lo hiciera,
    // «la de arriba es la última» dejaría de ser cierto y el badge
    // `EN PRODUCCIÓN` aparecería en el medio de la lista sin explicación.
    pintar()
    const etiquetas = screen
      .getAllByRole('listitem')
      .map((li) => li.querySelector('span')?.textContent)
    expect(etiquetas).toEqual([
      'v-1790712673',
      'v-1790692732',
      'rollback-v-1790630106',
      'v-1790630165',
      'v-1790630106',
    ])
  })

  it('el `version_id` se pinta VERBATIM · no se renumera a v1..vN', () => {
    pintar()
    expect(screen.getByText('rollback-v-1790630106')).toBeInTheDocument()
    expect(screen.getByText('v-1790712673')).toBeInTheDocument()
    expect(screen.queryByText(/^v4$/)).toBeNull()
  })
})

/** ── LA TARJETA, DIRECTA · LA MUTACIÓN QUE SOBREVIVIÓ ──────────────────────
 *
 *  `VersionCard` guarda `!enProduccion` además de pedir el manejador, y borrar
 *  esa guarda **no hacía fallar ninguna prueba**: la pantalla nunca le pasa
 *  `onRevertir` en la fila publicada, así que la guarda quedaba sin cubrir.
 *
 *  **No se borró la guarda: se cubrió.** La tarjeta es un componente reusable y
 *  el patrón de `enabled` del `.pen` es normativo — cualquier llamador futuro que
 *  le pase las dos cosas tiene que seguir sin ver el botón. Una mutación que
 *  sobrevive es la prueba que falta, no código de más.
 */
describe('VersionCard · MOVIDO nombra sólo lo que cambió · lo encontró MIRAR el render', () => {
  const movido = (desde: { colStart: number; colSpan: number; rowSpan: number }, hasta: typeof desde) =>
    fila({
      diff: {
        ...sinCambios(),
        contadores: { ...sinCambios().contadores, panelesCambiados: 1 },
        panelesMovidos: [{ pestana: 'marca', tipo: 'kpi', metricId: METRICA, desde, hasta }],
      },
    })

  it('si sólo cambió la columna, NO imprime «de 3×4 a 3×4»', () => {
    // **El servicio emite `panels_moved` cuando cambió CUALQUIERA de los tres
    // números**, así que un panel que sólo se corrió imprimía el par de spans
    // idéntico al lado. Un par idéntico se lee como un defecto del que lo pinta.
    // No lo vio ninguna prueba: lo vio dumpear el render.
    pintar({
      publicaciones: [movido({ colStart: 4, colSpan: 3, rowSpan: 4 }, { colStart: 1, colSpan: 3, rowSpan: 4 })],
    })
    expect(screen.getByText(/de colStart 4 a 1/)).toBeInTheDocument()
    expect(screen.queryByText(/3×4 a 3×4/)).toBeNull()
  })

  it('si cambió el tamaño y no la columna, imprime el tamaño y no la columna', () => {
    pintar({
      publicaciones: [movido({ colStart: 1, colSpan: 3, rowSpan: 4 }, { colStart: 1, colSpan: 6, rowSpan: 4 })],
    })
    expect(screen.getByText(/de 3×4 a 6×4/)).toBeInTheDocument()
    expect(screen.queryByText(/colStart/)).toBeNull()
  })
})

describe('VersionCard · la guarda propia de la tarjeta', () => {
  it('con `onRevertir` Y `enProduccion` NO pinta el botón', () => {
    const onRevertir = vi.fn()
    render(
      <ul>
        <VersionCard
          publicacion={fila({})}
          enProduccion
          autorNombre="Dev Local"
          nombreDeMetrica={() => 'Sales'}
          format={format}
          onRevertir={onRevertir}
        />
      </ul>,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('con `onRevertir` y sin `enProduccion`, el botón DISPARA', () => {
    // La otra punta: la guarda no puede apagar el botón cuando corresponde.
    const onRevertir = vi.fn()
    render(
      <ul>
        <VersionCard
          publicacion={fila({})}
          enProduccion={false}
          autorNombre="Dev Local"
          nombreDeMetrica={() => 'Sales'}
          format={format}
          onRevertir={onRevertir}
        />
      </ul>,
    )
    screen.getByRole('button').click()
    expect(onRevertir).toHaveBeenCalledTimes(1)
  })
})

/** ── LOS SEIS HUECOS QUE LA MUTACIÓN ENCONTRÓ · QA 2026-09-30 ───────────────
 *
 *  Seis mutaciones fieles SOBREVIVIERON a las 69 pruebas entregadas, con la base
 *  verde y el control nulo sobreviviendo. Tres son de esta pantalla y van acá.
 *  Las otras tres —la ruta del historial, el cuerpo de la reversión y la quinta
 *  invalidación— van en `tests/api/publicaciones.test.ts`, que es su capa.
 */
describe('B6 · QA · los cinco contadores, que son el sustituto del «Resumen»', () => {
  /** **Ninguna prueba los miraba.** Cambiar «Paneles añadidos» para que pinte la
   *  cifra de los QUITADOS sobrevivía a las 69, y es el modo de falla que «ningún
   *  número desnudo» existe para atajar: el rótulo y la cifra son dos cosas y un
   *  cruce entre ellas se ve perfectamente bien.
   *
   *  Los cinco valores son DISTINTOS a propósito: con ceros o repetidos, un
   *  intercambio de pares no se puede detectar. */
  const cincoDistintos = () =>
    fila({
      diff: {
        ...sinCambios(),
        contadores: {
          pestanasAnadidas: 1,
          pestanasQuitadas: 2,
          panelesAnadidos: 3,
          panelesQuitados: 4,
          panelesCambiados: 5,
        },
      },
    })

  const par = (rotulo: string): string | undefined => {
    const label = screen.getByText(rotulo)
    // El `Value` envuelve su `Label` y su cifra en un `div`; el label es el
    // primer hijo, así que el padre es el par entero.
    return label.parentElement?.textContent ?? undefined
  }

  it('cada rótulo va con SU cifra · un cruce de pares se ve bien y miente', () => {
    // **Los rótulos se buscan en PROSA y no en mayúsculas.** `Label` sube la caja
    // con la utilidad `uppercase`, así que en el DOM el texto es «Pestañas
    // añadidas» y lo que se ve en pantalla es la versión alta. Buscarlos en
    // mayúsculas no encuentra nada — y es la razón por la que las pruebas de
    // arriba usan la bandera `i`.
    pintar({ publicaciones: [cincoDistintos()] })
    expect(par('Pestañas añadidas')).toBe('Pestañas añadidas1')
    expect(par('Pestañas quitadas')).toBe('Pestañas quitadas2')
    expect(par('Paneles añadidos')).toBe('Paneles añadidos3')
    expect(par('Paneles quitados')).toBe('Paneles quitados4')
    expect(par('Paneles cambiados')).toBe('Paneles cambiados5')
  })

  it('el cero se pinta · esconderlo haría que «sin cambios» y «no lo sé» se lean igual', () => {
    // Es lo que la cabecera del componente promete: «Los cinco siempre, incluido
    // el cero». Sin esta prueba, un `!== 0 &&` delante de cada `Value` compila y
    // convierte las cinco cifras en el mensaje de `diff === null`.
    pintar({ publicaciones: [fila({})] })
    expect(par('Paneles cambiados')).toBe('Paneles cambiados0')
    expect(screen.getAllByText('Pestañas añadidas')).toHaveLength(1)
  })
})

describe('B6 · QA · el color del glifo `+`, que estaba declarado en prosa y sin aserción', () => {
  it('el `+` va en `fam-medios-1` y el `~` y el `!` en `dim`', () => {
    // **La divergencia estaba escrita y nada la sostenía**: el componente explica
    // en diez líneas por qué copia un token de familia de datos —el `.pen` gana
    // para lo visual— y dejarlo en `text-dim` sobrevivía a las 69 pruebas. Una
    // divergencia declarada en prosa y sin aserción se deriva en silencio el día
    // que alguien «arregle» el token creyendo que viola `design.md`.
    //
    // Va con el riesgo de contraste anotado: `contraste.py` no mide hoy
    // `fam-medios-1` sobre `elev`.
    pintar({
      publicaciones: [
        fila({
          diff: {
            ...sinCambios(),
            pestanasAnadidas: ['nueva'],
            pestanasQuitadas: ['vieja'],
            panelesMovidos: [
              {
                pestana: 'marca',
                tipo: 'kpi',
                metricId: METRICA,
                desde: { colStart: 4, colSpan: 3, rowSpan: 4 },
                hasta: { colStart: 1, colSpan: 3, rowSpan: 4 },
              },
            ],
          },
        }),
      ],
    })
    // `Array.from` y no un spread: el `target` del proyecto no le da iterador a
    // `NodeListOf`, y `tsc -p tsconfig.test.json` lo marca aunque vitest no.
    const glifos = Array.from(document.querySelectorAll('span.w-3')).map((s) => ({
      glifo: s.textContent,
      clases: s.className,
    }))
    expect(glifos.map((g) => g.glifo)).toEqual(['+', '!', '~'])
    expect(glifos[0]?.clases).toContain('text-fam-medios-1')
    expect(glifos[1]?.clases).toContain('text-dim')
    expect(glifos[2]?.clases).toContain('text-dim')
    // Y ninguno en el naranja: L2 · el acento no es color de datos.
    for (const g of glifos) expect(g.clases).not.toContain('text-acc')
  })
})

describe('B6 · QA · `layouts` llega POR TENANT y el historial es de UN dashboard', () => {
  /** **El defecto que ninguna prueba podía ver**, porque las cinco filas del
   *  fixture y los cinco layouts son todos del mismo dashboard.
   *
   *  `GET /admin/tenants/{tenantId}/layouts` es del TENANT —su propio `summary`
   *  lo dice: «Las versiones de layout del tenant»— y el corte medido del
   *  2026-09-30 son **7 versiones con 2 `published`**, una por dashboard. Con
   *  multi-dashboard eso no es una rareza: es lo normal.
   *
   *  Así que «el layout publicado» no se puede buscar con un `find` sobre el
   *  estado: hay que acotarlo al dashboard del que es este historial. El
   *  `dashboardId` ya viaja —en la fila y en el layout— justamente para esto. */
  const OTRO_DASHBOARD = 'ffffffff-1111-4000-8000-000000000001'
  const PUBLICADO_DE_OTRO = 'eeeeeeee-2222-4000-8000-000000000002'

  const layoutsDeDosDashboards = (): LayoutVersion[] => [
    // Primero el del OTRO dashboard, que es lo que hace que un `find` lo tome.
    { ...layout(PUBLICADO_DE_OTRO, 'publicado'), dashboardId: OTRO_DASHBOARD },
    ...LAYOUTS,
  ]

  it('el badge EN PRODUCCIÓN sigue en la fila de ESTE dashboard', () => {
    // Con el `find` sin acotar, el publicado que se toma es el del otro
    // dashboard, su id no coincide con ninguna `layoutId` del historial y el
    // badge **desaparece**: la pantalla diría que ninguna de las cinco versiones
    // está en producción, teniendo una que sí.
    pintar({ layouts: layoutsDeDosDashboards() })
    const badges = screen.getAllByText(/EN PRODUCCIÓN/i)
    expect(badges).toHaveLength(1)
    expect(badges[0]?.closest('li')).toHaveTextContent('v-1790712673')
  })

  it('la reversión NO manda en el path el layout de otro dashboard', async () => {
    // Es el mismo defecto que el componente ya documenta un nivel más abajo —«el
    // path acota tenant+dashboard, el cuerpo elige»— y acá el path apuntaría a
    // OTRO dashboard. El servicio lo usa para acotar y para `CONFLICT_REVERT_SELF`,
    // así que la reversión se resolvería contra el dashboard equivocado.
    const { onRevertir } = pintar({ layouts: layoutsDeDosDashboards() })
    const boton = screen.getByText('rollback-v-1790630106').closest('li')?.querySelector('button')
    await userEvent.click(boton as HTMLButtonElement)
    expect(onRevertir).toHaveBeenCalledWith({ layoutId: PUBLICADO, toLayoutId: DESTINO })
  })
})

describe('B6 · QA · dos paneles de la MISMA métrica en la MISMA pestaña', () => {
  /** **React avisaba «two children with the same key» y podía OMITIR una línea.**
   *
   *  La clave era `${rotulo}:${pestana}:${metricId ?? i}` — el índice sólo entraba
   *  cuando faltaba la métrica. Dos paneles de la misma métrica en la misma
   *  pestaña movidos los dos dan la misma clave, y React lo dice con todas las
   *  letras: «Non-unique keys may cause children to be duplicated and/or
   *  omitted».
   *
   *  **Y es la composición que el propio dibujo describe**: «Medidores de
   *  composición en los seis KPI» es un `kpi` y un `gauge` sobre la misma métrica.
   *  Una línea de diff omitida en la pantalla que existe para auditar qué cambió
   *  es el peor lugar donde puede pasar.
   *
   *  La prueba mira `console.error` porque es el único canal donde React lo dice:
   *  no lanza, no rompe el render y no lo ve el compilador ni el lint. */
  const dosDeLaMisma = () =>
    fila({
      diff: {
        ...sinCambios(),
        contadores: { ...sinCambios().contadores, panelesCambiados: 2 },
        panelesMovidos: [
          {
            pestana: 'marca',
            tipo: 'kpi',
            metricId: METRICA,
            desde: { colStart: 4, colSpan: 3, rowSpan: 4 },
            hasta: { colStart: 1, colSpan: 3, rowSpan: 4 },
          },
          {
            pestana: 'marca',
            tipo: 'gauge',
            metricId: METRICA,
            desde: { colStart: 7, colSpan: 3, rowSpan: 4 },
            hasta: { colStart: 9, colSpan: 3, rowSpan: 4 },
          },
        ],
      },
    })

  it('no colisionan las claves de React', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    pintar({ publicaciones: [dosDeLaMisma()] })
    const avisos = spy.mock.calls
      .map((c) => String(c[0]))
      .filter((m) => /same key|non-unique/i.test(m))
    spy.mockRestore()
    expect(avisos).toEqual([])
  })

  it('las DOS líneas se pintan · una clave repetida puede omitir una', () => {
    // Es la consecuencia, y es la que importa: el conteo de líneas tiene que
    // coincidir con el contador que la tarjeta imprime.
    pintar({ publicaciones: [dosDeLaMisma()] })
    expect(screen.getByText(/de colStart 4 a 1/)).toBeInTheDocument()
    expect(screen.getByText(/de colStart 7 a 9/)).toBeInTheDocument()
    expect(screen.getAllByText('MOVIDO')).toHaveLength(2)
  })
})

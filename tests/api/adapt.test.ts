/** El adaptador del cable · F1.33
 *
 *  **Los fixtures se escriben desde `contracts/synapse-console-wire.yaml`, no de
 *  memoria.** Es la lección del 2026-09-04: se escribieron tres fixtures de
 *  memoria y el yaml corrigió los tres, y el que más enseña es el que pasaba
 *  igual porque la aserción solo miraba una mitad.
 *
 *  Acá el riesgo es el mismo con otra cara: un fixture inventado en el idioma
 *  del CONTRATO haría que el adaptador no traduzca nada y la prueba pasara.
 */
import { describe, expect, it } from 'vitest'
import { adaptBlocks, adaptCatalog, adaptContext, adaptPayload, adaptTab, adaptThread } from '@/api/adapt'
import type {
  WireBlock,
  WireChatThread,
  WireContext,
  WireMetric,
  WirePayload,
  WireTabWithPanels,
} from '@/api/adapt'

const contexto: WireContext = {
  user: { id: 'u-1', email: 'ana@uamx.test', first_name: 'Ana', last_name: 'Ruiz', theme: 'dark' },
  // **`dark` y no `light` a propósito**: el default del servicio es `light`, así
  // que un fixture con `light` pasaría igual si el adaptador ignorara el campo.
  tenant: {
    id: 't-1',
    name: 'Under Armour México',
    label: 'Under Armour México',
    locale: 'es-CO',
    currency: 'COP',
    timezone: 'America/Bogota',
  },
  role: { id: 'r-1', name: 'Planner' },
  tabs: [
    {
      id: 'tab-1',
      name: 'Inventario',
      operational_question: '¿Tenemos stock?',
      sort_order: 2,
      key: 'overview',
      icon: '',
      chat_suggestions: [],
    },
  ],
  periods: ['2026-08', '2026-W32', '2026-08-15'],
  // ── B1.1 · los tres que llegaron el 2026-09-28 ────────────────────────────
  //
  // **Este fixture tiene tres períodos de granos distintos a propósito** —mes,
  // semana y día—, y `period_grain` dice `month` porque es el grano de TODOS
  // los `periods` según ellos. La contradicción es del servicio, no del
  // fixture, y se deja a la vista: hoy `period_grain` siempre vale `month`.
  period_grain: 'month' as const,
  periods_detail: [
    { key: '2026-08', grain: 'month' as const, start: '2026-08-01', end: '2026-09-01' },
  ],
  scope: { kind: 'single_tenant' as const, tenants: [{ id: 't-1', name: 'UA MX', label: 'UA MX' }] },
  catalog_version: 7,
}

const metrica: WireMetric = {
  id: 'm-1',
  tenant_id: 't-1',
  key: 'revenue',
  name: 'Ingresos',
  shape: 'scalar',
  family: 'media',
  layer: 'GOLD',
  source: 'Adobe + Ads API',
  base: '48 tiendas sobre 52',
  unit: 'USD',
  // **Llegan las DOS formas y el front pinta la que venga** · medido el
  // 2026-09-26: `HIGHER_IS_BETTER` en las 6 métricas de Snowflake y
  // `HIGHER = BETTER` en las 8 de la semilla. Acá va el código porque es el que
  // se ve mal en pantalla, y la prueba de abajo afirma que NO se traduce.
  semantic_direction: 'HIGHER_IS_BETTER',
  min_grain: 'month',
  measurement_window: 'Mes calendario seleccionado',
  dimensions: ['canal'],
  catalog_version: 7,
}

describe('contexto', () => {
  const ctx = adaptContext(contexto)

  it('traduce los nombres y compone el del usuario', () => {
    // Los dos datos llegaron partidos; juntarlos es reformatear, no inventar.
    expect(ctx.user.nombre).toBe('Ana Ruiz')
    expect(ctx.tenant.nombre).toBe('Under Armour México')
    expect(ctx.role.nombre).toBe('Planner')
    expect(ctx.catalogVersion).toBe(7)
  })

  it('la pestaña lleva su pregunta operativa y su orden', () => {
    // Una pestaña que no contesta una pregunta no se compone: `pregunta` es el
    // título de la pantalla, no un subtítulo opcional.
    expect(ctx.tabs[0]).toMatchObject({ nombre: 'Inventario', pregunta: '¿Tenemos stock?', orden: 2 })
  })

  it('deduce el grano de la FORMA del id, que es lo que el contrato sanciona', () => {
    // El selector lo necesita para deshabilitar lo que una métrica mensual no
    // puede contestar. Sin esto, «ofrecer un período que la métrica no puede
    // contestar» — el mismo problema que un panel sin BASE.
    expect(ctx.periodos.map((p) => p.grano)).toEqual(['mes', 'semana', 'dia'])
  })

  it('NO redacta la etiqueta del período: usa el id crudo', () => {
    // «AGO 2026» necesita un locale, y `Contexto.locale` es otro campo que el
    // cable no trae. Elegirlo sería el front decidiendo el idioma del tenant.
    expect(ctx.periodos[0]?.etiqueta).toBe('2026-08')
  })

  it('lo que el cable no trae NO se rellena con un valor plausible', () => {
    // `usuario` es el único alcance que este servicio sostiene: `plataforma`
    // necesita `tenantsDisponibles`, que tampoco existe.
    expect(ctx.alcance).toBe('usuario')
    // `false` es la dirección a prueba de fallo: con `true` el panel pintaría
    // APROBAR para todos, y un botón que devuelve 403 es peor que uno ausente.
    expect(ctx.role.puedeAprobar).toBe(false)
    // Ausentes, no inventados.
    expect(ctx.user.capacidades).toBeUndefined()
    expect(ctx.tenant.vertical).toBe('')

    // ── **`preferencias.tema` DEJÓ DE ESTAR AUSENTE** · 2026-10-02 ─────────
    //
    // Acá decía `toBeUndefined()`, y era correcto: el adaptador no lo rellenaba
    // «porque nadie lo consumiría». **Esta aserción existía justamente para
    // avisar el día que apareciera**, y avisó — es el par de la regla «una
    // prueba borrada no avisa cuando el campo aparece».
    //
    // El fixture trae `theme: 'dark'`, que es lo que el cable manda.
    expect(ctx.user.preferencias).toEqual({ tema: 'dark' })
  })

  it('sin `theme` en el cable, `preferencias` queda AUSENTE · no se inventa un tema', () => {
    // Que el campo exista no autoriza a rellenarlo con un default: «oscuro» por
    // omisión sería una preferencia que nadie expresó, y la aplicación ya abre
    // en oscuro por token. Ausente significa «no eligió», que es distinto.
    const { theme: _theme, ...sinTema } = contexto.user
    const ctx = adaptContext({ ...contexto, user: sinTema } as typeof contexto)

    expect(ctx.user.preferencias).toBeUndefined()
  })
})

describe('catálogo', () => {
  it('traduce forma, familia y grano a los nombres del contrato', () => {
    const { metrics } = adaptCatalog([metrica])
    expect(metrics[0]).toMatchObject({
      forma: 'escalar',
      // De la familia sale el color: `medios` es el que nombra
      // `--color-fam-medios-1`. Con `media` el token no existe.
      familia: 'medios',
      capa: 'GOLD',
      granoMinimo: 'mes',
      unidad: 'USD',
    })
  })

  it('NO traduce la dirección semántica: el front no escribe copy', () => {
    // El contrato la declara como texto que se pinta tal cual y el cable manda
    // un código. Convertirlo a «MÁS ALTO = MEJOR» sería redactar producto.
    const { metrics } = adaptCatalog([metrica])
    expect(metrics[0]?.direccionSemantica).toBe('HIGHER_IS_BETTER')
  })

  // **La VENTANA ya llega · B1.25, desde `8633b10`.** Acá se afirmaba que era
  // `''` porque el cable no la mandaba, y esa aserción **falló sola** el
  // 2026-09-26 al llegar el campo — que es para lo que estaba escrita así.
  it('la VENTANA se RENOMBRA de `measurement_window` · B1.25', () => {
    const { metrics } = adaptCatalog([metrica])
    expect(metrics[0]?.ventana).toBe('Mes calendario seleccionado')
  })

  it('una ventana vacía pasa VACÍA · no se deriva del período', () => {
    // **Es 8 de 18 métricas**, las que la vista de Snowflake no tiene. Y lo que
    // esta prueba defiende es que el adaptador NO la invente: dos métricas
    // consultadas con el mismo `2026-08` pueden tener ventanas distintas —un
    // total mensual y un promedio móvil de treinta días—, así que derivarla del
    // período sería escribir un dato de gobierno que nadie midió.
    const { metrics } = adaptCatalog([{ ...metrica, measurement_window: '' }])
    expect(metrics[0]?.ventana).toBe('')
  })

  it('una familia desconocida NO pasa, y sale con su razón', () => {
    // Si pasara, el color de la serie sería `var(--color-fam-vendors-1)`, que no
    // existe: la serie se pinta sin color y nadie se entera. Es el mismo modo de
    // silencio que una utilidad que nombra un token inexistente.
    const { metrics, rejected } = adaptCatalog([{ ...metrica, family: 'vendors' }])

    expect(metrics).toHaveLength(0)
    expect(rejected[0]).toMatchObject({ key: 'revenue' })
    expect(rejected[0]?.razon).toContain('vendors')
  })

  it('`distribution` SÍ pasa desde el 2026-09-25 · se dibuja', () => {
    // **Esta prueba decía lo contrario y tenía razón hasta el 2026-09-21**,
    // cuando `168a761` llevó el `switch` del materializador de nueve casos a
    // quince. Ahora el backend la emite, el contrato declara su esquema y
    // `DistributionBody` existe: las tres condiciones para dibujarla.
    const { metrics, rejected } = adaptCatalog([{ ...metrica, shape: 'distribution' }])

    expect(metrics).toHaveLength(1)
    expect(rejected).toHaveLength(0)
  })

  it('y `series_with_band` también · el nivel llegó con `75b8ecc`', () => {
    const { metrics, rejected } = adaptCatalog([{ ...metrica, shape: 'series_with_band' }])
    expect(metrics).toHaveLength(1)
    expect(rejected).toHaveLength(0)
  })

  it('las tres de v1.1 pasan · F4.17–F4.19, 2026-09-30', () => {
    // Las tres condiciones se cumplen a la vez: el backend las materializa —con
    // las entradas de `MetricRegistry` que escribimos y corrimos contra
    // Snowflake—, el contrato declara su esquema desde el 2026-09-26, y los tres
    // cuerpos existen.
    const { metrics, rejected } = adaptCatalog(
      ['compared_categorical', 'matrix', 'flow'].map((shape, i) => ({
        ...metrica,
        id: `m-${i}`,
        shape,
      })),
    )
    expect(metrics.map((m) => m.forma)).toEqual(['categoricaComparada', 'matriz', 'flujo'])
    expect(rejected).toHaveLength(0)
  })

  it('una forma que el front todavía NO DIBUJA no pasa · y la razón lo dice', () => {
    // **EL EJEMPLO CAMBIÓ DE FORMA POR SEGUNDA VEZ · 2026-09-30.** Era
    // `distribution`, pasó a `matrix` el 2026-09-25 cuando la primera empezó a
    // dibujarse, y hoy `matrix` también se dibuja. Ahora es `graph`, y de las
    // dieciséis es la que menos probable es que se mueva: no tiene gráfico
    // construido **y** no tiene de dónde salir, porque ninguna columna de las dos
    // tablas Gold trae aristas origen→destino.
    //
    // Que este ejemplo haya que mudarlo dos veces en una semana es el patrón
    // registrado: un caso negativo cuyo ejemplo se vuelve positivo queda
    // verificando algo que ya no existe. Acá lo atrapó la puerta las dos veces.
    const { metrics, rejected } = adaptCatalog([{ ...metrica, shape: 'graph' }])

    expect(metrics).toHaveLength(0)
    expect(rejected[0]?.razon).toContain('graph')
    expect(rejected[0]?.razon).toMatch(/no dibuja/i)
  })

  it('lo que sí se puede adaptar no se cae con lo que no', () => {
    // Fallo parcial: una métrica rota no vacía el catálogo entero.
    const { metrics, rejected } = adaptCatalog([metrica, { ...metrica, id: 'm-2', family: 'x' }])
    expect(metrics).toHaveLength(1)
    expect(rejected).toHaveLength(1)
  })
})

describe('bloques', () => {
  const bars: WireBlock = {
    type: 'bars',
    ui_name: 'Barras',
    accepted_shapes: ['categorical', 'ranking'],
    col_span_min: 4,
    col_span_max: 8,
    row_span_min: 4,
    row_span_max: 5,
    layout_params: ['order', 'cap'],
  }

  it('traduce las formas aceptadas y conserva los rangos', () => {
    const [b] = adaptBlocks([bars])
    expect(b).toMatchObject({
      tipo: 'bars',
      formasAceptadas: ['categorica', 'ranking'],
      colSpanMin: 4,
      colSpanMax: 8,
      rowSpanMin: 4,
      rowSpanMax: 5,
    })
  })

  it('expande el comodín de `blocked`, que el contrato no tiene', () => {
    const [b] = adaptBlocks([{ ...bars, type: 'blocked', accepted_shapes: ['*'] }])
    // **A las que el front DIBUJA**, no a las dieciséis del enum: ofrecer una
    // forma que ningún cuerpo puede pintar es una promesa vacía.
    //
    // Eran nueve, once desde el 2026-09-25 y **catorce desde el 2026-09-30**,
    // cuando `categoricaComparada`, `matriz` y `flujo` pasaron a tener las tres
    // cosas —el backend las materializa, el contrato declara su esquema y hay
    // cuerpo—.
    expect(b?.formasAceptadas).toContain('escalar')
    expect(b?.formasAceptadas).toContain('distribucion')
    expect(b?.formasAceptadas).toContain('serieConBanda')
    expect(b?.formasAceptadas).toContain('matriz')
    // **Y NO las dos que no se dibujan.** `perfilMultiatributo` tiene un solo
    // gráfico en el repertorio —`radar`— y no está construido; `grafo` no tiene
    // ni gráfico ni dato del cual salir. Ofrecerlas en el comodín sería una
    // promesa vacía en el builder.
    expect(b?.formasAceptadas).not.toContain('perfilMultiatributo')
    expect(b?.formasAceptadas).not.toContain('grafo')
    // **El número exacto, y no sólo la pertenencia.** Sin esto, agregar una forma
    // a `DIBUJABLES` sin cuerpo pasaría las seis afirmaciones de arriba.
    expect(b?.formasAceptadas).toHaveLength(14)
  })

  /** ── LO QUE `/config/blocks` MANDA DE VERDAD · 2026-09-15 ────────────────
   *
   *  Capturado del servicio corriendo, no escrito de memoria. Es la prueba que
   *  faltaba: hasta hoy el mapa de nombres tenía nueve entradas y las seis que
   *  faltaban salían de `accepted_shapes` **en silencio** —`flatMap` sobre un
   *  `undefined` devuelve `[]` y no deja rastro—, así que tres de los quince
   *  bloques llegaban a la biblioteca del builder con la lista de formas vacía.
   *
   *  Ninguna prueba lo vio porque todas usaban `bars`, cuyas dos formas sí
   *  estaban. Un fixture que solo ejercita el caso que funciona no cubre nada. */
  it.each([
    ['comparison', ['compared_categorical', 'multi_attribute_profile'], ['categoricaComparada', 'perfilMultiatributo']],
    ['matrix', ['matrix'], ['matriz']],
    ['graph', ['graph', 'flow'], ['grafo', 'flujo']],
    ['distribution', ['distribution'], ['distribucion']],
    ['forecast', ['scalar_with_interval', 'series_with_band'], ['escalarConIntervalo', 'serieConBanda']],
  ])('%s traduce sus formas y no llega con la lista vacía', (type, cable, contrato) => {
    const [b] = adaptBlocks([{ ...bars, type, accepted_shapes: cable }])
    expect(b?.formasAceptadas).toEqual(contrato)
  })

  it('que el BLOQUE nombre una forma no la hace dibujable · son dos puertas', () => {
    // Las dos afirmaciones van juntas a propósito: hasta el 2026-09-15 eran una
    // sola tabla, y la tentación de volver a juntarlas es lo que esta prueba
    // impide.
    //
    // **El ejemplo cambió de forma dos veces**: `distribution` el 2026-09-25 y
    // `matrix` el 2026-09-30, las dos veces porque la forma que servía de ejemplo
    // pasó a dibujarse. Ahora es `graph`, que el bloque `graph` nombra y el
    // catálogo sigue rechazando porque no hay gráfico que la dibuje.
    const [b] = adaptBlocks([{ ...bars, type: 'graph', accepted_shapes: ['graph'] }])
    expect(b?.formasAceptadas).toEqual(['grafo'])

    const { metrics, rejected } = adaptCatalog([{ ...metrica, shape: 'graph' }])
    expect(metrics).toHaveLength(0)
    expect(rejected[0]?.razon).toMatch(/no dibuja/i)
  })
})

describe('pestaña con paneles', () => {
  const wire: WireTabWithPanels = {
    tab: {
      id: 'tab-1',
      name: 'Inventario',
      operational_question: '¿Stock?',
      sort_order: 1,
      key: 'overview',
      icon: '',
      chat_suggestions: [],
    },
    panels: [
      {
        id: 'p-1',
        metric_id: 'm-1',
        type: 'kpi',
        col_start: 5,
        col_span: 4,
        row_span: 3,
        chart: '',
        note: '',
        options: { comparative: true },
      },
    ],
  }

  it('la grilla llega con las claves del contrato', () => {
    // `col_start` → `colStart`. Si no se tradujera, `PanelInGrid` colocaría todo
    // en la columna 1 con el default y la pantalla se vería «casi bien».
    expect(adaptTab(wire).panels[0]).toMatchObject({
      id: 'p-1',
      tipo: 'kpi',
      metricId: 'm-1',
      colStart: 5,
      colSpan: 4,
      rowSpan: 3,
    })
  })

  it('el adaptador traduce el NOMBRE del param; el VALOR lo valida params.ts', () => {
    // El reparto, desde F1.41: acá se traduce `comparative` → `comparativo`, que
    // es vocabulario; que `comparativo` sea un booleano y no un arreglo lo
    // decide `validateParams`, que es esquema. Antes esta prueba afirmaba que
    // pasaban crudas, y por eso el `maximum` de un `gauge` se descartaba.
    expect(adaptTab(wire).panels[0]?.opciones).toEqual({ comparativo: true })
  })

  it('un panel sin opciones no declara la clave', () => {
    // `exactOptionalPropertyTypes`: pasar `undefined` a una prop opcional no es
    // lo mismo que no pasarla, y el spread condicional del adaptador existe por
    // eso. La clave se OMITE al construir el fixture, no se pone en `undefined`
    // — que es la misma distinción que se está verificando.
    const sinOpciones: WireTabWithPanels = {
      tab: wire.tab,
      panels: [
        { id: 'p-2', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4, note: '', chart: '' },
      ],
    }
    expect(adaptTab(sinOpciones).panels[0]).not.toHaveProperty('opciones')
  })
})

/* ══ Payload · valor · presentación · F1.34 ═══════════════════════════════════ */

const governance = {
  base: '48 tiendas sobre 52',
  layer: 'GOLD',
  source: 'Snowflake',
  freshness: '2026-09-02T08:00:00Z',
  catalog_version: 3,
  // **B1.25 · requerido desde el 2026-09-26.** Con texto, porque el caso que
  // importa es que `ventana` DEJE de salir vacía: de ahí venía el separador
  // colgando de la línea de BASE. El caso vacío tiene su propia prueba.
  measurement_window: 'Mes calendario seleccionado',
}

const conValor = (value: unknown) => adaptPayload({ status: 'AVAILABLE', governance, value } as WirePayload)

describe('los cinco estados del cable → las cinco variantes del contrato', () => {
  it('AVAILABLE trae el gobierno APLANADO, no anidado', () => {
    const p = conValor({ shape: 'scalar', v: 12 })
    // El contrato lo intersecta en el payload; el cable lo anida en
    // `governance`. Si siguiera anidado, `resolveGovernance` leería `undefined`
    // y la procedencia saldría vacía en los doce paneles.
    expect(p).toMatchObject({
      estado: 'DISPONIBLE',
      base: '48 tiendas sobre 52',
      capa: 'GOLD',
      fuente: 'Snowflake',
      frescura: '2026-09-02T08:00:00Z',
      catalogVersion: 3,
    })
  })

  it('DEGRADED conserva razón y desbloqueo, que el servicio SÍ redacta', () => {
    const p = adaptPayload({
      status: 'DEGRADED',
      governance,
      value: { shape: 'scalar', v: 12 },
      reason: 'Dato viejo',
      unlocks_with: 'La próxima materialización',
    } as WirePayload)
    expect(p).toMatchObject({
      estado: 'DEGRADADO',
      razon: 'Dato viejo',
      desbloqueaCon: 'La próxima materialización',
    })
  })

  it('BLOCKED NO inventa un «qué lo desbloquea» · §4 ask 4', () => {
    // El servicio deja `unlocks_with` vacío en BLOCKED: solo lo escribe al
    // derivar DEGRADED. Prometer un desbloqueo que nadie declaró es peor que no
    // declararlo.
    const p = adaptPayload({ status: 'BLOCKED', reason: 'Falta el feed' } as WirePayload)
    expect(p).toEqual({ estado: 'BLOQUEADO', razon: 'Falta el feed', desbloqueaCon: '' })
  })

  it('FORBIDDEN pasa `request_from` tal cual, aunque sea una constante', () => {
    // Hoy el servicio manda `"admin"` escrito en el código y no el rol que
    // decide. Mejorarlo acá sería el front inventando a quién pedirle.
    //
    // **Esta prueba decía `"administrator"` y NO PODÍA detectar el cambio**, y
    // eso no es un defecto suyo: suministra el literal y lo afirma, así que
    // verifica el paso-a-través y nada más. Es correcto que lo haga —es lo único
    // que el adaptador promete acá— pero deja escrito quién sí puede detectarlo:
    // `backend-drift`, releyendo la ruta. Lo encontró el 2026-09-28.
    //
    // Por eso el valor es el MEDIDO y no uno cualquiera: si mañana vuelve a
    // moverse, esta línea queda como el registro de contra qué se leyó.
    const p = adaptPayload({ status: 'FORBIDDEN', request_from: 'admin' } as WirePayload)
    // **`razon` y `desbloqueaCon` entran vacíos y eso es correcto** · 2026-09-29.
    // Este fixture no las manda, así que el estado cae a su frase de respaldo.
    //
    // **Y que esta prueba haya fallado al agregarlas es su mérito**: `toEqual`
    // es estricto, así que un campo nuevo en el adaptador la rompe y obliga a
    // mirarlo. Un `toMatchObject` habría dejado pasar el cambio en silencio.
    expect(p).toEqual({
      estado: 'SIN_PERMISO',
      solicitarA: 'admin',
      razon: '',
      desbloqueaCon: '',
    })
  })

  it('ERROR conserva el mensaje del servicio', () => {
    const p = adaptPayload({ status: 'ERROR', message: 'gauge requires options.maximum' } as WirePayload)
    expect(p).toEqual({ estado: 'ERROR', mensaje: 'gauge requires options.maximum' })
  })

  it('un AVAILABLE sin gobierno NO produce una variante a medias', () => {
    // El cable no es una unión discriminada: su struct permite un AVAILABLE sin
    // `governance`. El contrato lo hace imposible de construir, y acá es donde
    // eso se vuelve a cerrar. §1.3: toda cifra lleva procedencia.
    const p = adaptPayload({ status: 'AVAILABLE', value: { shape: 'scalar', v: 1 } } as WirePayload)
    expect(p).toMatchObject({ estado: 'ERROR' })
    expect((p as { mensaje: string }).mensaje).toContain('procedencia')
  })
})

describe('las nueve formas que el backend materializa', () => {
  it('scalar', () => {
    expect(conValor({ shape: 'scalar', v: 4280000 })).toMatchObject({
      valor: { forma: 'escalar', v: 4280000 },
    })
  })

  it('scalar_with_interval · con su banda y su nivel', () => {
    expect(conValor({ shape: 'scalar_with_interval', v: 10, lo: 8, hi: 12, level: 0.95 })).toMatchObject({
      valor: { forma: 'escalarConIntervalo', v: 10, lo: 8, hi: 12, nivel: 0.95 },
    })
  })

  it('scalar_with_interval SIN banda no se publica · regla dura 6', () => {
    // «Prohibida la estimación puntual sin intervalo». El contrato lo hace
    // imposible por tipo; acá se hace imposible por dato.
    const p = conValor({ shape: 'scalar_with_interval', v: 10 })
    expect(p).toMatchObject({ estado: 'ERROR' })
    expect((p as { mensaje: string }).mensaje).toContain('banda')
  })

  it('time_series · `points` → `puntos`', () => {
    expect(conValor({ shape: 'time_series', points: [{ t: 'jul', v: 1 }] })).toMatchObject({
      valor: { forma: 'serieTemporal', puntos: [{ t: 'jul', v: 1 }] },
    })
  })

  it('multi_series · `label` → `etiqueta` en cada serie', () => {
    expect(
      conValor({ shape: 'multi_series', series: [{ label: 'Ventas', points: [{ t: 'jul', v: 2 }] }] }),
    ).toMatchObject({
      valor: { forma: 'seriesMultiples', series: [{ etiqueta: 'Ventas', puntos: [{ t: 'jul', v: 2 }] }] },
    })
  })

  it('categorical · `label` → `etiqueta`', () => {
    expect(conValor({ shape: 'categorical', items: [{ label: 'Tienda', v: 60 }] })).toMatchObject({
      valor: { forma: 'categorica', items: [{ etiqueta: 'Tienda', v: 60 }] },
    })
  })

  it('ranking · `position` → `posicion`', () => {
    expect(
      conValor({ shape: 'ranking', items: [{ label: 'Talla M', v: 2, position: 1 }] }),
    ).toMatchObject({ valor: { forma: 'ranking', items: [{ etiqueta: 'Talla M', v: 2, posicion: 1 }] } })
  })

  it('ranking sin `position` conserva el ORDEN que mandó el backend', () => {
    const p = conValor({ shape: 'ranking', items: [{ label: 'A', v: 9 }, { label: 'B', v: 8 }] })
    expect(p).toMatchObject({
      valor: { items: [{ etiqueta: 'A', posicion: 1 }, { etiqueta: 'B', posicion: 2 }] },
    })
  })

  it('tabular · `key`/`title`/`numeric` → `clave`/`titulo`/`numerica`', () => {
    expect(
      conValor({
        shape: 'tabular',
        columns: [{ key: 'tienda', title: 'Tienda', numeric: false }],
        rows: [{ tienda: 'Polanco' }],
      }),
    ).toMatchObject({
      valor: {
        forma: 'tabular',
        columnas: [{ clave: 'tienda', titulo: 'Tienda', numerica: false }],
        filas: [{ tienda: 'Polanco' }],
      },
    })
  })

  it('prose · `headline`/`pillars`/`value` → `titular`/`pilares`/`valor`', () => {
    expect(
      conValor({
        shape: 'prose',
        headline: 'El inventario cubre 31 días.',
        pillars: [{ label: 'Cobertura', value: '31 d', note: '+2 vs jun' }],
      }),
    ).toMatchObject({
      valor: {
        forma: 'prosa',
        titular: 'El inventario cubre 31 días.',
        pilares: [{ label: 'Cobertura', valor: '31 d', nota: '+2 vs jun' }],
      },
    })
  })

  it('prose sin pilares es una prosa legítima de solo titular', () => {
    // El transformador solo escribe `pillars` con `len > 0`. Un arreglo vacío no
    // es un error: es un resumen sin cifras de apoyo.
    expect(conValor({ shape: 'prose', headline: 'Sin novedades.' })).toMatchObject({
      valor: { forma: 'prosa', pilares: [] },
    })
  })

  it('composition · `parts` → `partes`, con su porcentaje', () => {
    expect(
      conValor({ shape: 'composition', parts: [{ label: 'Meta', v: 10, percentage: 40 }] }),
    ).toMatchObject({
      valor: { forma: 'composicion', partes: [{ etiqueta: 'Meta', v: 10, porcentaje: 40 }] },
    })
  })

  it('composition SIN porcentaje no se deriva · el panel entra en ERROR', () => {
    // El contrato dice por qué con todas las letras: «lo calcula el backend y no
    // el front: la suma tiene que dar 100 y redondear en el cliente produce
    // columnas que suman 99,9». En el cable `percentage` es opcional.
    const p = conValor({ shape: 'composition', parts: [{ label: 'Meta', v: 10 }] })
    expect(p).toMatchObject({ estado: 'ERROR' })
    expect((p as { mensaje: string }).mensaje).toContain('Meta')
  })
})

describe('las formas de v1.1 · el día que llegaron', () => {
  /** **Esta prueba decía «las siete que el backend NO materializa», y estaba
   *  escrita para fallar el día que llegaran** —«si algún día llegan, esta
   *  prueba falla y alguien decide qué se pinta»—. Ese día fue el 2026-09-25.
   *
   *  El backend las emite desde `168a761`, del 2026-09-21. Nadie lo notó por
   *  cuatro días porque el comentario que lo negaba estaba en tres lugares a la
   *  vez —acá, en `adapt.ts` y en el plan— y los tres se escribieron cuando era
   *  cierto. **Lo destapó el equipo de backend contestando un mensaje nuestro**
   *  que afirmaba, con la misma seguridad, que ellos no las producían.
   *
   *  Ahora son tres grupos y no uno, que es lo que el comentario viejo tapaba.
   */
  it('distribution SÍ se adapta · contrato, cuerpo y ahora adaptador', () => {
    expect(
      conValor({ shape: 'distribution', bins: [{ label: '0–10', v: 4 }, { label: '10–20', v: 9 }] }),
    ).toMatchObject({
      valor: {
        forma: 'distribucion',
        cortes: [{ etiqueta: '0–10', v: 4 }, { etiqueta: '10–20', v: 9 }],
      },
    })
  })

  it('y `lo`/`hi` del bin NO se adaptan · el contrato interno no los declara', () => {
    // Traerlos sin que `cortes` los declare sería inventar una forma. Si se los
    // necesita, primero entran al contrato.
    const p = conValor({ shape: 'distribution', bins: [{ label: '0–10', v: 4, lo: 0, hi: 10 }] })
    expect((p as { valor: { cortes: unknown[] } }).valor.cortes[0]).toEqual({
      etiqueta: '0–10',
      v: 4,
    })
  })

  it('una distribución cuyos bins no sirven NO pasa vacía', () => {
    // Sin esto, un `bins` con filas ilegibles produce una distribución de cero
    // cortes: el panel se pinta, no dice nada y nadie se entera. Es preferible
    // el ERROR con su razón. Lo cazó una mutación que quitaba la guarda.
    expect(conValor({ shape: 'distribution', bins: [{ label: 3, v: 'x' }] })).toMatchObject({
      estado: 'ERROR',
    })
    expect(conValor({ shape: 'distribution', bins: [] })).toMatchObject({ estado: 'ERROR' })
  })

  it('series_with_band SÍ se adapta · desde `75b8ecc`, con su nivel', () => {
    // **Lo pedimos el 2026-09-25 y lo hicieron el mismo día.** Antes el cable
    // mandaba los puntos sin `level`, y nuestro contrato lo declara obligatorio:
    // una banda sin su nivel de confianza no se puede leer, 80% y 95% son
    // afirmaciones distintas sobre el mismo pronóstico.
    expect(
      conValor({
        shape: 'series_with_band',
        level: 80,
        points: [{ t: '2026-09', v: 10, lo: 8, hi: 12 }],
      }),
    ).toMatchObject({
      valor: { forma: 'serieConBanda', nivel: 80, puntos: [{ t: '2026-09', v: 10, lo: 8, hi: 12 }] },
    })
  })

  it('sin `level` NO se adapta · no se inventa el nivel del intervalo', () => {
    const p = conValor({
      shape: 'series_with_band',
      points: [{ t: '2026-09', v: 10, lo: 8, hi: 12 }],
    })
    expect(p).toMatchObject({ estado: 'ERROR' })
  })

  it('y un punto SIN banda tumba el pronóstico entero · regla dura', () => {
    // «Prohibida la estimación puntual sin intervalo. Un pronóstico sin banda no
    // se publica.» Dibujar el punto sin su banda sería publicar exactamente lo
    // que la regla prohíbe, así que el panel entra en ERROR con su razón.
    const p = conValor({
      shape: 'series_with_band',
      level: 80,
      points: [
        { t: '2026-09', v: 10, lo: 8, hi: 12 },
        { t: '2026-10', v: 11 },
      ],
    })
    expect(p).toMatchObject({ estado: 'ERROR' })
    expect((p as { mensaje: string }).mensaje).toMatch(/intervalo/i)
  })

  /* ── LAS TRES QUE SE ADAPTARON EL 2026-09-30 · F4.17, F4.18 y F4.19 ─────────
   *
   *  **Los fixtures son la salida REAL**, recortada: se capturaron de
   *  `dd_panel_data` del servicio local después de correr las tres métricas que
   *  escribimos en `MetricRegistry` contra Snowflake. Se recortan las filas, no
   *  los campos — un fixture inventado verifica el fixture, que es la regla de
   *  este repositorio y ya corrigió tres fixtures el 2026-09-04.
   *
   *  Acá había un `it.each` de CINCO afirmando que ninguna se adaptaba. Tres
   *  pasaron a adaptarse y **el caso negativo se movió a las dos que quedan** en
   *  vez de borrarse: es el patrón que apareció tres veces el 2026-09-29 —un
   *  ejemplo «no dibujado» que pasa a dibujarse deja la prueba verde verificando
   *  nada—. */

  it('compared_categorical · `reference` ausente NO se rellena y `delta` NO se deriva', () => {
    // Las tres primeras filas de `platform_gap`, período 2026-09. La tercera es
    // la que enseña: quince de los 37 ítems reales llegan SIN `reference`
    // —plataformas con retorno atribuido y sin costo, avisado a datos— y con un
    // `?? 0` habrían salido con la brecha entera como delta.
    const p = conValor({
      shape: 'compared_categorical',
      items: [
        { label: 'Google PMax', v: 502449.76, reference: 85134.28, delta: 417315.48 },
        { label: 'MGID', v: 221.48, reference: 7842.45, delta: -7620.97 },
        { label: 'YouTube', v: 12455.52 },
      ],
    })
    expect(p).toMatchObject({ estado: 'DISPONIBLE' })
    const valor = (p as { valor: unknown }).valor as {
      forma: string
      items: Record<string, unknown>[]
    }
    expect(valor.forma).toBe('categoricaComparada')
    expect(valor.items[0]).toEqual({
      etiqueta: 'Google PMax',
      v: 502449.76,
      referencia: 85134.28,
      delta: 417315.48,
    })
    // El delta NEGATIVO pasa como vino: es el signo lo que comunica la dirección
    // —regla dura 3— y un `Math.abs` acá borraría que la plataforma no llegó.
    expect(valor.items[1]).toMatchObject({ delta: -7620.97 })
    // **Las CLAVES, no el valor**: `referencia: undefined` pasaría un
    // `toMatchObject` y es exactamente lo que no debe estar, porque
    // `PlotDumbbell` decide con `i.referencia === undefined`.
    expect(Object.keys(valor.items[2] ?? {}).sort()).toEqual(['etiqueta', 'v'])
  })

  it('matrix · `null` es «sin dato» y sobrevive al adaptador', () => {
    // Cuatro celdas de `platform_month_matrix`: `Criteo` con inversión los dos
    // meses, `Adsmovil` con el segundo en `null` —la plataforma no existía—. La
    // distinción es la que ya costó en A5 y en A1.
    const p = conValor({
      shape: 'matrix',
      rows: ['Criteo', 'Adsmovil'],
      columns: ['2025-10', '2025-11'],
      cells: [
        [7933.11, 1939.7],
        [1766.49, null],
      ],
    })
    const valor = (p as { valor: unknown }).valor as { forma: string; celdas: unknown[][] }
    expect(valor.forma).toBe('matriz')
    expect(valor.celdas[1]).toEqual([1766.49, null])
  })

  it('matrix · una celda que no es cifra ni `null` invalida la matriz ENTERA', () => {
    // No se convierte a `null`: eso le atribuiría al negocio un hueco que es del
    // productor del dato, y el panel diría «sin dato» donde hay un payload mal
    // formado.
    const p = conValor({
      shape: 'matrix',
      rows: ['Criteo'],
      columns: ['2025-10', '2025-11'],
      cells: [[7933.11, 'n/d']],
    })
    expect(p).toMatchObject({ estado: 'ERROR' })
    expect((p as { mensaje: string }).mensaje).toMatch(/celda/i)
  })

  it('matrix · una etiqueta que no es cadena invalida la lista, no se descarta', () => {
    // Descartarla correría las etiquetas contra las celdas: la matriz se vería
    // perfecta con los rótulos cambiados de lugar.
    const p = conValor({
      shape: 'matrix',
      rows: ['Criteo'],
      columns: ['2025-10', 11],
      cells: [[1, 2]],
    })
    expect(p).toMatchObject({ estado: 'ERROR' })
  })

  it('matrix · la DENSIDAD no la comprueba el adaptador · la declara el cuerpo', () => {
    // Una matriz rala pasa por acá y `MatrixBody` la explica con cuántas faltan.
    // Rechazarla acá la sacaría del layout con «forma inválida», que no dice nada.
    const p = conValor({
      shape: 'matrix',
      rows: ['Criteo', 'Adsmovil'],
      columns: ['2025-10', '2025-11'],
      cells: [[7933.11, 1939.7]],
    })
    expect(p).toMatchObject({ estado: 'DISPONIBLE' })
  })

  it('flow · etapas y enlaces, con los nombres del contrato interno', () => {
    // Tres enlaces de `spend_flow`, todos hacia el único nodo `total`, que es la
    // forma que la consulta produce: cada plataforma aporta su inversión.
    const p = conValor({
      shape: 'flow',
      stages: [
        { id: 'Dailymotion', label: 'Dailymotion', v: 1883185 },
        { id: 'TikTok', label: 'TikTok', v: 18358.88 },
        { id: 'total', label: 'Total invertido', v: 1901543.88 },
      ],
      links: [
        { from: 'Dailymotion', to: 'total', v: 1883185 },
        { from: 'TikTok', to: 'total', v: 18358.88 },
      ],
    })
    const valor = (p as { valor: unknown }).valor as {
      forma: string
      etapas: Record<string, unknown>[]
      enlaces: Record<string, unknown>[]
    }
    expect(valor.forma).toBe('flujo')
    expect(valor.etapas[0]).toEqual({ id: 'Dailymotion', etiqueta: 'Dailymotion', v: 1883185 })
    expect(valor.enlaces[1]).toEqual({ desde: 'TikTok', hacia: 'total', v: 18358.88 })
  })

  it('flow · una etapa sin `label` se descarta y NO cae al `id`', () => {
    // Ese respaldo lo hace el BACKEND —está escrito en el esquema de
    // `ValorGrafo`— y repetirlo acá taparía que dejó de hacerlo.
    const p = conValor({
      shape: 'flow',
      stages: [
        { id: 'a', v: 1 },
        { id: 'b', label: 'B', v: 2 },
      ],
      links: [{ from: 'a', to: 'b', v: 1 }],
    })
    const valor = (p as { valor: unknown }).valor as { etapas: { id: string }[] }
    expect(valor.etapas.map((e) => e.id)).toEqual(['b'])
  })

  it.each(['multi_attribute_profile', 'graph'])(
    '%s NO se adapta · ninguno de sus gráficos está construido',
    (shape) => {
      // **Las dos que quedan, y cada una por su razón.**
      // `multi_attribute_profile` tiene un solo gráfico en el repertorio —`radar`—
      // y `PlotRadar` no existe. `graph` tampoco tiene gráfico Y además no tiene
      // de dónde salir: ninguna columna de las dos tablas Gold trae aristas
      // origen→destino, medido el 2026-09-29.
      //
      // Una forma adaptada sin cuerpo que la dibuje es un panel en blanco sin
      // razón, que es lo que este rechazo evita.
      const p = conValor({ shape })
      expect(p).toMatchObject({ estado: 'ERROR' })
      expect((p as { mensaje: string }).mensaje).toContain(shape)
    },
  )
})

describe('presentación', () => {
  it('traduce el medidor y el comparativo', () => {
    const p = adaptPayload({
      status: 'AVAILABLE',
      governance,
      value: { shape: 'scalar', v: 1 },
      presentation: {
        label: 'USD · TOTAL',
        meter: { label: 'PESO DE PERFORMANCE', percentage: 61, note: 'USD 2.61M DE USD 4.28M' },
        comparative: [{ label: 'VS MES ANTERIOR', delta: 6.4 }],
      },
    } as WirePayload)

    expect(p).toMatchObject({
      presentacion: {
        label: 'USD · TOTAL',
        medidor: { label: 'PESO DE PERFORMANCE', porcentaje: 61, nota: 'USD 2.61M DE USD 4.28M' },
        comparativo: [{ label: 'VS MES ANTERIOR', delta: 6.4 }],
      },
    })
  })

  it('sin presentación no se declara la clave, y no se inventa un rótulo', () => {
    // El servicio solo la emite para las dos formas escalares: un panel de
    // barras o de tabla llega sin rótulo, y «ningún número desnudo» es regla
    // dura. Es §4 ask 13, y acá no se compensa.
    expect(conValor({ shape: 'categorical', items: [] })).not.toHaveProperty('presentacion')
  })
})

describe('los nombres de los params · F1.41', () => {
  const panelConOpciones = (options: Record<string, unknown>): WireTabWithPanels => ({
    tab: { id: 'tab-1', name: 'T', key: 't', operational_question: '¿?', sort_order: 1, icon: '', chat_suggestions: [] },
    panels: [
      { id: 'p-1', metric_id: 'm-1', type: 'gauge', col_start: 1, col_span: 3, row_span: 4, options, note: '', chart: '' },
    ],
  })

  it('`maximum` llega como `maximo` · el caso que lo hacía urgente', () => {
    // Sin traducir, `validateParams` no encuentra `maximum` en `PARAM_SCHEMAS`,
    // lo descarta por desconocido, y **`GaugeBody` dibuja el arco contra su
    // default**: el panel se ve bien mostrando otra cosa. El backend además lo
    // EXIGE —`gauge requires options.maximum`—, así que siempre llega.
    expect(adaptTab(panelConOpciones({ maximum: 100 })).panels[0]?.opciones).toEqual({
      maximo: 100,
    })
  })

  it('traduce los trece nombres que el cable usa', () => {
    const cable = {
      comparative: 1, meter: 2, pillars: 3, normalization: 4, cut: 5, order: 6,
      columns: 7, band: 8, maximum: 9, horizon: 10, cap: 11, window: 12, bins: 13,
    }
    expect(Object.keys(adaptTab(panelConOpciones(cable)).panels[0]?.opciones ?? {})).toEqual([
      'comparativo', 'medidor', 'pilares', 'normalizacion', 'corte', 'orden',
      'columnas', 'banda', 'maximo', 'horizonte', 'tope', 'ventana', 'bins',
    ])
  })

  it('`cut` se traduce y `cuts` NO · un plural de diferencia', () => {
    // `cut` es de `series` y `forecast`; `cuts` es de `composition` y ningún
    // cuerpo nuestro lo lee. Traducir el plural por descuido pondría un valor
    // donde el cuerpo espera otro.
    const o = adaptTab(panelConOpciones({ cut: 3, cuts: ['a'] })).panels[0]?.opciones
    expect(o).toEqual({ corte: 3, cuts: ['a'] })
  })

  it('un param sin contraparte pasa SIN TOCAR, para que se reporte', () => {
    // `brand`, `components`, `stats`… son del cable y ningún cuerpo nuestro los
    // lee. Descartarlos acá en silencio sería peor: el panel se vería igual y
    // quien compone no sabría por qué su opción no hace nada. Pasan crudos y
    // `validateParams` los marca desconocidos.
    expect(adaptTab(panelConOpciones({ components: 3 })).panels[0]?.opciones).toEqual({
      components: 3,
    })
  })

  it('`paramsDisponibles` se traduce con LA MISMA tabla', () => {
    // `validateParams` exige que el param esté en el esquema Y en esta lista.
    // Traducir un lado y no el otro haría que todo saliera desconocido — que es
    // el mismo síntoma que no traducir nada, y más difícil de encontrar.
    const [b] = adaptBlocks([
      {
        type: 'gauge', ui_name: 'Medidor', accepted_shapes: ['scalar'],
        col_span_min: 3, col_span_max: 7, row_span_min: 4, row_span_max: 4,
        layout_params: ['band', 'components', 'maximum'],
      },
    ])
    expect(b?.paramsDisponibles).toEqual(['banda', 'components', 'maximo'])
  })
})

/* ── F3.7 · los hilos del chat ─────────────────────────────────────────────── */

describe('adaptThread · los dos ids y las cadenas vacías', () => {
  const crudo = {
    id: 'uuid-del-hilo',
    thread_id: 41,
    thread_name: 'hilo del agente',
    agent_id: 'a-1',
    agent_name: 'UA MX',
    role: 'Planner',
    first_message_preview: '¿Por qué cayó la venta?',
    panel_id: 'p-kpi',
    period: '2026-07',
    metric_name: 'Venta diaria',
    metric_key: 'k_kpi',
    tab_name: 'Inventory & Shopping',
    created_at: '2026-07-10T12:00:00Z',
    updated_at: '2026-07-10T12:00:00Z',
  } as unknown as WireChatThread

  it('los DOS ids se conservan por separado', () => {
    // Fundirlos daría un 400 la mitad de las veces y un 404 la otra: `id` pide
    // los mensajes del hilo, `hiloId` continúa la conversación.
    const h = adaptThread(crudo)
    expect(h.id).toBe('uuid-del-hilo')
    expect(h.hiloId).toBe('41')
  })

  it('`titulo` sale de la primera pregunta, NO del nombre del hilo', () => {
    // `thread_name` es el nombre del lado del agente. El contrato pide para el
    // riel «la primera pregunta, tal cual».
    expect(adaptThread(crudo).titulo).toBe('¿Por qué cayó la venta?')
  })

  it('la CADENA VACÍA del cable se traduce a `null`', () => {
    // El cable declara `omitempty` sobre `string`, así que manda `''` donde el
    // contrato declara `null`. Sin traducir, el riel pinta un rótulo sin texto.
    const h = adaptThread({ ...crudo, period: '', metric_name: '', tab_name: '' } as WireChatThread)
    expect(h.periodo).toBeNull()
    expect(h.metricaNombre).toBeNull()
    expect(h.pestanaNombre).toBeNull()
  })

  it('`esDecision` cae a `false` · el valor A PRUEBA DE FALLO', () => {
    // C4 no existe en este servicio. Marcarlo como decisión sin serlo lo
    // volvería imborrable en una pantalla que todavía no está escrita.
    expect(adaptThread(crudo).esDecision).toBe(false)
  })
})

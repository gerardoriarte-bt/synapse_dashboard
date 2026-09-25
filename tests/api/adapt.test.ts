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
  user: { id: 'u-1', email: 'ana@uamx.test', first_name: 'Ana', last_name: 'Ruiz' },
  tenant: { id: 't-1', name: 'Under Armour México' },
  role: { id: 'r-1', name: 'Planner' },
  tabs: [
    { id: 'tab-1', name: 'Inventario', operational_question: '¿Tenemos stock?', sort_order: 2 },
  ],
  periods: ['2026-08', '2026-W32', '2026-08-15'],
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
  semantic_direction: 'HIGHER_IS_BETTER',
  min_grain: 'month',
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
    expect(ctx.user.preferencias).toBeUndefined()
    expect(ctx.tenant.vertical).toBe('')
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

  it('la VENTANA llega vacía porque el cable no la manda · B1.25', () => {
    // Es la otra mitad de la BASE. No se deriva del período: dos métricas con el
    // mismo `2026-08` pueden tener ventanas distintas.
    const { metrics } = adaptCatalog([metrica])
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

  it('una forma que el backend no materializa tampoco pasa', () => {
    // `distribution` está en el enum del contrato y NO en el `switch` del
    // materializador: llegaría al catálogo y fallaría dos pasos después.
    const { metrics, rejected } = adaptCatalog([{ ...metrica, shape: 'distribution' }])

    expect(metrics).toHaveLength(0)
    expect(rejected[0]?.razon).toContain('distribution')
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
    // A las nueve que el backend materializa y no a las dieciséis del enum:
    // ofrecer una forma que ningún payload trae es una promesa vacía.
    expect(b?.formasAceptadas).toHaveLength(9)
    expect(b?.formasAceptadas).toContain('escalar')
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

  it('que el BLOQUE nombre una forma no la hace materializable · son dos puertas', () => {
    // El servicio dice que `distribution` acepta la forma `distribution`, y el
    // bloque la nombra. Pero una MÉTRICA con esa forma sigue sin entrar al
    // catálogo, porque `transform.go` no la escribe en `panel_data`.
    //
    // Las dos afirmaciones van juntas a propósito. Hasta el 2026-09-15 eran una
    // sola tabla —la forma se rechazaba por no tener nombre de cable—, y la
    // tentación de volver a juntarlas es exactamente lo que esta prueba impide.
    const [b] = adaptBlocks([{ ...bars, type: 'distribution', accepted_shapes: ['distribution'] }])
    expect(b?.formasAceptadas).toEqual(['distribucion'])

    const { metrics, rejected } = adaptCatalog([{ ...metrica, shape: 'distribution' }])
    expect(metrics).toHaveLength(0)
    expect(rejected[0]?.razon).toContain('todavía no materializa')
  })
})

describe('pestaña con paneles', () => {
  const wire: WireTabWithPanels = {
    tab: { id: 'tab-1', name: 'Inventario', operational_question: '¿Stock?', sort_order: 1 },
    panels: [
      {
        id: 'p-1',
        metric_id: 'm-1',
        type: 'kpi',
        col_start: 5,
        col_span: 4,
        row_span: 3,
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
        { id: 'p-2', metric_id: 'm-1', type: 'kpi', col_start: 1, col_span: 3, row_span: 4 },
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
    // Hoy el servicio manda `"administrator"` escrito en el código y no el rol
    // que decide. Mejorarlo acá sería el front inventando a quién pedirle.
    const p = adaptPayload({ status: 'FORBIDDEN', request_from: 'administrator' } as WirePayload)
    expect(p).toEqual({ estado: 'SIN_PERMISO', solicitarA: 'administrator' })
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

  it('series_with_band NO se adapta todavía · y la razón NO es que no llegue', () => {
    // El contrato declara `nivel` obligatorio en `ValorSerieConBanda` y el cable
    // no lo manda. Una banda sin su nivel de confianza no se puede leer: 80% y
    // 95% son afirmaciones distintas. Adaptarla hoy sería inventar el número.
    const p = conValor({ shape: 'series_with_band', points: [{ t: '2026-09', v: 10, lo: 8, hi: 12 }] })
    expect(p).toMatchObject({ estado: 'ERROR' })
  })

  it.each([
    'compared_categorical',
    'multi_attribute_profile',
    'matrix',
    'graph',
    'flow',
  ])('%s no se adapta · `Valor` no declara su esquema · F4.17–F4.19', (shape) => {
    // **Estas cinco sí siguen bloqueadas, y el candado se verificó el
    // 2026-09-25**: el contrato las nombra en la unión `Forma` y no declara el
    // objeto de ninguna. No es que no lleguen: es que no hay dónde ponerlas.
    const p = conValor({ shape })
    expect(p).toMatchObject({ estado: 'ERROR' })
    expect((p as { mensaje: string }).mensaje).toContain(shape)
  })
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
    tab: { id: 'tab-1', name: 'T', operational_question: '¿?', sort_order: 1 },
    panels: [
      { id: 'p-1', metric_id: 'm-1', type: 'gauge', col_start: 1, col_span: 3, row_span: 4, options },
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

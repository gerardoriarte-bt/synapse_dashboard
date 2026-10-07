/** B4 · Binder de métrica · F4.10
 *
 *  §7.2: «**El corazón del control de calidad.** Elegido el tipo de panel, lista
 *  **solo** las métricas del catálogo compatibles con su forma. Las incompatibles
 *  aparecen listadas y deshabilitadas **con la razón** ("requiere serie temporal ·
 *  esta métrica es categórica"). **El rechazo explicado es lo que enseña el
 *  sistema.**»
 *
 *  Esa última frase es la que decide la pantalla. Filtrar las incompatibles sería
 *  más corto y más limpio, **y no enseñaría nada**: quien compone aprendería que
 *  «esa métrica no aparece» en vez de que un medidor no dibuja una serie. Así que
 *  aparecen todas, en el mismo orden, y las que no sirven dicen por qué.
 *
 *  ── DE DÓNDE SALE CADA REGLA, QUE NO ES EL MISMO LADO ───────────────────────
 *
 *  | | Quién manda |
 *  |---|---|
 *  | Qué formas acepta un tipo | `/config/blocks` · la tabla del backend |
 *  | Qué rangos de span | La misma tabla |
 *  | Qué params EXISTEN por tipo | La misma tabla · `paramsDisponibles` |
 *  | Qué VALORES acepta cada param | `PARAM_SCHEMAS`, del front |
 *
 *  La última fila es una duplicación declarada, no un descuido: `/config/blocks`
 *  manda los nombres y nada más. `api/params.ts` lo explica y hay propuesta de
 *  spec en B0.9. Acá se muestra lo que el validador acepta —`describirParam`—,
 *  no una descripción escrita a mano: si el esquema suma un valor, la pantalla lo
 *  dice sola.
 *
 *  ── LO QUE SE EDITA Y LO QUE SOLO SE DECLARA ────────────────────────────────
 *
 *  Un param de tipo `enum`, `number` o `string` se edita. Los de `array` y
 *  `object` **no**, y no es lo mismo que un param sin esquema: acá el esquema
 *  existe, pero son estructuras —`columnas` es una lista de definiciones de
 *  columna, `banda` un objeto con umbrales—. Un textarea de JSON compilaría y
 *  sería la peor salida: el error aparecería al publicar.
 *
 *  ── LO QUE §7.2 PIDE Y NO ESTÁ ──────────────────────────────────────────────
 *
 *  «Debajo, los parámetros del panel: ventana, corte, **dimensión de
 *  desagregación**, orden, límite de filas. Todos acotados por lo que la métrica
 *  declara en `dimensiones[]`.» Los cuatro primeros existen repartidos entre los
 *  tipos; **el de desagregación no existe en ningún esquema**, y `dimensiones[]`
 *  hoy alimenta el drill-down de F5.4 y nada más. Se declara.
 *
 *  ── Y COLOCAR NO ES DE ACÁ ──────────────────────────────────────────────────
 *
 *  `colStart` no se edita. §7.2 lo pone en B2 —el canvas, F4.9— y un número
 *  elegido en un formulario es una columna que nadie eligió mirando.
 *
 *  ── DESDE EL 2026-10-06 ES EL INSPECTOR DEL CANVAS ──────────────────────────
 *
 *  Vivía al fondo de «Contexto de edición», dos alturas de scroll debajo del
 *  chip que lo abría, y el canvas —donde el panel está a la vista— no podía
 *  cambiarle ni la métrica ni el tipo. D1 y D2 de
 *  `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`: ahora se abre al
 *  costado del lienzo al elegir un panel, y es el único lugar donde se configura.
 *
 *  Y habla en los tres registros: rótulo para nombrar, frase para explicar,
 *  caja para lo que se toca. Los ids del contrato —`bars`, `escalarConIntervalo`—
 *  se nombran con `rotulos.ts` (D6).
 *
 *  ── **EN COLUMNAS QUE SE ABREN** · decisión humana del 2026-10-07 ─────────
 *
 *  «El panel de la derecha que se abre no lo veo bien jerarquizado e
 *  intuitivo», y sobre la forma (D6): «una serie de columnas que se van abriendo
 *  según la profundidad … la idea es no perder de vista el lienzo». Ver §4 de
 *  `docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`.
 *
 *  - **La primera columna resume el panel**: su título es la MÉTRICA, debajo
 *    cómo se ve y su tamaño, arriba lo que impide publicar, y tres filas que
 *    abren la segunda columna — **Qué muestra · Cómo se ve · Ajustes**.
 *  - **«Cómo se ve» junta Tipo y Gráfico** (D7). Medido el 2026-10-07 contra
 *    `/config/blocks` y `/config/plots`: 17 de los 49 gráficos sirven a más de
 *    un tipo, así que el tipo no se deduce del gráfico. Con la métrica elegida
 *    la forma queda fija y los tipos posibles son uno o dos: se muestran como
 *    GRUPOS, y elegir un dibujo dentro de un grupo fija los dos.
 *  - **Cada gráfico se dibuja con el dato real de la métrica** · B3 pedía
 *    «preview real» y el espécimen que faltaba es ese dato.
 *  - **Elegir una métrica de otra forma cambia el tipo**, y la lista lo dice
 *    antes: «se va a dibujar como …». El rechazo sigue explicado —ahora explica
 *    qué va a pasar en vez de prohibir—, y sin esto «qué muestra» primero
 *    obligaría a elegir el dibujo antes que el dato.
 *
 *  **§PEN:B4** · B4 · «Binder de métrica». **§PEN:B3** · B3 · «Selector de
 *  gráfico», desde el 2026-10-07 en la columna «Cómo se ve».
 */
import { Label } from '../../render/primitives/Label'
import { Note } from '../../render/primitives/Note'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { Opcion } from '../../render/primitives/Opcion'
import { invalidReason } from '../../catalog/blocks'
import { invalidPlotReason } from '../../catalog/plots'
import { hasValue } from '../../render/state'
import { PARAM_SCHEMAS, describirParam } from '../../api/params'
import { MuestraDeGrafico } from './MuestraDeGrafico'
import { tipoPara } from './tipoPara'
import { descripcionDeTipo, nombreDeForma, nombreDeTipo } from './rotulos'
import type { ChartId, Plot } from '../../catalog/types'
import type { BlockTable } from '../../catalog/blocks'
import type { PlotTable } from '../../catalog/plots'
import type { Formatter } from '../../render/format'
import type { Block, Metric, PanelType, Payload } from '../../api/types'
import type { PanelDeBorrador } from './borrador'
import type { ProblemaLocal } from './validar'

export type Profundidad = 'metrica' | 'grafico' | 'ajustes'

type Props = {
  panel: PanelDeBorrador
  bloques: readonly Block[]
  tabla: BlockTable
  metrics: readonly Metric[]
  /** Elegir la métrica · si su forma no entra en el tipo actual, el contenedor
   *  cambia el tipo al que la dibuja · ver `tipoPara`. */
  onMetrica: (metricId: string) => void
  /** «Cómo se ve» · el tipo y el gráfico juntos. `undefined` es el de por
   *  defecto del tipo. */
  onComoSeVe: (tipo: string, grafico: ChartId | undefined) => void
  onSpan: (campo: 'colSpan' | 'rowSpan', valor: number) => void
  /** `undefined` borra la opción · ver `editarOpcion`. */
  onOpcion: (nombre: string, valor: unknown) => void
  /** El repertorio, de `/config/plots`. Vacío deja «Cómo se ve» con los tipos
   *  y sin gráficos para elegir. */
  plots: readonly Plot[]
  repertorio: PlotTable
  /** El dato de la métrica del panel, para dibujar las opciones · `undefined`
   *  mientras no hay. */
  payload: Payload | undefined
  format: Formatter
  /** Los de ESTE panel, ya calculados · una sola corrida de `validarBorrador`. */
  problemas: readonly ProblemaLocal[]
  onQuitar: () => void
  onCerrar: () => void
  /** **La profundidad abierta es del contenedor** · el lienzo la necesita para
   *  volver a traer el panel a la vista cuando la segunda columna lo corre. */
  abierta: Profundidad | null
  onAbrir: (p: Profundidad | null) => void
}

const CAMPO = 'h-8 bg-w1 text-ink text-cuerpo rounded-md px-3 border border-w5'

/** **Las columnas quedan a la vista** mientras el lienzo se recorre: fijas bajo
 *  la cabecera, con su propio scroll si son más altas que la pantalla. */
const FIJA =
  'sticky top-[calc(var(--alto-cabecera-builder,0px)+16px)] max-h-[calc(100vh-var(--alto-cabecera-builder,0px)-32px)] overflow-y-auto'

export function PanelConfigurator({
  panel,
  bloques,
  tabla,
  metrics,
  onMetrica,
  onComoSeVe,
  onSpan,
  onOpcion,
  plots,
  repertorio,
  payload,
  format,
  problemas,
  onQuitar,
  onCerrar,
  abierta,
  onAbrir: setAbierta,
}: Props) {
  const tipo = panel.tipo as PanelType
  const bloque = tabla.get(tipo)
  const metrica = metrics.find((m) => m.id === panel.metricId)
  const esquema = PARAM_SCHEMAS[tipo] ?? {}
  const nombreDelGrafico = (id: string) => plots.find((p) => p.id === id)?.nombre ?? id
  const comoSeVe =
    panel.grafico === undefined ? `${nombreDeTipo(panel.tipo)} · por defecto` : nombreDelGrafico(panel.grafico)
  const opcionesElegidas = Object.keys(panel.opciones ?? {}).length

  const filas: { id: Profundidad; n: number; titulo: string; valor: string }[] = [
    { id: 'metrica', n: 1, titulo: 'Qué muestra', valor: metrica?.nombre ?? 'Sin elegir' },
    { id: 'grafico', n: 2, titulo: 'Cómo se ve', valor: comoSeVe },
    {
      id: 'ajustes',
      n: 3,
      titulo: 'Ajustes',
      valor: `${String(panel.colSpan)} × ${String(panel.rowSpan)}${opcionesElegidas > 0 ? ` · ${String(opcionesElegidas)} opción(es)` : ''}`,
    },
  ]

  return (
    // **Las columnas se abren hacia el lienzo y no lo tapan**: ocupan el lugar
    // de la biblioteca y lo corren, y el lienzo trae el panel elegido a la
    // vista · D6.
    <div
      // **Tan alto como el lienzo** (`self-stretch`): sin recorrido, las
      // columnas `sticky` no tienen dónde quedarse fijas —medido el 2026-10-07,
      // se iban con la página—.
      className="flex shrink-0 items-start self-stretch"
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        // Escape cierra de a una profundidad: primero la segunda columna.
        if (abierta !== null) setAbierta(null)
        else onCerrar()
      }}
    >
      {/* ── 1 · EL PANEL ──────────────────────────────────────────────── */}
      <aside aria-label="Configuración del panel" className={`flex w-75 shrink-0 flex-col gap-5 pr-5 ${FIJA}`}>
        <div className="flex items-center gap-2">
          <Label as="div">Panel</Label>
          {panel.id === undefined && <Label as="div">Nuevo · se crea al guardar</Label>}
          <div className="ml-auto">
            <Accion tamano="compacta" onClick={onCerrar} etiqueta="Cerrar la configuración del panel">
              Cerrar
            </Accion>
          </div>
        </div>

        {/* **El título es lo que el panel MUESTRA**, no el bloque que lo
            dibuja: «Cumplimiento de objetivo», no «Barras». */}
        <div className="flex flex-col gap-1">
          <h2 className="m-0 font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
            {metrica?.nombre ?? 'Panel sin métrica'}
          </h2>
          <Ayuda>{`${comoSeVe} · ${String(panel.colSpan)} × ${String(panel.rowSpan)}`}</Ayuda>
        </div>

        {/* **Lo que impide publicar, ARRIBA** · estaba al final, después de
            las opciones. */}
        {problemas.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md border border-w4 p-3">
            <Label as="div">{problemas.length === 1 ? 'Falta para publicar' : `${String(problemas.length)} cosas faltan para publicar`}</Label>
            {problemas.map((p) => (
              <Ayuda key={p.campo}>{p.mensaje}</Ayuda>
            ))}
          </div>
        )}

        <nav aria-label="Qué configurar" className="flex flex-col gap-2">
          {filas.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-expanded={abierta === f.id}
              onClick={() => setAbierta(abierta === f.id ? null : f.id)}
              className={
                'flex w-full cursor-pointer items-center gap-3 rounded-md border border-l-2 px-3 py-2.5 text-left hover:bg-w2 ' +
                (abierta === f.id ? 'border-w4 border-l-acc bg-w2' : 'border-w4 border-l-w4 bg-transparent')
              }
            >
              <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-w5 font-body text-celda font-semibold text-ink">
                {f.n}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-body text-cuerpo font-semibold text-ink">{f.titulo}</span>
                <span className="truncate font-body text-celda text-dim">{f.valor}</span>
              </span>
              {/* `chevron-right` · dice que abre otra columna. */}
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-dim">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ))}
        </nav>

        <div>
          <Accion variante="peligro" tamano="compacta" onClick={onQuitar}>
            Quitar panel
          </Accion>
        </div>
      </aside>

      {/* ── 2 · LA PROFUNDIDAD ELEGIDA ─────────────────────────────────── */}
      {abierta !== null && (
        <section
          aria-label={filas.find((f) => f.id === abierta)?.titulo}
          className={`flex w-95 shrink-0 flex-col gap-4 border-l border-w4 px-5 ${FIJA}`}
        >
          <div className="flex items-center gap-2">
            <span className="font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
              {filas.find((f) => f.id === abierta)?.titulo}
            </span>
            <div className="ml-auto">
              <Accion tamano="compacta" onClick={() => setAbierta(null)} etiqueta="Cerrar esta columna">
                Listo
              </Accion>
            </div>
          </div>

          {abierta === 'metrica' && (
            <QueMuestra
              panel={panel}
              bloques={bloques}
              tabla={tabla}
              metrics={metrics}
              onMetrica={(id) => {
                onMetrica(id)
                // **Elegida la métrica, lo que sigue es cómo se ve.**
                setAbierta('grafico')
              }}
            />
          )}

          {abierta === 'grafico' && (
            <ComoSeVe
              panel={panel}
              bloques={bloques}
              metrica={metrica}
              plots={plots}
              repertorio={repertorio}
              payload={payload}
              format={format}
              onComoSeVe={onComoSeVe}
              onIrAMetrica={() => setAbierta('metrica')}
            />
          )}

          {abierta === 'ajustes' && (
            <>
              {bloque !== undefined && (
                <section className="flex flex-col gap-2">
                  <Label as="div">Tamaño</Label>
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1">
                      <Label id="panel-columnas" as="div">
                        {`Columnas · ${String(bloque.colSpanMin)} a ${String(bloque.colSpanMax)}`}
                      </Label>
                      <input
                        type="number"
                        aria-labelledby="panel-columnas"
                        value={panel.colSpan}
                        min={bloque.colSpanMin}
                        max={bloque.colSpanMax}
                        onChange={(e) => onSpan('colSpan', Number(e.target.value))}
                        className={`${CAMPO} w-24`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label id="panel-filas" as="div">
                        {`Filas · ${String(bloque.rowSpanMin)} a ${String(bloque.rowSpanMax)}`}
                      </Label>
                      <input
                        type="number"
                        aria-labelledby="panel-filas"
                        value={panel.rowSpan}
                        min={bloque.rowSpanMin}
                        max={bloque.rowSpanMax}
                        onChange={(e) => onSpan('rowSpan', Number(e.target.value))}
                        className={`${CAMPO} w-24`}
                      />
                    </div>
                  </div>
                  <Ayuda>También se cambia en el lienzo, con los controles del panel elegido. La posición, arrastrándolo.</Ayuda>
                </section>
              )}

              <section className="flex flex-col gap-3">
                <Label as="div">Opciones de este tipo</Label>
            {bloque?.paramsDisponibles === undefined || bloque.paramsDisponibles.length === 0 ? (
              <Ayuda>Este tipo no tiene opciones.</Ayuda>
            ) : (
              bloque.paramsDisponibles.map((nombre) => {
                const spec = esquema[nombre]
                const valor = panel.opciones?.[nombre]
                const id = `opcion-${nombre}`

                if (spec === undefined || spec.kind === 'array' || spec.kind === 'object') {
                  // Sin esquema, o una estructura que un campo suelto no puede
                  // editar sin volverse un textarea de JSON. Se nombra y se dice.
                  return (
                    <div key={nombre} className="flex flex-col gap-1">
                      <Label as="div">{nombre}</Label>
                      <Ayuda>Esta opción todavía no se puede editar desde acá.</Ayuda>
                    </div>
                  )
                }

                if (spec.kind === 'boolean') {
                  // **Un sí o no se elige, no se escribe** · antes era un campo de
                  // texto que pedía «true» o «false».
                  return (
                    <div key={nombre} className="flex flex-col gap-1">
                      <Label id={id} as="div">
                        {nombre}
                      </Label>
                      <div className="flex gap-2" role="group" aria-labelledby={id}>
                        <Opcion elegida={valor === undefined} onClick={() => onOpcion(nombre, undefined)} etiqueta={`${nombre} · por defecto`}>
                          Por defecto
                        </Opcion>
                        <Opcion elegida={valor === true} onClick={() => onOpcion(nombre, true)} etiqueta={`${nombre} · sí`}>
                          Sí
                        </Opcion>
                        <Opcion elegida={valor === false} onClick={() => onOpcion(nombre, false)} etiqueta={`${nombre} · no`}>
                          No
                        </Opcion>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={nombre} className="flex flex-col gap-1">
                    <Label id={id} as="div">
                      {nombre}
                    </Label>
                    {spec.kind === 'enum' ? (
                      <select
                        aria-label={nombre}
                        value={typeof valor === 'string' ? valor : ''}
                        onChange={(e) => onOpcion(nombre, e.target.value === '' ? undefined : e.target.value)}
                        className={`${CAMPO} self-start cursor-pointer`}
                      >
                        {/* **El vacío es «por defecto», no un valor.** El default lo
                            aplica el cuerpo; escribirlo acá lo congelaría el día que
                            el cuerpo cambie de opinión. */}
                        <option value="">Por defecto</option>
                        {spec.values.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={spec.kind === 'number' ? 'number' : 'text'}
                        aria-label={nombre}
                        placeholder="Por defecto"
                        value={valor === undefined ? '' : String(valor)}
                        {...(spec.kind === 'number' && spec.min !== undefined ? { min: spec.min } : {})}
                        {...(spec.kind === 'number' && spec.integer === true ? { step: 1 } : {})}
                        onChange={(e) => {
                          const texto = e.target.value
                          if (texto === '') return onOpcion(nombre, undefined)
                          return onOpcion(nombre, spec.kind === 'number' ? Number(texto) : texto)
                        }}
                        className={`${CAMPO} w-40`}
                      />
                    )}
                    {spec.kind === 'number' && <Ayuda>{`Espera ${describirParam(spec)}.`}</Ayuda>}
                  </div>
                )
              })
            )}
              </section>
            </>
          )}
        </section>
      )}
    </div>
  )
}

/** ── 2 · QUÉ MUESTRA · B4 ───────────────────────────────────────────────── */
function QueMuestra({
  panel,
  bloques,
  tabla,
  metrics,
  onMetrica,
}: {
  panel: PanelDeBorrador
  bloques: readonly Block[]
  tabla: BlockTable
  metrics: readonly Metric[]
  onMetrica: (id: string) => void
}) {
  const tipo = panel.tipo as PanelType
  const bloque = tabla.get(tipo)
  /** La razón por la que una métrica no entra en ESTE tipo, o `null`. */
  const razon = (m: Metric): string | null =>
    bloque === undefined
      ? `El tipo «${nombreDeTipo(panel.tipo)}» no está en la tabla de bloques.`
      : invalidReason(tabla, tipo, m.forma, bloque.colSpanMin, bloque.rowSpanMin)
  const compatibles = metrics.filter((m) => razon(m) === null)
  const otras = metrics.filter((m) => razon(m) !== null)

  return (
    <>
      <Ayuda>
        {panel.metricId === ''
          ? 'Elegí qué muestra este panel: sin métrica no se puede publicar.'
          : 'Cambiá la métrica: el panel se vuelve a dibujar con su dato.'}
      </Ayuda>

      <div className="flex items-baseline gap-3">
        <Label as="div">{`Se dibujan como ${nombreDeTipo(panel.tipo)}`}</Label>
        <Label as="div">{`${String(compatibles.length)} de ${String(metrics.length)}`}</Label>
      </div>
      {compatibles.length === 0 ? (
        <Ayuda>Ninguna métrica de este cliente tiene una forma que este tipo acepte.</Ayuda>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {compatibles.map((m) => (
            <li key={m.id}>
              <Opcion forma="fila" elegida={m.id === panel.metricId} onClick={() => onMetrica(m.id)}>
                <span className="flex min-w-0 flex-col">
                  <span>{m.nombre}</span>
                  {/* La procedencia en una línea y tenue: sirve para decidir
                      entre dos parecidas, no para leer la lista. */}
                  <Note as="span">{`${m.capa} · ${m.fuente}`}</Note>
                </span>
              </Opcion>
            </li>
          ))}
        </ul>
      )}

      {otras.length > 0 && (
        <details className="flex flex-col gap-1">
          <summary className="cursor-pointer font-body text-cuerpo text-dim">
            {`${String(otras.length)} más · se dibujan de otra forma`}
          </summary>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
            {otras.map((m) => {
              const otro = tipoPara(bloques, m.forma)
              return (
                <li key={m.id}>
                  {otro === undefined ? (
                    // Ningún tipo la dibuja: se nombra y se dice por qué, sin
                    // caja que invite a tocarla.
                    <div className="flex flex-col gap-0.5 px-3 py-1">
                      <span className="font-body text-cuerpo text-dim">{m.nombre}</span>
                      <Label>{`Ningún tipo dibuja la forma ${nombreDeForma(m.forma)}`}</Label>
                    </div>
                  ) : (
                    <Opcion forma="fila" elegida={false} onClick={() => onMetrica(m.id)}>
                      <span className="flex min-w-0 flex-col">
                        <span>{m.nombre}</span>
                        {/* **El rechazo explicado, ahora como consecuencia** ·
                            «el rechazo explicado es lo que enseña el sistema»:
                            dice qué forma tiene y qué va a pasar al elegirla. */}
                        <Note as="span">{`Es ${nombreDeForma(m.forma)} · se va a dibujar como ${nombreDeTipo(otro)}`}</Note>
                      </span>
                    </Opcion>
                  )}
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </>
  )
}

/** ── 2 · CÓMO SE VE · B3 ────────────────────────────────────────────────── */
function ComoSeVe({
  panel,
  bloques,
  metrica,
  plots,
  repertorio,
  payload,
  format,
  onComoSeVe,
  onIrAMetrica,
}: {
  panel: PanelDeBorrador
  bloques: readonly Block[]
  metrica: Metric | undefined
  plots: readonly Plot[]
  repertorio: PlotTable
  payload: Payload | undefined
  format: Formatter
  onComoSeVe: (tipo: string, grafico: ChartId | undefined) => void
  onIrAMetrica: () => void
}) {
  if (metrica === undefined) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Ayuda>Cómo se ve depende de qué muestra: elegí primero la métrica.</Ayuda>
        <Accion onClick={onIrAMetrica}>Elegir qué muestra</Accion>
      </div>
    )
  }
  const tipos = bloques.filter((b) => b.tipo !== 'blocked' && b.formasAceptadas.includes(metrica.forma))
  const ahora = new Date()
  const conDato = payload !== undefined && hasValue(payload)

  return (
    <>
      <Ayuda>
        {conDato
          ? `Cada opción está dibujada con el dato de ${metrica.nombre}.`
          : `Todavía no hay dato de ${metrica.nombre} para dibujar las opciones: se ven al guardar.`}
      </Ayuda>
      {tipos.map((b) => {
        const graficos = plots.filter((x) => x.formas.includes(metrica.forma as never))
        const descripcion = descripcionDeTipo(b.tipo)
        return (
          <section key={b.tipo} aria-label={nombreDeTipo(b.tipo)} className="flex flex-col gap-2">
            <div className="flex flex-col">
              <Label as="div">{nombreDeTipo(b.tipo)}</Label>
              {descripcion !== null && <Note as="div">{descripcion}</Note>}
            </div>
            {[undefined, ...graficos.map((x) => x.id as ChartId)].map((id) => {
              const elegida = panel.tipo === b.tipo && panel.grafico === id
              const problema =
                id === undefined || !conDato ? null : invalidPlotReason(repertorio, id, payload.valor)
              const bloqueado = problema !== null && problema.clase !== 'indeterminado'
              const nombre = id === undefined ? 'El de por defecto' : (plots.find((x) => x.id === id)?.nombre ?? id)
              return (
                <button
                  key={id ?? 'por-defecto'}
                  type="button"
                  aria-pressed={elegida}
                  aria-label={`${nombreDeTipo(b.tipo)} · ${nombre}`}
                  disabled={bloqueado}
                  onClick={() => onComoSeVe(b.tipo, id)}
                  className={
                    'flex w-full cursor-pointer flex-col gap-2 rounded-md border p-3 text-left disabled:cursor-not-allowed ' +
                    (elegida ? 'border-acc bg-w2' : 'border-w4 hover:bg-w2')
                  }
                >
                  <span className="flex items-center gap-2">
                    {elegida && <span aria-hidden className="size-2 shrink-0 rounded-full bg-acc" />}
                    <span className={'font-body text-cuerpo ' + (bloqueado ? 'text-dim' : 'font-semibold text-ink')}>
                      {nombre}
                    </span>
                  </span>
                  {/* **El tope y el mínimo se EVALÚAN**, ya no se declaran: con
                      el dato a mano se sabe si el gráfico queda vacío. La razón
                      va donde iría el dibujo, que es donde el ojo ya está. */}
                  {bloqueado ? (
                    <Note as="span">{problema.razon}</Note>
                  ) : conDato ? (
                    <MuestraDeGrafico tipo={b.tipo} grafico={id} metrica={metrica} payload={payload} format={format} now={ahora} />
                  ) : null}
                </button>
              )
            })}
          </section>
        )
      })}
    </>
  )
}

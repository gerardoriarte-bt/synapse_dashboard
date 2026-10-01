/** C2 · el drill-down de un panel · F3.9
 *
 *  **§PEN:C2** · `Consola · C2 · Drill-down de panel` · 1440 × 2329, hoja de 864
 *  —el 60%— en `$panel` con filete `$w3`, **sin radio y sin filo**, sobre un velo
 *  `$shad`. Es el destino de los «VER DETALLE» de cada panel, que hasta hoy no
 *  llevaban a ningún lado.
 *
 *  ── LO QUE EL DIBUJO PIDE Y NO SE CONSTRUYE, CON SU RAZÓN MEDIDA ────────────
 *
 *  El frame tiene tres secciones y acá se construye **una**. Las otras dos no
 *  son un recorte de alcance: **no hay de dónde sacar el dato**, y fingirlo sería
 *  inventar una cifra. Las dos quedan **declaradas** en pantalla, que es la
 *  gramática de los estados —se dice qué falta, no se esconde— y las dos están
 *  atadas por una aserción en `tests/surfaces/console/drilldown.test.tsx`.
 *
 *  1. **`TABLA ORIGEN`.** El dibujo pide cinco filas crudas con fecha, canal,
 *     órdenes, unidades y USD. Lo que llega es la desagregación **ya agregada**:
 *     una etiqueta y un número por ítem. Ninguna lectura del tenant devuelve
 *     filas crudas, y las que se acercan son de administración, así que un CEO o
 *     un planner no las alcanza.
 *  2. **`LINAJE HASTA LA FUENTE CRUDA`.** Pide cuatro capas con sus conteos y el
 *     descarte de bronce a plata —«18.380 filas … 1,4% del lote»—. De las cuatro
 *     llega **una**: la capa, la fuente y la frescura de la cifra publicada, que
 *     ya son el badge de procedencia del encabezado de acá arriba. Los conteos y
 *     el descarte no existen en ningún campo.
 *
 *  3. **La frase de cierre y los porcentajes por fila NO SE PINTAN, y su
 *     falsedad está MEDIDA.** El dibujo escribe «LA DESAGREGACIÓN CIERRA CONTRA
 *     EL TOTAL» y una cuota por fila cuyo denominador es la cifra publicada.
 *     Medido el 2026-09-30 sobre el panel de ventas y el mes en curso: la cifra
 *     publicada es 1 232 721, la desagregación por día y por semana suma
 *     1 282 259, y la de plataforma 968 169 — porque lee otra tabla y otra
 *     medida. **No cierra en ninguna de las tres**, por dos razones distintas:
 *     una dimensión mide el ingreso atribuido a medios pagos contra el total del
 *     sitio, y las otras dos son una lectura en vivo contra una materialización
 *     de horas antes. Un porcentaje sobre ese denominador afirmaría una cuota de
 *     un total que la pantalla misma muestra distinto.
 *
 *     Y además sería **un cálculo y una frase compuesta**, que no es trabajo
 *     nuestro. Se pinta la cifra de cada ítem y no su cuota.
 *
 *  4. **El rótulo legible de cada dimensión no llega.** El dibujo escribe
 *     `CANAL`, `DIVISIÓN`, `GÉNERO`, `REGIÓN`; lo que viaja son las claves. El
 *     rótulo **existe del otro lado** y se pierde al serializar, así que está
 *     pedido. **Acá no se escribe un diccionario**: una tabla de traducción en el
 *     front es la que nadie mantiene el día que aparezca una quinta dimensión.
 *
 *  5. **El título puede salir en inglés**, y tampoco se arregla acá. El
 *     encabezado se titula con el nombre que da el catálogo, y hoy los paneles
 *     del dashboard por defecto apuntan a las métricas de la semilla, que están
 *     en inglés. El dueño del copy que describe datos es el catálogo: un texto en
 *     inglés en pantalla es un pedido a quien lo emite.
 *
 *  ── LA DESAGREGACIÓN SE DIBUJA CON EL CUERPO DEL REGISTRO ───────────────────
 *
 *  El dibujo pide una lista nombre/cifra/cuota con pista de 6px y barra de
 *  familia. **Ese visual no está en el repertorio**: de los que el repertorio da
 *  a una forma categórica, ninguno es ése. Construirlo sería una fila nueva del
 *  repertorio, y **un gráfico que la tabla no declara no se puede validar contra
 *  ella** — que es exactamente el silencio que la validación del repertorio
 *  existe para cerrar. Así que se dibuja con el cuerpo que el registro ya tiene,
 *  la divergencia queda atada por una aserción, y la lista de cuotas va como
 *  propuesta.
 *
 *  **Y no se le pasa ningún gráfico.** La respuesta no declara con qué se dibuja
 *  su valor, y elegirlo por dimensión —columnas para el día, barras para la
 *  plataforma— sería el front decidiendo qué se grafica, que es composición y no
 *  presentación. El cuerpo cae en su defecto.
 *
 *  **Los ceros no se filtran.** Medido: la dimensión de plataforma trae 37 ítems
 *  con 29 en cero. Una barra en cero no es un hueco de datos, es una plataforma
 *  sin gasto en el mes, y filtrarla sería el front decidiendo qué dato existe.
 *
 *  ── A 360 NO ENTRA, Y LO DIFIERE LA SPEC ────────────────────────────────────
 *
 *  `design.md` lo declara con todas las letras: esta hoja abre al 60% del
 *  viewport, y a 360 eso son 216px —menos que un panel—. Dice que es trabajo de
 *  v1.1. No se inventa un mínimo: se pinta el 60% y acá queda la cita.
 */
import { useState } from 'react'
import { useDrill, useDrillDimensions } from '../../api/hooks'
import { SideSheet } from './SideSheet'
import { Label } from '../../render/primitives/Label'
import { Value } from '../../render/primitives/Value'
import { Provenance } from '../../render/Panel/Provenance'
import { bodyFor } from '../../render/bodies/registry'
import { LoadingState } from '../../render/states/LoadingState'
import { EmptyState } from '../../render/states/EmptyState'
import { ErrorState } from '../../render/states/ErrorState'
import { resolveGovernance } from '../../render/state'
import { hasValue } from '../../render/state'
import { familyVar } from '../../tokens/tokens'
import { Suspense } from 'react'
import { ApiError } from '../../api/types'
import type { Metric, Payload } from '../../api/types'
import type { Formatter } from '../../render/format'

/** El rol tipográfico de la nota de 9 del dibujo · `text-nota` + el mismo
 *  tracking de rótulo, que en `em` es el mismo 0.12 que el label de 10. */
const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'

/** El cuerpo de 12 del dibujo. **12,5 va a `text-celda`**, por la decisión del
 *  2026-09-22: «medio píxel · el escalón no se mueve». */
const CUERPO = 'font-body text-celda leading-cuerpo text-ink m-0'

/** Un chip de dimensión · 24 de alto, radio `$r-md`, padding horizontal 10.
 *
 *  **Sin `border-0` ni `bg-transparent` acá, y la razón se vio abriéndolo.** Las
 *  dos estaban en esta base y las dos GANABAN sobre lo que cada rama pone
 *  —`border border-w3` en el chip inactivo, `bg-elev` en el activo—: el orden de
 *  las clases en la cadena no decide nada, lo decide el orden en la hoja
 *  generada, y ahí `border-0` y `bg-transparent` iban después. El resultado era
 *  tres palabras sueltas donde el dibujo pone tres pastillas, y **nada falla**:
 *  compila, pasa el lint y se pinta. Es el mismo modo de silencio que una
 *  utilidad que nombra un token inexistente. Lo encontró mirar la pantalla.
 *
 *  Cada rama declara su borde y su fondo enteros, así que no hay dos utilidades
 *  de la misma propiedad compitiendo. */
const CHIP =
  'flex h-6 shrink-0 items-center rounded-md px-2.5 font-mono text-nota tracking-rotulo ' +
  'uppercase cursor-pointer'

/** Los dos botones del pie · 28 de alto, radio `$r-md`, padding horizontal 12.
 *  Mismo cuidado que el chip: el borde lo pone cada botón, no esta base. */
const PIE_BOTON =
  'flex h-7 shrink-0 items-center gap-2 rounded-md px-3 font-mono text-nota tracking-rotulo ' +
  'uppercase cursor-pointer'

/** **El 422 es un vacío, no un error, y la diferencia es de pantalla.**
 *
 *  La lectura contesta 422 cuando no hay filas para ese período y esa dimensión:
 *  la dimensión existe, el pedido era válido y el mes no tiene dato. Eso es un
 *  vacío declarado y va al estado de «sin datos», que invita a actuar. Mandarlo a
 *  un error diría que algo falló.
 *
 *  El otro 422 posible —que la métrica no soporte desagregación— **no debería
 *  llegar acá**, porque el CTA sólo se pinta cuando la lectura de dimensiones
 *  dijo que sí. Si llegara, su frase la escribe el servicio y es la que se
 *  pinta: §8 manda sobre el texto del error. */
const SIN_FILAS = 422

type Props = {
  panelId: string
  /** La métrica del panel de origen · el título, la familia, la unidad y la
   *  dirección semántica salen de acá, que es el catálogo. */
  metric: Metric
  /** El payload del panel de origen. **La BASE y la procedencia salen de él y no
   *  de la desagregación**, y no por comodidad: la respuesta de la lectura trae
   *  nueve campos y **ninguno es de procedencia**. Una cifra desagregada sigue
   *  siendo la métrica, así que tiene que declarar su BASE y su PROCEDENCIA. */
  payload: Payload
  periodo: string
  format: Formatter
  now: Date
  onClose: () => void
  /** «Preguntar sobre esta cifra» · **sin él el botón del pie no se pinta**, que
   *  es la regla del CTA muerto. Y cuando está, **cierra esta hoja antes de abrir
   *  la otra**: dos hojas apiladas dejan al usuario sin saber qué cierra el
   *  Escape, y este pie es justo lo que habilita ese caso. */
  onAsk?: (() => void) | undefined
}

export function DrillSheet({
  panelId,
  metric,
  payload,
  periodo,
  format,
  now,
  onClose,
  onAsk,
}: Props) {
  const dimensiones = useDrillDimensions(panelId)

  /** Cuál se está mirando. **`null` significa «la que el servicio puso primero»**
   *  y no un defecto escrito acá: cablear una dimensión rompería los paneles que
   *  no la declaran —hay una métrica que declara una sola— y sería el front
   *  eligiendo el corte. */
  const [elegida, setElegida] = useState<string | null>(null)
  const disponibles = dimensiones.data?.dimensiones ?? []
  const dimension = elegida ?? disponibles[0] ?? null

  const detalle = useDrill(panelId, dimension, periodo)

  const governance = resolveGovernance(metric, payload)
  const presentacion = hasValue(payload) ? payload.presentacion : undefined

  return (
    <SideSheet
      open
      title="Detalle"
      contexto={`${metric.nombre} · ${periodo}`}
      onClose={onClose}
      // **El 60% del viewport, medido en el frame**: `x=576 width=864` sobre
      // 1440. No es el ancho fijo de la hoja del chat.
      ancho="w-[60vw]"
      // `$panel` con filete `$w3` y **sin radio**: el frame no tiene
      // `cornerRadius`, a diferencia del del chat.
      superficie="border border-w3 bg-panel shadow-[0_0_40px_var(--color-shad)]"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── CABECERA · `$elev` · padding [24, 32, 20, 32] · gap 14 ───────── */}
        <header className="flex shrink-0 flex-col gap-3.5 bg-elev px-8 pt-6 pb-5">
          <div className="flex items-center gap-3">
            {/* El bullet de familia · 8 × 8, radio `$r-xs`. **La familia se lee
                del catálogo, nunca se elige acá** · regla dura 1. */}
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-xs"
              style={{ background: familyVar(metric.familia) }}
            />
            <h2 className="font-display text-titulo-lg tracking-titulo leading-titulo text-ink m-0 min-w-0 truncate">
              {metric.nombre}
            </h2>
            {/* La forma corta que el dibujo pone al lado del título. **Es dato
                del catálogo y no una cadena escrita**, así que es lo más cerca
                que esta pantalla llega de vocabulario interno — y queda anotado:
                para los paneles del dashboard por defecto dice una clave que no
                es la que el dibujo eligió. */}
            <p className={`${NOTA} shrink-0`}>{metric.key}</p>
            <span className="flex-1" />
            {/* Dice `ESC` y no «Cerrar»: es la tecla que además funciona, así que
                el rótulo enseña el atajo. El nombre accesible sigue siendo
                «Cerrar» — `ESC` no se lee en voz alta como una acción. */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={`${NOTA} shrink-0 cursor-pointer border-0 bg-transparent p-0 hover:text-ink`}
            >
              Esc
            </button>
          </div>

          {/* ── LA CIFRA · 44, peso 700, tracking de KPI ──────────────────────
              **Sólo cuando el panel publica un escalar.** El dibujo muestra el
              caso de un KPI, y los paneles que soportan desagregación no son
              todos KPI: un panel de barras no tiene UNA cifra que poner acá, y
              componerla sumando los ítems sería inventarla — con el agravante de
              que la suma de los ítems **no es** la cifra publicada, que está
              medido arriba.

              `Value` y no un `<span>`: es el único camino a una cifra, y lleva su
              label obligatorio en el tipo. Es «ningún número desnudo» sostenido
              por el compilador y no por la disciplina. */}
          {hasValue(payload) && payload.valor.forma === 'escalar' && (
            <div className="flex items-end gap-5">
              <Value label={presentacion?.label ?? 'Total'} size="kpi">
                {format.withUnit(
                  format.number(payload.valor.v, { abbreviate: true }),
                  metric.unidad ?? undefined,
                )}
              </Value>
              {/* Los comparativos que el payload trae, **en color neutro** ·
                  regla dura 3: el signo comunica la dirección y está prohibido el
                  verde/rojo semántico. El rótulo lo redacta el backend. */}
              {(presentacion?.comparativo ?? []).length > 0 && (
                <div className="flex flex-col gap-1">
                  {(presentacion?.comparativo ?? []).map((c) => (
                    <Label key={c.label}>
                      {`${format.delta(c.delta, { decimals: 1 })}${c.unidad ?? '%'} ${c.label}`}
                    </Label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LA META · BASE · separador · procedencia · dirección ─────────
              **Se unen las partes que EXISTEN.** Con la ventana vacía el template
              dejaba el separador colgando —`Base · ALL CHANNELS ·`—, que es el
              defecto que la cabecera del panel ya corrigió el 2026-09-26. Vacío
              se lee como ausente y un segmento ausente no se pinta. Y la ventana
              llega vacía de verdad: medido en el panel de ventas. */}
          <div className="flex min-w-0 flex-wrap items-center gap-3.5">
            <Label>
              {['Base', governance.base, governance.ventana].filter((p) => p !== '').join(' · ')}
            </Label>
            <span aria-hidden className="h-3 w-px shrink-0 bg-w3" />
            <Provenance
              capa={governance.capa}
              fuente={governance.fuente}
              frescura={governance.frescura}
              format={format}
              now={now}
            />
            <span className="flex-1" />
            {/* Sólo si la métrica la declara · §1.3 la exige en las compuestas, y
                ponerla donde no aplica la vacía de sentido. */}
            {metric.direccionSemantica != null && <Label>{metric.direccionSemantica}</Label>}
          </div>
        </header>

        {/* ── EL CUERPO · padding 32 · gap 30 ──────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col gap-7.5 overflow-y-auto p-8">
          {/* ── §1 · LA DESAGREGACIÓN ──────────────────────────────────────── */}
          <section className="flex min-w-0 flex-col gap-3.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Label as="div">Desagregada por</Label>

              {/* **Los ejes salen de la lectura, no de una lista escrita acá**,
                  que es el criterio de esta tarea. Y no salen del campo de
                  dimensiones del catálogo tampoco: existe en el contrato y llega
                  **vacío en las 21 métricas**, medido. Llenarlo es pedido; la
                  mitad que es nuestra —que el front no escriba ninguna lista— se
                  cumple.

                  **Tampoco se pinta «DEL CATÁLOGO»**, que es lo que el frame
                  escribe a la derecha: afirmaría una procedencia que la medición
                  contradice. Queda escrito como propuesta. */}
              {disponibles.map((d) => {
                const activa = d === dimension
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => setElegida(d)}
                    className={
                      CHIP +
                      (activa
                        ? ' border border-elev bg-elev text-ink'
                        : ' border border-w3 bg-transparent text-dim hover:text-ink')
                    }
                  >
                    {/* La clave tal como viene. El rótulo legible no se
                        serializa y no se inventa acá · ver la cabecera. */}
                    {d}
                  </button>
                )
              })}
            </div>

            {cuerpo()}

            {/* **El rótulo nombra lo que la cifra cuenta, y no es un detalle.**
                Las filas que la consulta devolvió **no son** la cantidad de
                ítems: medido 39 contra 37, porque el transformador del servicio
                saltea en silencio toda fila sin etiqueta o sin valor. Un
                «mostrando 39» sobre una lista de 37 es una cifra que no cierra
                con lo que se ve. */}
            {detalle.data !== undefined && (
              <Label as="div">{`${format.number(detalle.data.filas, { decimals: 0 })} filas devolvió la consulta`}</Label>
            )}
          </section>

          {/* ── §2 · LA TABLA ORIGEN · DECLARADA AUSENTE ───────────────────── */}
          <section className="flex min-w-0 flex-col gap-3.5">
            <Label as="div">Tabla origen</Label>
            <div className="flex min-w-0 flex-col gap-1 rounded-md border border-w3 px-3.5 py-3">
              <p className={CUERPO}>
                Las filas que están detrás de esta cifra todavía no se publican.
              </p>
              <p className={NOTA}>
                Lo más fino que hay hoy es la desagregación de arriba · una fila por categoría, no
                una por operación
              </p>
            </div>
          </section>

          {/* ── §3 · EL LINAJE · DECLARADO AUSENTE ─────────────────────────── */}
          <section className="flex min-w-0 flex-col gap-3.5">
            <Label as="div">Linaje hasta la fuente cruda</Label>
            <div className="flex min-w-0 flex-col gap-1 rounded-md border border-w3 px-3.5 py-3">
              <p className={CUERPO}>
                El recorrido del dato entre capas todavía no se publica.
              </p>
              <p className={NOTA}>
                De las cuatro capas, la de la cifra publicada está declarada arriba con su fuente y
                su frescura · las tres anteriores y lo que se descarta entre ellas no llegan
              </p>
            </div>
          </section>
        </div>

        {/* ── EL PIE · `$elev` · 52 de alto · padding [0, 32] · gap 14 ─────── */}
        <footer className="flex h-13 shrink-0 items-center gap-3.5 bg-elev px-8">
          <button
            type="button"
            onClick={onClose}
            className={`${PIE_BOTON} border border-w4 bg-transparent text-ink`}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-dim"
              aria-hidden
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Volver al panel
          </button>

          {/* **Sin manejador no se pinta** · la regla del CTA muerto. Y el
              manejador cierra esta hoja antes de abrir el chat: no se apilan. */}
          {onAsk !== undefined && (
            <button
              type="button"
              onClick={onAsk}
              className={`${PIE_BOTON} border border-acc bg-acc font-medium text-on-acc`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
              </svg>
              Preguntar sobre esta cifra
            </button>
          )}

          <span className="flex-1" />
          <p className={`${NOTA} shrink-0`}>
            Esta vista no cambia la composición · solo el builder la modifica
          </p>
        </footer>
      </div>
    </SideSheet>
  )

  /** El valor de la desagregación, o el estado que lo reemplaza.
   *
   *  **Un estado reemplaza el cuerpo, nunca el shell** · §5.2. Acá el «shell» es
   *  el encabezado de arriba: el título, la BASE y la procedencia siguen visibles
   *  mientras esto carga, falla o está vacío. */
  function cuerpo() {
    if (dimensiones.isError) {
      return <ErrorState message={dimensiones.error.message} />
    }

    if (dimension === null) {
      // La lectura de dimensiones todavía no volvió, o volvió vacía. Lo segundo
      // no debería llegar: el CTA no se pinta sin dimensiones.
      return dimensiones.isSuccess ? (
        <EmptyState phrase="Esta métrica no declara por qué desagregar." />
      ) : (
        <LoadingState />
      )
    }

    if (detalle.isPending) return <LoadingState />

    if (detalle.isError) {
      const e = detalle.error
      const mensaje = e.message
      // **El mensaje del servicio tal cual** · §8 manda sobre él. Reescribirlo
      // acá sería el front redactando un error del que no sabe la causa. Y la
      // hoja **no reintenta sola**: esta lectura comparte la cuota por usuario
      // del chat, así que un reintento automático sobre un límite excedido gasta
      // la cuota que acaba de agotarse.
      return e instanceof ApiError && e.httpStatus === SIN_FILAS ? (
        <EmptyState phrase={mensaje} detail="Probá otro corte o otro período" />
      ) : (
        <ErrorState message={mensaje} />
      )
    }

    const { valor } = detalle.data

    if (!valor.ok) {
      // **La razón se pinta, no se traga.** Un valor que no se pudo adaptar con
      // una caja vacía al lado es el panel que no dibuja y no explica.
      return <EmptyState phrase={valor.razon} />
    }

    // **Y la forma se comprueba, no se supone** · mismo idioma que la cifra del
    // chat. El servicio cablea `categorical` en las tres dimensiones —medido—,
    // pero eso es una garantía SUYA y el tipo no la lleva: el valor que llega acá
    // es la unión entera. Dibujar una serie temporal con el cuerpo de barras se
    // vería bien y sería otra cifra, que es el fallback silencioso que §1 prohíbe.
    if (valor.valor.forma !== 'categorica') {
      return (
        <EmptyState
          phrase={`Este corte llegó en una forma que la hoja no dibuja: «${valor.valor.forma}».`}
        />
      )
    }

    // **El cuerpo del REGISTRO**, el mismo que dibuja este valor en la grilla y
    // en el chat. Ver la cabecera: la lista de cuotas del dibujo no está en el
    // repertorio, y un gráfico que la tabla no declara no se puede validar.
    const Body = bodyFor('bars')
    if (Body === undefined) {
      return <EmptyState phrase="Sin cuerpo con que dibujar este corte." />
    }

    // ── LA ALTURA CRECE CON LAS CATEGORÍAS, Y ESO TAMBIÉN SE VIO ABRIENDO ──
    //
    // Con una altura fija, la desagregación por día —30 ítems medidos— apilaba
    // treinta barras en 320px: seis píxeles por fila, con las etiquetas pisando
    // el dibujo. Y la de plataforma trae 37. El frame del dibujo mide 2329 de
    // alto justamente porque la sección crece; la hoja ya desplaza, así que no
    // hay nada que ganar recortándola.
    //
    // **El piso son los 320 de antes**, para que tres categorías no dejen un
    // dibujo aplastado contra el borde.
    const PISO = 320
    const POR_ITEM = 22
    const alto = Math.max(PISO, valor.valor.items.length * POR_ITEM)

    return (
      <div className="min-h-0" style={{ height: `${String(alto)}px` }}>
        <Suspense fallback={<LoadingState />}>
          <Body
            value={valor.valor}
            params={{}}
            // La hoja no vive en la grilla, pero los cuerpos piden un
            // `Placement` para decidir densidad. Se le da el que mide la hoja
            // contra la pantalla: 60% de doce columnas son siete.
            span={{ colStart: 1, colSpan: 7, rowSpan: 5 }}
            family={metric.familia}
            // **Ningún gráfico**: la respuesta no declara con qué se dibuja y
            // elegirlo acá sería composición. Ver la cabecera.
            metric={metric.nombre}
            format={format}
            {...(metric.unidad == null ? {} : { unit: metric.unidad })}
          />
        </Suspense>
      </div>
    )
  }
}

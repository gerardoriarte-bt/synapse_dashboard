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
 */
import { Label } from '../../render/primitives/Label'
import { invalidReason } from '../../catalog/blocks'
import { PARAM_SCHEMAS, describirParam, validateParams } from '../../api/params'
import type { BlockTable } from '../../catalog/blocks'
import type { Block, Metric, PanelType } from '../../api/types'
import type { PanelDeBorrador } from './borrador'

type Props = {
  panel: PanelDeBorrador
  bloques: readonly Block[]
  tabla: BlockTable
  metrics: readonly Metric[]
  onTipo: (tipo: string) => void
  onMetrica: (metricId: string) => void
  onSpan: (campo: 'colSpan' | 'rowSpan', valor: number) => void
  /** `undefined` borra la opción · ver `editarOpcion`. */
  onOpcion: (nombre: string, valor: unknown) => void
  onQuitar: () => void
}

export function PanelConfigurator({
  panel,
  bloques,
  tabla,
  metrics,
  onTipo,
  onMetrica,
  onSpan,
  onOpcion,
  onQuitar,
}: Props) {
  const tipo = panel.tipo as PanelType
  const bloque = tabla.get(tipo)
  const esquema = PARAM_SCHEMAS[tipo] ?? {}

  // **Lo que este panel tendría si se guardara así**, con el mismo validador que
  // corre al leer un layout de vuelta · `api/params.ts`. Preguntárselo acá es lo
  // que hace que el campo de un número mande un número: un `"10"` viaja igual por
  // JSON, compila igual, y recién degradaría el panel la próxima vez que alguien
  // lo abra. Acá se ve mientras se escribe.
  const validado = validateParams(tipo, panel.opciones, bloque?.paramsDisponibles)

  /** La razón por la que una métrica no sirve para este tipo, o `null`.
   *
   *  Se pregunta solo por la FORMA y con los spans del bloque, no con los del
   *  panel: si el panel tuviera un span fuera de rango, todas las métricas
   *  saldrían rechazadas por una razón que no es de la métrica. */
  const razon = (m: Metric): string | null =>
    bloque === undefined
      ? `El tipo «${panel.tipo}» no está en la tabla de bloques.`
      : invalidReason(tabla, tipo, m.forma, bloque.colSpanMin, bloque.rowSpanMin)

  const compatibles = metrics.filter((m) => razon(m) === null).length

  return (
    <div className="flex flex-col gap-4 rounded-sm bg-w2 p-4">
      <div className="flex items-center gap-4">
        <Label as="div">Panel</Label>
        {panel.id === undefined && <Label as="div">Nuevo · se crea al guardar</Label>}
        <button
          type="button"
          onClick={onQuitar}
          className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm text-acc hover:bg-w3 ml-auto"
        >
          Quitar panel
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <Label as="div">Tipo</Label>
        <select
          aria-label="Tipo de panel"
          value={panel.tipo}
          onChange={(e) => onTipo(e.target.value)}
          className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
        >
          {bloques.map((b) => (
            <option key={b.tipo} value={b.tipo}>
              {b.tipo}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <Label as="div">{`Métrica · ${String(compatibles)} de ${String(metrics.length)} compatibles`}</Label>
        {panel.metricId === '' && (
          // Un panel sin métrica no se ancla a nada · §4: «un panel se ancla a un
          // metricId, jamás a un SQL ni a un nombre de tabla».
          <Label as="div">Sin métrica · el panel no se puede componer</Label>
        )}
        <ul className="flex flex-col gap-1 m-0 p-0 list-none">
          {metrics.map((m) => {
            const falla = razon(m)
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onMetrica(m.id)}
                  disabled={falla !== null}
                  aria-pressed={m.id === panel.metricId}
                  className={
                    'w-full text-left text-celda px-3 py-2 rounded-sm disabled:opacity-40 ' +
                    (m.id === panel.metricId ? 'bg-w3 text-ink' : 'text-dim hover:bg-w3')
                  }
                >
                  {m.nombre} <Label>{m.forma}</Label>
                  {/* **La razón, no un asterisco.** «El rechazo explicado es lo
                      que enseña el sistema»: sin ella, quien compone aprende que
                      la métrica «no anda», que no es una regla que se pueda
                      aplicar la próxima vez. */}
                  {falla !== null && <Label> · {falla}</Label>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {bloque !== undefined && (
        <div className="flex gap-6">
          <label className="flex flex-col gap-1">
            <Label as="div">{`Columnas · ${String(bloque.colSpanMin)} a ${String(bloque.colSpanMax)}`}</Label>
            <input
              type="number"
              value={panel.colSpan}
              min={bloque.colSpanMin}
              max={bloque.colSpanMax}
              onChange={(e) => onSpan('colSpan', Number(e.target.value))}
              className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4 w-24"
            />
          </label>
          <label className="flex flex-col gap-1">
            {/* **La altura se dice en filas y en píxeles**, porque la fórmula es
                la regla: `px = 96·N − 16`, y ninguna altura sale de otro lado. */}
            <Label as="div">{`Filas · ${String(bloque.rowSpanMin)} a ${String(bloque.rowSpanMax)}`}</Label>
            <input
              type="number"
              value={panel.rowSpan}
              min={bloque.rowSpanMin}
              max={bloque.rowSpanMax}
              onChange={(e) => onSpan('rowSpan', Number(e.target.value))}
              className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4 w-24"
            />
            <Label as="div">{`${String(96 * panel.rowSpan - 16)} px`}</Label>
          </label>
          <div className="flex flex-col gap-1">
            <Label as="div">Columna de inicio</Label>
            <Label as="div">{`${String(panel.colStart)} · se coloca en el canvas · F4.9`}</Label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label as="div">Opciones de este tipo</Label>
        {bloque?.paramsDisponibles === undefined ? (
          <Label as="div">El bloque no declara paramsDisponibles · no se ofrece ninguna</Label>
        ) : bloque.paramsDisponibles.length === 0 ? (
          <Label as="div">Ninguna</Label>
        ) : (
          bloque.paramsDisponibles.map((nombre) => {
            const spec = esquema[nombre]
            const valor = panel.opciones?.[nombre]

            // El backend lo declara disponible y el front no sabe qué valores
            // acepta. **No se ofrece un campo libre**: escribir ahí produce un
            // param que `validateParams` va a descartar, que es el silencio que
            // F1.29 vino a cerrar.
            if (spec === undefined) {
              return (
                <Label key={nombre} as="div">
                  {`${nombre} · el contrato no declara sus valores · B0.9`}
                </Label>
              )
            }

            // **`array` y `object` tampoco se editan acá**, y no es lo mismo que
            // el caso de arriba: el esquema sí los declara, pero son estructuras
            // —`columnas` es una lista de definiciones de columna, `banda` un
            // objeto con dos umbrales—. Un textarea de JSON compilaría y sería
            // la peor de las opciones: el error aparecería al publicar.
            if (spec.kind === 'array' || spec.kind === 'object') {
              return (
                <Label key={nombre} as="div">
                  {`${nombre} · ${describirParam(spec)} · no se edita acá · hace falta un editor propio`}
                </Label>
              )
            }

            return (
              <label key={nombre} className="flex items-center gap-2">
                <Label>{`${nombre} · espera ${describirParam(spec)}`}</Label>
                {spec.kind === 'enum' ? (
                  <select
                    aria-label={nombre}
                    value={typeof valor === 'string' ? valor : ''}
                    onChange={(e) => onOpcion(nombre, e.target.value === '' ? undefined : e.target.value)}
                    className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
                  >
                    {/* **El vacío es «sin declarar», no un valor.** El default lo
                        aplica el cuerpo; escribirlo acá lo congelaría el día que
                        el cuerpo cambie de opinión. */}
                    <option value="">Sin declarar</option>
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
                    value={valor === undefined ? '' : String(valor)}
                    {...(spec.kind === 'number' && spec.min !== undefined ? { min: spec.min } : {})}
                    {...(spec.kind === 'number' && spec.integer === true ? { step: 1 } : {})}
                    onChange={(e) => {
                      const texto = e.target.value
                      if (texto === '') return onOpcion(nombre, undefined)
                      // **Un número se manda como número.** `opciones` viaja
                      // como JSON y `validateParams` pide `typeof === 'number'`:
                      // mandar «100» degradaría el panel con razón visible, que
                      // es correcto y es un error que este campo no debe crear.
                      return onOpcion(nombre, spec.kind === 'number' ? Number(texto) : texto)
                    }}
                    className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4 w-32"
                  />
                )}
              </label>
            )
          })
        )}
        {validado.invalid.map((p) => (
          // «El rechazo explicado es lo que enseña el sistema», también acá: la
          // razón sale del validador y no de una frase escrita a mano.
          <Label key={p.param} as="div">
            {p.reason}
          </Label>
        ))}
        {validado.unknown.map((n) => (
          <Label key={n} as="div">{`${n} · este tipo no lo lee · se va a descartar`}</Label>
        ))}

        <Label as="div">
          Y falta la dimensión de desagregación que §7.2 pide · ningún tipo la declara como param
        </Label>
      </div>
    </div>
  )
}

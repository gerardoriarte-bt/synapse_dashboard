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
 *  **§PEN:B4** · B4 · «Binder de métrica».
 */
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { Opcion } from '../../render/primitives/Opcion'
import { invalidReason } from '../../catalog/blocks'
import { useState } from 'react'
import type { ChartId, Plot } from '../../catalog/types'
import { PlotPicker } from './PlotPicker'
import { PARAM_SCHEMAS, describirParam } from '../../api/params'
import type { BlockTable } from '../../catalog/blocks'
import type { Block, Metric, PanelType } from '../../api/types'
import type { PanelDeBorrador } from './borrador'
import type { ProblemaLocal } from './validar'
import { descripcionDeTipo, nombreDeForma, nombreDeTipo } from './rotulos'

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
  /** El gráfico elegido · `undefined` lo quita y devuelve al de por defecto. */
  onGrafico: (id: ChartId | undefined) => void
  /** El repertorio, de `/config/plots`. **Vacío apaga la sección entera** en vez
   *  de ofrecer un selector sin opciones. */
  plots: readonly Plot[]
  /** Los de ESTE panel, ya calculados · una sola corrida de `validarBorrador`. */
  problemas: readonly ProblemaLocal[]
  onQuitar: () => void
}

const CAMPO = 'h-8 bg-w1 text-ink text-cuerpo rounded-md px-3 border border-w5'

export function PanelConfigurator({
  panel,
  bloques,
  tabla,
  metrics,
  onTipo,
  onMetrica,
  onSpan,
  onOpcion,
  onGrafico,
  plots,
  problemas,
  onQuitar,
}: Props) {
  const tipo = panel.tipo as PanelType
  const bloque = tabla.get(tipo)
  const [abierto, setAbierto] = useState(false)
  const esquema = PARAM_SCHEMAS[tipo] ?? {}

  /** La razón por la que una métrica no sirve para este tipo, o `null`. */
  const razon = (m: Metric): string | null =>
    bloque === undefined
      ? `El tipo «${nombreDeTipo(panel.tipo)}» no está en la tabla de bloques.`
      : invalidReason(tabla, tipo, m.forma, bloque.colSpanMin, bloque.rowSpanMin)

  /** La razón **desde la métrica**, que es como el `.pen` la escribe: «requiere
   *  … · esta es …». Contesta «¿por qué no puedo usar ésta?». */
  const porQueNo = (m: Metric): string =>
    bloque === undefined
      ? `El tipo «${nombreDeTipo(panel.tipo)}» no está en la tabla de bloques`
      : `Requiere ${bloque.formasAceptadas.map(nombreDeForma).join(' o ')} · esta es ${nombreDeForma(m.forma)}`

  const compatibles = metrics.filter((m) => razon(m) === null)
  const incompatibles = metrics.filter((m) => razon(m) !== null)

  /** **Agrupadas por razón**, que con 34 métricas es la diferencia entre una
   *  lista que se lee y una que se recorre. */
  /** Seis individuales y el resto en el resumen · es lo que el `.pen` muestra. */
  const A_LA_VISTA = 6
  const visiblesNo = incompatibles.slice(0, A_LA_VISTA)
  const resto = incompatibles.length - visiblesNo.length

  /** **Sólo las que quedaron ocultas** · 2026-10-06. Contaba todas las
   *  incompatibles, así que «Y 14 más» venía con conteos que sumaban 20: las
   *  seis de arriba aparecían otra vez en el resumen. */
  const porForma = new Map<string, number>()
  for (const m of incompatibles.slice(A_LA_VISTA))
    porForma.set(m.forma, (porForma.get(m.forma) ?? 0) + 1)

  const nombreDelGrafico = (id: string) => plots.find((p) => p.id === id)?.nombre ?? id
  const descripcion = descripcionDeTipo(panel.tipo)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Label as="div">Panel</Label>
          {panel.id === undefined && <Label as="div">Nuevo · se crea al guardar</Label>}
          <div className="ml-auto">
            <Accion variante="peligro" tamano="compacta" onClick={onQuitar}>
              Quitar panel
            </Accion>
          </div>
        </div>
        <span className="font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
          {nombreDeTipo(panel.tipo)}
        </span>
        {descripcion !== null && <Ayuda>{descripcion}</Ayuda>}
      </div>

      <section className="flex flex-col gap-2">
        <Label id="panel-tipo" as="div">
          Tipo
        </Label>
        <select
          aria-label="Tipo de panel"
          value={panel.tipo}
          onChange={(e) => onTipo(e.target.value)}
          className={`${CAMPO} cursor-pointer`}
        >
          {bloques.map((b) => (
            <option key={b.tipo} value={b.tipo}>
              {nombreDeTipo(b.tipo)}
            </option>
          ))}
        </select>
        {bloque !== undefined && (
          <Ayuda>{`Acepta métricas de forma ${bloque.formasAceptadas.map(nombreDeForma).join(', ')}.`}</Ayuda>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <Label as="div">Métrica</Label>
          <Label as="div">
            {`${String(compatibles.length)} de ${String(metrics.length)} compatibles`}
          </Label>
        </div>
        {panel.metricId === '' && (
          <Ayuda>Elegí una métrica: sin ella el panel no se puede publicar.</Ayuda>
        )}
        {compatibles.length === 0 ? (
          <Ayuda>Ninguna métrica de este cliente tiene una forma que este tipo acepte.</Ayuda>
        ) : (
          <ul className="flex flex-col gap-1 m-0 p-0 list-none">
            {compatibles.map((m) => (
              <li key={m.id}>
                <Opcion forma="fila" elegida={m.id === panel.metricId} onClick={() => onMetrica(m.id)}>
                  <span className="flex flex-col gap-1">
                    <span>{m.nombre}</span>
                    <Label>{`${nombreDeForma(m.forma)} · ${m.capa} · ${m.fuente}`}</Label>
                  </span>
                </Opcion>
              </li>
            ))}
          </ul>
        )}

        {incompatibles.length > 0 && (
          <details className="flex flex-col gap-1">
            <summary className="cursor-pointer font-body text-cuerpo text-dim">
              {`${String(incompatibles.length)} no compatibles con este tipo · por qué`}
            </summary>
            <ul className="flex flex-col gap-2 m-0 mt-2 p-0 list-none">
              {visiblesNo.map((m) => (
                <li key={m.id} className="flex flex-col gap-0.5 px-3">
                  {/* **La razón, no un asterisco** · «el rechazo explicado es lo
                      que enseña el sistema». Sin caja: no se puede elegir, y una
                      caja deshabilitada sigue diciendo «tocame». */}
                  <span className="font-body text-cuerpo text-dim">{m.nombre}</span>
                  <Label>{porQueNo(m)}</Label>
                </li>
              ))}
            </ul>
            {resto > 0 && (
              <Ayuda>
                {`Y ${String(resto)} más: ${[...porForma]
                  .map(([forma, n]) => `${nombreDeForma(forma)} (${String(n)})`)
                  .join(', ')}.`}
              </Ayuda>
            )}
          </details>
        )}
      </section>

      {/* ── EL GRÁFICO · §PEN:B3 · F4.21 ──────────────────────────────────── */}
      {bloque !== undefined && plots.length > 0 && (
        <section className="flex flex-col gap-2">
          <Label as="div">Gráfico</Label>
          {abierto ? (
            <div className="h-100">
              <PlotPicker
                tipo={tipo}
                formasDelTipo={bloque.formasAceptadas}
                plots={plots}
                {...(panel.grafico === undefined ? {} : { actual: panel.grafico })}
                onElegir={(id) => {
                  onGrafico(id)
                  setAbierto(false)
                }}
                onVolver={() => setAbierto(false)}
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* **Ausente es válido y se dice**: no elegir nada usa el gráfico
                  por defecto del tipo. */}
              <span className="font-body text-cuerpo text-ink">
                {panel.grafico === undefined
                  ? 'El de por defecto del tipo'
                  : nombreDelGrafico(panel.grafico)}
              </span>
              <Accion tamano="compacta" onClick={() => setAbierto(true)}>
                Elegir gráfico
              </Accion>
              {panel.grafico !== undefined && (
                <Accion tamano="compacta" onClick={() => onGrafico(undefined)} etiqueta="Quitar el gráfico elegido">
                  Usar el de por defecto
                </Accion>
              )}
            </div>
          )}
        </section>
      )}

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
          <Ayuda>La posición se cambia arrastrando el panel en el lienzo.</Ayuda>
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
        {/* **Lo que este panel tendría si se guardara así.** Sale de la misma
            corrida de `validarBorrador` que alimenta la revisión, y se ve
            mientras se escribe. */}
        {problemas
          .filter((p) => p.campo !== 'tipo' && p.campo !== 'metricId')
          .map((p) => (
            <Ayuda key={p.campo}>{p.mensaje}</Ayuda>
          ))}
      </section>
    </div>
  )
}

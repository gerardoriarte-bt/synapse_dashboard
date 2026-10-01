/** `table` · forma `tabular` · colSpan 5–8, rowSpan 4–5 · F1.13g
 *
 *  **El cuerpo NO decide cuántas filas caben**: la tabla scrollea dentro del alto
 *  que le da el `rowSpan`. Un panel que crece con sus datos rompe la fila de la
 *  grilla, que es lo que §3 impide.
 *
 *  ── Y TAMPOCO DECIDE EL ORDEN · F1.44, 2026-09-22 ───────────────────────────
 *
 *  Hasta hoy este cuerpo ordenaba las filas con un param
 *  `{ columna, direccion }`. **Nadie manda esa forma**, y las tres fuentes dicen
 *  lo mismo cuando se las mira:
 *
 *   · **El cable** manda `{"order": "investment"}` — el nombre de la columna, sin
 *     dirección. Capturado el 2026-09-22 de `GET /config/tabs/{id}`.
 *   · **El `.pen`** dibuja ese mismo panel en `§6 · Sec · table armado`, y el
 *     orden es algo que se ANUNCIA, no un control: la línea de BASE dice
 *     «BASE · MES · ORDENADO POR INVERSIÓN» y la nota al pie repite «ORDENADA
 *     POR INVERSIÓN». **El encabezado no marca la columna** — los seis rótulos
 *     llevan el mismo `$dim` y no hay flecha en ninguno.
 *   · **El payload llega ordenado.** Las seis filas del servicio vienen
 *     412K · 318K · 148K · 96K · 41K · 25K, que es exactamente el orden y los
 *     números que el `.pen` dibuja. Y su `governance.base` ya dice
 *     «MONTH · SORTED BY INVESTMENT».
 *
 *  Así que ordenar acá era **reordenar lo que ya venía ordenado**, con una
 *  dirección que habría que elegir. Elegirla es la clase de invención que el
 *  adaptador tiene prohibida, y la falla es de las caras: una tabla ordenada al
 *  revés se ve perfecta y miente.
 *
 *  **Las filas se dibujan en el orden en que llegan.** Si alguna vez el front
 *  tiene que ordenar de verdad —un encabezado que se aprieta—, el cable va a
 *  tener que traer la dirección; queda anotado en F1.44 y no se resuelve acá.
 */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { hue } from '../plots/core/seriesColor'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { NumberOptions } from '../format'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY.
 *
 *  **`table` es de los seis que no son plots** y es el único que §5 le da a
 *  `tabular`, así que la lista es corta por el repertorio y no por lo
 *  construido. Se declara igual: hace que pedirlo y no pedir nada dibujen lo
 *  mismo, y que cualquier otro id —uno de `ranking`, que es la otra forma a la
 *  que `table` sirve— caiga en el estado y no en esta tabla. */
const DIBUJA = ['table'] as const

export type TableParams = {
  /** Qué columnas mostrar, en orden. Sin esto se muestran todas. */
  columnas?: string[]
}

const ABBREVIATE_FROM = 1000
const MAX_DECIMALS = 2

export function TableBody({
  value,
  params,
  family,
  grafico,
  format,
}: BodyProps<'tabular', TableParams>) {
  // La comprobación va ANTES de dibujar, no dentro de una rama · mismo idioma
  // que `SeriesBody` y `ForecastBody`: resuelta abajo, la rama que se olvide se
  // ve bien.
  const conocidos: readonly string[] = DIBUJA
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  const { columnas: requested } = params

  const columns =
    requested === undefined
      ? value.columnas
      : requested
          .map((c) => value.columnas.find((col) => col.clave === c))
          .filter((c): c is (typeof value.columnas)[number] => c !== undefined)

  const rows = value.filas

  const first = columns[0]

  /** Cómo formatear una columna numérica ENTERA, no cada celda por su cuenta.
   *
   *  Sin esto una columna de ROAS sale «4.2 · 4.5 · 3.5 · 3»: la última pierde
   *  su decimal, el punto deja de alinearse y la columna se lee mal aunque cada
   *  celda esté bien. `Columna` no declara decimales, así que se infieren de lo
   *  que hay — **es propuesta de spec agregarlos al contrato.** */
  const columnFormat = (key: string): NumberOptions => {
    const values = value.filas
      .map((f) => f[key])
      .filter((v): v is number => typeof v === 'number')
    const magnitude = Math.max(0, ...values.map(Math.abs))
    if (magnitude >= ABBREVIATE_FROM) return { abbreviate: true }
    return {
      decimals: Math.min(
        MAX_DECIMALS,
        Math.max(0, ...values.map((v) => (String(v).split('.')[1] ?? '').length)),
      ),
    }
  }

  return (
    <div className="h-full min-h-0 overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.clave}
                scope="col"
                className={`text-left pb-2 border-b border-w2 ${c.numerica ? 'text-right' : ''}`}
              >
                <Label>{c.titulo}</Label>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={String(row[first?.clave ?? ''] ?? i)} className="border-b border-w1">
              {columns.map((c, j) => {
                const cell = row[c.clave]
                if (c.numerica && typeof cell === 'number') {
                  return (
                    <td key={c.clave} className="py-1 text-right">
                      {/* `fromContext`: la celda hereda el nombre del encabezado
                          de columna, que tiene `scope`. Un label propio la haría
                          decir el nombre dos veces. */}
                      <Value label={c.titulo} size="cell" labelVisibility="fromContext">
                        {format.number(cell, columnFormat(c.clave))}
                      </Value>
                    </td>
                  )
                }
                // ── **UNA COLUMNA NUMÉRICA SIGUE ALINEADA A LA DERECHA AUNQUE
                //      LA CELDA FALTE** · 2026-10-01 ──────────────────────────
                //
                // La rama de arriba exige `typeof cell === 'number'`, así que una
                // celda numérica AUSENTE cae acá y perdía el `text-right`: el
                // `—` se pintaba a la izquierda de una columna cuyo encabezado
                // está a la derecha, y quedaba pegado a la cifra de la columna
                // anterior. Medido en `platform_return` del mes en curso, donde
                // `sales` y `roas` no vienen: se leía `1,225.14—`.
                //
                // Se decide por `c.numerica` —lo que la COLUMNA declara— y no
                // por el tipo del valor, que es justamente lo que falta.
                // El `${…}` va ENTRE ESPACIOS y aporta la utilidad entera ·
                // `tests/tokens/escala.test.ts` lo exige, y tiene razón: pegado a
                // `text-ink` el escáner de Tailwind lee `text-ink${…}` y la clase
                // no se emite. Compila, el DOM sale bien y se pinta sin alinear.
                const alineacion = c.numerica ? 'text-right' : ''
                return (
                  <td key={c.clave} className={`py-1 font-body text-cuerpo text-ink ${alineacion}`}>
                    {j === 0 ? (
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-xs shrink-0"
                          style={{ background: hue({ family }) }}
                          aria-hidden
                        />
                        <span className="truncate">{cell ?? '—'}</span>
                      </span>
                    ) : (
                      (cell ?? '—')
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

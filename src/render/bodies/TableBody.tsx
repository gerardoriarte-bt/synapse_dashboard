/** `table` · forma `tabular` · colSpan 5–8, rowSpan 4–5 · F1.13g
 *
 *  **El cuerpo NO decide cuántas filas caben**: la tabla scrollea dentro del alto
 *  que le da el `rowSpan`. Un panel que crece con sus datos rompe la fila de la
 *  grilla, que es lo que §3 impide.
 */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { hue } from '../plots/core/seriesColor'
import type { NumberOptions } from '../format'
import type { BodyProps } from '../types'

export type TableParams = {
  /** Qué columnas mostrar, en orden. Sin esto se muestran todas. */
  columnas?: string[]
  orden?: { columna: string; direccion: 'desc' | 'asc' }
}

const ABBREVIATE_FROM = 1000
const MAX_DECIMALS = 2

export function TableBody({ value, params, family, format }: BodyProps<'tabular', TableParams>) {
  const { columnas: requested, orden } = params

  const columns =
    requested === undefined
      ? value.columnas
      : requested
          .map((c) => value.columnas.find((col) => col.clave === c))
          .filter((c): c is (typeof value.columnas)[number] => c !== undefined)

  const rows =
    orden === undefined
      ? value.filas
      : [...value.filas].sort((a, b) => {
          const x = a[orden.columna]
          const y = b[orden.columna]
          const n = typeof x === 'number' && typeof y === 'number' ? x - y : 0
          return orden.direccion === 'desc' ? -n : n
        })

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
                return (
                  <td key={c.clave} className="py-1 font-body text-[13px] text-ink">
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

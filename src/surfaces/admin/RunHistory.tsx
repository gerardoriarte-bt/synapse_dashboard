/** El historial de materializaciones · 2026-10-01
 *
 *  ── ES UN AGREGADO NUESTRO AL DIBUJO, Y VA DICHO ────────────────────────────
 *
 *  **El `.pen` NO dibuja esto.** El frame `A5 · Salud de feeds` tiene las ocho
 *  columnas de la tabla de fuentes y el CTA `SINCRONIZAR TODO`, y nada sobre
 *  corridas — leído del archivo, no supuesto. Así que esta sección es una
 *  divergencia declarada y no una lectura del dibujo.
 *
 *  **Por qué se agregó igual**: el 2026-10-01 se corrieron ocho períodos a mano
 *  y no había desde dónde mirar cómo salieron. Hoy la única forma de saber si
 *  una corrida terminó es consultar la base, que es exactamente lo que la
 *  superficie de administración existe para evitar.
 *
 *  ── POR AHORA 2026, Y LA CAPACIDAD DE SUMAR AÑOS ────────────────────────────
 *
 *  **Decisión humana del 2026-10-01**: se muestra 2026 y el control para sumar
 *  años anteriores existe desde el primer día. La lista de años **sale de los
 *  datos** —los que de verdad tienen corridas— y no de una constante: un año
 *  cableado a mano se vence el 1 de enero, y uno que nadie corrió no se ofrece.
 *
 *  **Lo que esta pantalla NO decide es cuánto histórico muestra la CONSOLA.**
 *  Eso sale de `availablePeriods()` del servicio, que está clavada en doce meses
 *  sin mirar tenant ni dashboard —leído de su código— y es un pedido aparte.
 *
 *  ── LOS CONTADORES NO SE SUMAN ──────────────────────────────────────────────
 *
 *  Van los cinco y no un total, porque `preservadas` es la regla de preservación
 *  del servicio —un disponible previo que no se pisó— así que una métrica puede
 *  contarse ahí **y seguir disponible**. Un total daría más métricas de las que
 *  el cliente tiene.
 */
import { useMemo, useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Opcion } from '../../render/primitives/Opcion'
import { Note } from '../../render/primitives/Note'
import { EmptyRow } from './EmptyRow'
import type { Corrida } from '../../api/admin'
import type { Formatter } from '../../render/format'

const COLUMNAS = ['Período', 'Cuándo', 'Origen', 'Disponibles', 'Bloqueadas', 'Errores', 'Preservadas'] as const

/** El año que se muestra sin que nadie elija. **No es `new Date()`**: eso haría
 *  que la pantalla cambiara sola el 1 de enero y mostrara un año vacío, que es
 *  el mismo defecto que la consola tuvo con el mes abierto. Es el año más
 *  reciente CON corridas, que siempre tiene algo que mostrar. */
function anios(corridas: readonly Corrida[]): string[] {
  return [...new Set(corridas.map((c) => c.periodo.slice(0, 4)))].sort().reverse()
}

/** Una corrida terminó cuando tiene fin. **No se mira `estado`**: su vocabulario
 *  es del servicio y puede ganar valores; la ausencia de `terminadaEn` es un
 *  hecho estructural que no cambia con ellos. */
const enVuelo = (c: Corrida) => c.terminadaEn === null

type Props = {
  corridas: readonly Corrida[]
  /** Del locale del TENANT · F1.13b. Las fechas se redactan con él. */
  format: Formatter
  cargando?: boolean
}

export function RunHistory({ corridas, format, cargando = false }: Props) {
  const disponibles = useMemo(() => anios(corridas), [corridas])
  const [anio, setAnio] = useState<string | null>(null)
  const activo = anio ?? disponibles[0] ?? null
  const visibles = useMemo(
    () => (activo === null ? [] : corridas.filter((c) => c.periodo.startsWith(activo))),
    [corridas, activo],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Label as="div">Historial de cargas</Label>

        {/* **Los años salen del dato.** Con uno solo igual se pinta: decir «2026»
            es contexto, y esconderlo haría que la tabla no dijera de cuándo es. */}
        <div className="flex items-center gap-2">
          {/* **`Opcion` y no `Accion`** · 2026-10-06: elegir un año no ejecuta
              nada, cambia qué se mira. */}
          {disponibles.map((a) => (
            <Opcion key={a} elegida={a === activo} onClick={() => setAnio(a)}>
              {a}
            </Opcion>
          ))}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-w3">
            {COLUMNAS.map((c) => (
              <th key={c} className="py-2 text-left">
                <Label as="div">{c}</Label>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando && (
            <EmptyRow
              clase="sistema"
              columnas={COLUMNAS.length}
              razon="Trayendo el historial"
              salida="Un momento"
            />
          )}

          {!cargando && visibles.length === 0 && (
            <EmptyRow
              clase="sistema"
              columnas={COLUMNAS.length}
              razon="Todavía no hay cargas registradas para este cliente"
              salida="Queda una fila cada vez que se calculan las métricas de un período"
            />
          )}

          {visibles.map((c) => (
            <tr key={c.id} className="border-b border-w3">
              <td className="py-2">
                <span className="text-ink text-celda">{c.periodo}</span>
              </td>
              <td className="py-2">
                {/* **En vuelo se dice, no se deja en blanco.** Una corrida sin
                    fin con la celda vacía se lee como una que falló sin avisar. */}
                {enVuelo(c) ? (
                  <Note as="div">En curso</Note>
                ) : (
                  <span className="text-ink text-celda">
                    {`${format.calendar(c.arrancadaEn)}, ${format.clock(c.arrancadaEn)}`}
                  </span>
                )}
              </td>
              <td className="py-2">
                <Note as="div">{c.disparo === 'manual' ? 'A pedido' : 'Programada'}</Note>
              </td>
              <td className="py-2">
                <span className="text-ink text-celda">{String(c.disponibles)}</span>
              </td>
              <td className="py-2">
                <span className="text-ink text-celda">{String(c.bloqueadas)}</span>
              </td>
              <td className="py-2">
                {/* **El único que puede llevar acento**, y sólo cuando hay: un
                    error es algo que alguien tiene que mirar, que es para lo que
                    el naranja está permitido. En cero va como los demás. */}
                <span className={c.errores > 0 ? 'text-acc text-celda' : 'text-ink text-celda'}>
                  {String(c.errores)}
                </span>
              </td>
              <td className="py-2">
                <span className="text-ink text-celda">{String(c.preservadas)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* La razón de que los cinco no se sumen, dicha donde se ven. */}
      <Ayuda>
        Preservadas son las que ya tenían un valor y no se recalcularon: no son una falla.
      </Ayuda>
    </div>
  )
}

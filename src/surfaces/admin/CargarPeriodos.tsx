/** Cargar meses de un cliente · A5 · 2026-10-07
 *
 *  ── ES UN AGREGADO AL DIBUJO, Y VA DICHO ────────────────────────────────────
 *
 *  **El `.pen` no lo dibuja.** `A5 · Salud de feeds` tiene la tabla de fuentes y
 *  `SINCRONIZAR TODO`, que no tiene ruta; nada sobre cargar meses. Va acá, junto
 *  al historial —otro agregado declarado en `RunHistory`—, porque es la otra
 *  mitad de la misma pregunta: cuándo se cargó cada mes, y cargar el que falta.
 *
 *  **Por qué existe**: el scheduler diario sólo calcula el mes en curso y el
 *  anterior, y un cliente que entra a mitad de año con datos previos se queda
 *  sin ellos. Decisión humana del 2026-10-07. Ver `cargaDePeriodos.ts`.
 *
 *  ── CUATRO REGISTROS ────────────────────────────────────────────────────────
 *
 *  Un mes es una `Opcion` —se elige, no ejecuta— y cargar es una `Accion`. **Sin
 *  `onCargar` la acción no se pinta**: un botón que devuelve 403 es peor que uno
 *  ausente. Los meses sí, porque igual dicen qué está cargado.
 */
import { useMemo, useState } from 'react'
import { Accion } from '../../render/primitives/Accion'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Label } from '../../render/primitives/Label'
import { Opcion } from '../../render/primitives/Opcion'
import { aniosOfrecidos, mesesDelAnio } from './cargaDePeriodos'
import type { Formatter } from '../../render/format'

type Props = {
  /** `YYYY-MM` en el huso del cliente · `mesEnCurso`. */
  mesActual: string
  cargados: ReadonlySet<string>
  enCurso: ReadonlySet<string>
  /** Ausente = sin permiso o sin cliente: la acción no se pinta. */
  onCargar?: (periodos: string[]) => void
  enviando?: boolean
  /** La frase del servicio cuando el pedido falló, tal cual. */
  error?: string | null
  /** Los meses pedidos que todavía no terminaron. */
  pendientes?: readonly string[]
  /** Los que pasaron el tope de espera sin terminar · se dice y se deja de
   *  mirar, en vez de prometer «cargando» para siempre. */
  sinTerminar?: readonly string[]
  format: Formatter
}

export function CargarPeriodos({
  mesActual,
  cargados,
  enCurso,
  onCargar,
  enviando = false,
  error = null,
  pendientes = [],
  sinTerminar = [],
  format,
}: Props) {
  const anios = useMemo(() => aniosOfrecidos(mesActual), [mesActual])
  const [anio, setAnio] = useState(anios[0] ?? '')
  const [elegidos, setElegidos] = useState<ReadonlySet<string>>(new Set())
  const meses = useMemo(() => mesesDelAnio(anio, mesActual), [anio, mesActual])
  const faltantes = meses.filter((m) => !cargados.has(m) && !enCurso.has(m))

  const alternar = (m: string) =>
    setElegidos((prev) => {
      const sig = new Set(prev)
      if (sig.has(m)) sig.delete(m)
      else sig.add(m)
      return sig
    })

  // Los elegidos de OTROS años siguen elegidos: se puede armar un pedido que
  // cruce el cambio de año sin perder lo marcado.
  const pedido = [...elegidos].sort()

  return (
    <div className="flex flex-col gap-3">
      <Label as="div">Cargar meses</Label>
      <Ayuda>
        Calcula las métricas de los meses elegidos a partir de Snowflake. Sirve para un cliente
        nuevo que ya tiene datos de antes, o para un mes que quedó sin cargar. La carga automática
        diaria solo calcula el mes en curso y el anterior.
      </Ayuda>

      <div className="flex items-center gap-2" role="group" aria-label="Año">
        {anios.map((a) => (
          <Opcion key={a} elegida={a === anio} onClick={() => setAnio(a)}>
            {a}
          </Opcion>
        ))}
      </div>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={`Meses de ${anio}`}
      >
        {meses.map((m) => {
          const estado = enCurso.has(m) ? 'en curso' : cargados.has(m) ? 'cargado' : 'sin cargar'
          return (
            <Opcion
              key={m}
              forma="chip"
              elegida={elegidos.has(m)}
              onClick={() => alternar(m)}
              etiqueta={`${format.axisDate(`${m}-01`, 'mes')} · ${estado}`}
            >
              <span className="flex flex-col items-start leading-rotulo">
                <span>{format.axisDate(`${m}-01`, 'mes')}</span>
                <span className="font-mono text-nota uppercase tracking-rotulo text-dim">
                  {estado}
                </span>
              </span>
            </Opcion>
          )
        })}
      </div>

      {onCargar === undefined ? null : (
        <div className="flex flex-wrap items-center gap-2">
          {/* **Elegir los que faltan es una opción, no una carga**: marca, y
              cargar sigue siendo un segundo paso que se ve antes de ejecutarse. */}
          <Opcion
            elegida={false}
            deshabilitada={faltantes.length === 0}
            onClick={() => setElegidos((prev) => new Set([...prev, ...faltantes]))}
          >
            {`Elegir los ${String(faltantes.length)} sin cargar de ${anio}`}
          </Opcion>
          <Accion
            variante="primaria"
            deshabilitada={pedido.length === 0 || enviando}
            onClick={() => {
              onCargar(pedido)
              setElegidos(new Set())
            }}
          >
            {pedido.length === 0
              ? 'Cargar meses'
              : pedido.length === 1
                ? 'Cargar 1 mes'
                : `Cargar ${String(pedido.length)} meses`}
          </Accion>
        </div>
      )}

      {error === null ? null : <Ayuda>{`No se pudo pedir la carga: ${error}`}</Ayuda>}

      {sinTerminar.length === 0 ? null : (
        <Ayuda>
          {`No terminaron en diez minutos: ${sinTerminar.join(', ')}. El historial dice si arrancaron; si no, se pueden volver a pedir.`}
        </Ayuda>
      )}

      {pendientes.length === 0 ? null : (
        <Ayuda>
          {`Cargando ${pendientes.join(', ')}. Cada mes tarda unos segundos; el historial de abajo los muestra a medida que terminan.`}
        </Ayuda>
      )}
    </div>
  )
}

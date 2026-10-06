/** BASE y procedencia detrás de un ⓘ · decisión humana del 2026-10-06
 *
 *  ── ESTO VA CONTRA DOS REGLAS DURAS, Y ES A PROPÓSITO ───────────────────────
 *
 *  `design.md` §1.2 pide que toda métrica declare su BASE «en label arriba a la
 *  derecha» (regla 8) y su procedencia, que «no es letra chica» (regla 9), y §6
 *  hace el badge «obligatorio, no opcional». **El humano decidió el 2026-10-06
 *  esconderlas detrás de este ícono**, mirando los diez paneles de UA en QA:
 *  «ensucian la lectura […] mientras más pequeña es la card es más molesto».
 *
 *  **Lo que se midió antes de decidir**: la spec da a la BASE «unos 30
 *  caracteres» y al badge una fuente como `ERP`; el catálogo firmado manda
 *  BASE de 51 a 147 caracteres y fuentes de 39 a 94. Son descripciones, no
 *  rótulos, y en un panel de tres columnas ocupaban más alto que la cifra. Se
 *  ofrecieron tres salidas —dos capas, todo detrás del ícono, o sólo pedir
 *  rótulos cortos a datos— y se eligió ésta. Queda en la PROPUESTA del
 *  2026-09-22 §12 para que diseño la refleje en `design.md` y en el `.pen`.
 *
 *  **Lo que NO se escondió**: el badge de DEGRADADO. Es estado, no procedencia:
 *  dice que la cifra está vencida, y eso no puede depender de que alguien pase
 *  el cursor. Lo pinta el shell, al lado de este ícono.
 *
 *  ── CÓMO SE ABRE, Y POR QUÉ DE TRES MANERAS ─────────────────────────────────
 *
 *  - **Pasando el cursor**, que es lo que se pidió.
 *  - **Con el foco del teclado**: una procedencia que sólo existe para el mouse
 *    no existe para quien navega sin uno.
 *  - **Con un toque**, que queda fijado hasta tocar afuera o apretar Escape: en
 *    una pantalla táctil no hay hover, y la consola baja hasta 360px.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { Label } from '../primitives/Label'
import { Provenance } from './Provenance'
import type { Formatter } from '../format'

type Props = {
  base: string
  ventana: string
  capa: string
  fuente: string
  frescura: string | null
  format: Formatter
  now: Date
}

export function MetaInfo({ base, ventana, capa, fuente, frescura, format, now }: Props) {
  const [encima, setEncima] = useState(false)
  const [fijado, setFijado] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const id = useId()
  const abierto = encima || fijado

  // Fijado con un toque, se suelta tocando afuera. Sólo escucha mientras está
  // fijado: doce paneles con un listener permanente cada uno es ruido.
  useEffect(() => {
    if (!fijado) return
    const fuera = (e: PointerEvent) => {
      if (caja.current !== null && !caja.current.contains(e.target as Node)) setFijado(false)
    }
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [fijado])

  return (
    <div
      ref={caja}
      className="relative shrink-0"
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setEncima(false)
          setFijado(false)
        }
      }}
    >
      <button
        type="button"
        aria-label="Base y procedencia"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setFijado((f) => !f)}
        onFocus={() => setEncima(true)}
        onBlur={() => setEncima(false)}
        className="flex items-center justify-center w-6 h-6 rounded-sm text-dim hover:text-ink focus-visible:text-ink cursor-pointer bg-transparent border-0 p-0"
      >
        {/* `info` de lucide, el mismo que el `.pen` usa en A1. */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
      </button>

      {abierto ? (
        <div
          id={id}
          role="tooltip"
          className="absolute right-0 top-full mt-2 z-20 w-72 flex flex-col gap-3 bg-elev border border-w3 rounded-md p-4 text-left"
        >
          <dl className="flex flex-col gap-3 m-0">
            <div className="flex flex-col gap-1">
              <Label as="dt">Base</Label>
              <dd className="font-body text-cuerpo leading-cuerpo text-ink m-0">{base}</dd>
            </div>
            {ventana === '' ? null : (
              <div className="flex flex-col gap-1">
                <Label as="dt">Ventana</Label>
                <dd className="font-body text-cuerpo leading-cuerpo text-ink m-0">{ventana}</dd>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Label as="dt">Procedencia</Label>
              <dd className="m-0">
                <Provenance capa={capa} fuente={fuente} frescura={frescura} format={format} now={now} />
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  )
}

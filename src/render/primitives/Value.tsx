/** Nunca se imprime un número suelto · regla dura 4 · F1.13c
 *
 *  Toda cifra del producto pasa por acá, así que `tabular-nums` no depende de
 *  que alguien se acuerde: es lo que hace que una columna de números se lea como
 *  columna y que un valor que cambia no mueva a sus vecinos.
 *
 *  **NO FORMATEA.** Recibe el texto ya compuesto. En v2 este componente
 *  importaba el formateador y con él la constante `es-MX`, que es justo la
 *  dependencia que F1.13b saca de `render/`: el locale es del tenant y un
 *  primitivo no sabe de qué tenant se trata. Quien tiene el `Formatter` —el
 *  cuerpo, que lo recibe por props— compone el texto y lo pasa hecho.
 */
import type { ReactNode } from 'react'
import { Label } from './Label'

/** Los tres roles de cifra de §2.3. El KPI no baja de 44px para que entre una
 *  cifra larga: se abrevia la cifra, que para eso `Formatter.number` tiene
 *  `abbreviate`. */
const SIZE = {
  kpi: 'font-body font-bold text-[44px] leading-[1.05] tracking-[-0.01em] text-ink',
  cell: 'font-mono text-[12px] text-right text-ink',
  body: 'font-body text-[13px] text-ink',
} as const

/** Sigue en el árbol de accesibilidad aunque no se pinte. `w-px`/`h-px` y no
 *  cero: la caja mínima deja el texto disponible para un lector, y un `h-0` lo
 *  sacaría de ahí. */
const SCREEN_READER_ONLY =
  'absolute w-px h-px p-0 -m-px overflow-hidden [clip-path:inset(50%)] whitespace-nowrap border-0'

type Props = {
  /** Obligatorio en el tipo. Es lo que convierte «ningún número desnudo» de
   *  hallazgo del lint en error de compilación. */
  label: string
  /** La cifra YA formateada y con su unidad compuesta. */
  children: ReactNode
  size?: keyof typeof SIZE
  /** Dónde vive el label · S3-2, resuelto el 2026-08-19.
   *
   *  Era un booleano `labelOculto` y no alcanzaba, porque tapaba DOS casos que
   *  se comportan distinto ante un lector de pantalla:
   *
   *  - `visible` — se pinta. El caso normal.
   *  - `screenReader` — no se ve, se lee. La cifra vive en una fila que ya se
   *    entiende a la vista, pero suelta en el árbol de accesibilidad no diría
   *    de qué es.
   *  - `fromContext` — **no se ve ni se lee**, porque el entorno ya la nombra.
   *    Una celda dentro de una tabla con `scope` hereda el nombre del
   *    encabezado de columna; agregarle un label propio la hace decir el
   *    nombre dos veces. */
  labelVisibility?: 'visible' | 'screenReader' | 'fromContext'
}

export function Value({ label, children, size = 'body', labelVisibility = 'visible' }: Props) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {labelVisibility === 'visible' && <Label>{label}</Label>}
      {labelVisibility === 'screenReader' && <span className={SCREEN_READER_ONLY}>{label}</span>}
      {/* SIN `aria-label`. Lo tenía, y un `aria-label` sobre el nodo que
          contiene la cifra no la acompaña: la REEMPLAZA. Un lector decía el
          nombre del label dos veces y el número ninguna. */}
      <span className={`block tabular-nums ${SIZE[size]}`}>{children}</span>
    </div>
  )
}

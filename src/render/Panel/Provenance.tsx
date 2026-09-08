/** Capa Medallion · fuente · frescura · F1.13e
 *
 *  §1.3 la hace obligatoria en toda métrica, así que el shell la pinta siempre,
 *  incluso cuando no hay cuerpo. Una cifra sin procedencia no es una cifra: es
 *  un número.
 */
import { Label } from '../primitives/Label'
import type { Formatter } from '../format'

type Props = {
  capa: string
  fuente: string
  /** `null` cuando el panel no tiene cifra: un bloqueado no tiene frescura de
   *  cifra porque no hay cifra. La capa y la fuente sí, del catálogo. */
  frescura: string | null
  /** Inyectado, como todo formateo · F1.13b: la frescura se escribe con el
   *  locale del tenant y `render/` no sabe de qué tenant se trata. */
  format: Formatter
  /** Para que la frescura relativa sea determinista en una prueba y no dependa
   *  del reloj de quien renderiza. */
  now: Date
}

export function Provenance({ capa, fuente, frescura, format, now }: Props) {
  return (
    <span className="flex items-center gap-1 min-w-0">
      {/* La capa va en su propia caja para que no se corte: es lo primero que
          se lee de la procedencia y BRONZE/SILVER/GOLD cambia cómo se
          interpreta el número. */}
      <Label>{capa}</Label>
      <Label>
        <span className="truncate">
          · {fuente}
          {frescura === null ? '' : ` · ${format.freshness(frescura, now)}`}
        </span>
      </Label>
    </span>
  )
}

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
    // `items-start` y no `items-center`: la fuente ocupa varias líneas y la capa
    // tiene que alinearse con la PRIMERA, no centrarse contra el bloque entero.
    <span className="flex items-start gap-1 min-w-0">
      {/* La capa va en su propia caja para que no se corte: es lo primero que
          se lee de la procedencia y BRONZE/SILVER/GOLD cambia cómo se
          interpreta el número. `shrink-0` lo sostiene: es una palabra, y
          dejarla encogerse la partiría antes que a la frase de al lado. */}
      <span className="shrink-0">
        <Label>{capa}</Label>
      </span>
      {/* ── POR QUÉ ENVUELVE Y NO RECORTA · 2026-09-25 ───────────────────────
       *
       *  Acá había un `truncate`, y **no recortaba nada**: `truncate` es
       *  `nowrap` + `overflow:hidden`, y sobre un `<span>` inline dentro de otro
       *  span no hay caja con ancho que clipear. Quedaba el `nowrap` solo, así
       *  que la fuente se salía del panel — medido el 2026-09-25 con el catálogo
       *  real: 360px fuera en ROAS, 317 en Unidades, 310 en Órdenes, y **292px
       *  de scroll horizontal en la página entera**.
       *
       *  No se vio antes porque la maqueta traía `ERP` y `Ads API`. El catálogo
       *  que datos curó trae frases: «Reporte diario de ecommerce del cliente ·
       *  venta medida por Adobe Analytics».
       *
       *  Se arregla envolviendo y no recortando, por dos razones. §1.3 hace la
       *  procedencia obligatoria y un ellipsis esconde parte de ella. Y la línea
       *  de BASE, en esta misma columna y más larga, **ya envuelve**: recortar
       *  una y envolver la otra es la inconsistencia que hacía difícil verlo.
       *
       *  El `min-w-0` es lo que lo hace posible: sin él un ítem de flex no baja
       *  de su contenido y no hay dónde envolver. */}
      <span className="min-w-0">
        <Label>
          · {fuente}
          {frescura === null ? '' : ` · ${format.freshness(frescura, now)}`}
        </Label>
      </span>
    </span>
  )
}

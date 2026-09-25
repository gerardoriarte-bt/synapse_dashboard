/** La limitación de un panel degradado · §ANCLA:DEGRAD-1 · §8 · F1.13e
 *
 *  §8 de `design.md`, fila «Degradado»: «El panel muestra el dato con un badge
 *  que **declara la limitación y su alcance**». Hasta el 2026-09-25 el badge
 *  decía sólo la palabra «Degradado» y `razon` y `desbloqueaCon` **se
 *  descartaban**, aunque el payload los trae obligatorios.
 *
 *  **Tres lugares describían el comportamiento y ninguno lo implementaba**:
 *  `states/README.md` («la cifra sí, más razón y qué la desbloquea»), el
 *  comentario de `DegradedBadge` («la razón y el CTA los pone el shell debajo»)
 *  y el título del `describe` de F2.1 («y la limitación al lado»). La prueba de
 *  F2.1 verificaba la cifra y el badge; su fixture ya traía los dos campos y
 *  ninguna aserción los miraba.
 *
 *  No lo vio nadie porque hasta el 2026-09-24 **ningún panel volvió DEGRADADO
 *  desde el servicio real**: el estado existía en las pruebas y no en pantalla.
 *
 *  ── POR QUÉ ACÁ Y NO EN EL CUERPO ──────────────────────────────────────────
 *
 *  Porque el degradado **no reemplaza el cuerpo** —es el estado con cifra— así
 *  que no puede usar `StateBody` como los otros cinco. La limitación es del
 *  shell, igual que la BASE y la procedencia.
 *
 *  Va a ancho completo y no en la columna de meta, que es angosta y va alineada
 *  a la derecha: `razon` es una frase escrita desde el lado del usuario —«El
 *  feed de inventario tiene 31 horas», §8— y una frase larga ahí es justo lo
 *  que el 2026-09-24 dejó al título en cero ancho.
 *
 *  **En mono y no en prosa**, que es el registro del shell: todo lo que no es el
 *  título del panel es metadato. La frase describe el DATO, no es el dato.
 *
 *  ── LO QUE ESTO NO HACE, Y ESTÁ ESCRITO ────────────────────────────────────
 *
 *  **Sin CTA.** El principio 15 lo pide —«estado, razón, qué lo desbloquea y un
 *  CTA»— y la fila de §8 para degradado no: pide el badge con la limitación, y
 *  reserva «Razón, qué lo desbloquea, CTA» para la fila de bloqueado. Gana la
 *  más específica para lo que se implementa, y la diferencia queda anotada en
 *  `docs/PROPUESTA-2026-09-25-degradado.md` en vez de resolverse en silencio.
 *
 *  **Sin marcar el tramo vencido.** El `.pen` dibuja el degradado en
 *  `Librería de gráficos/Row 23 · Estados/ESTADO · Degradado` con las dos
 *  últimas barras en `$w2` y la nota «LA TRAMA MARCA EL TRAMO VENCIDO». Eso es
 *  tratamiento del cuerpo, necesita saber QUÉ tramo venció —dato que el cable
 *  no manda— y va en la misma propuesta.
 */
import { Label } from '../primitives/Label'

type Props = {
  /** Qué limitación tiene el dato y cuál es su alcance · así lo declara el
   *  contrato para `PayloadDegradado.razon`. */
  reason: string
  unblockedBy: string
}

export function DegradedNote({ reason, unblockedBy }: Props) {
  // Las dos son obligatorias en el contrato, pero el adaptador las deja en ''
  // cuando el cable no las manda —`w.reason ?? ''`—, y un rótulo vacío es
  // ruido: «QUÉ LO DESBLOQUEA ·» sin nada detrás no dice nada.
  const hayRazon = reason.trim() !== ''
  const hayDesbloqueo = unblockedBy.trim() !== ''
  if (!hayRazon && !hayDesbloqueo) return null

  return (
    <div className="flex flex-col gap-1 border-t border-w2 pt-2">
      {hayRazon && <Label as="div">{reason}</Label>}
      {/* Mismo literal que `BlockedState`, a propósito: §8 existe para que cada
          pantalla no invente su gramática de degradación. */}
      {hayDesbloqueo && <Label as="div">{`Qué lo desbloquea · ${unblockedBy}`}</Label>}
    </div>
  )
}

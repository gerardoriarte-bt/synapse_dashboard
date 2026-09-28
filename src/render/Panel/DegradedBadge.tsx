/** El badge de degradado · §8 · §PEN:Panel/Badge Degradado
 *
 *  El degradado **muestra el dato** con un badge que declara la limitación. La
 *  razón y el CTA los pone el shell debajo; el badge solo marca.
 *
 *  ── REESCRITO EL 2026-09-28 PARA QUE COINCIDA CON EL DIBUJO ─────────────────
 *
 *  Acá había un `<Label>` —mono 10, `dim`— dentro de un `bg-w3`. **Las tres
 *  cosas eran invención nuestra**: el `.pen` dibuja `V9PYxO` como un chip **sin
 *  relleno**, con borde `$acc`, icono `triangle-alert` de 10 y texto **mono 9**
 *  en `$acc`. Lo encontró la sesión que dibuja, auditando en paralelo.
 *
 *  **Y esa divergencia ERA el defecto que `contraste` reportaba** desde su
 *  primera corrida. Medido el 2026-09-28 con `tools/contraste.py`:
 *
 *      `dim` sobre `w3` sobre `panel`   4.17  ✗   ← lo que había
 *      `acc` sobre `panel`              4.91  ✓   ← lo que el dibujo pide
 *
 *  El wash era lo único que hundía el par bajo 4.5. Con eso queda contestada la
 *  **pregunta 13 de B0.9**, y sin ninguna de sus tres salidas escritas —subir la
 *  luminosidad de `dim`, bajar el alfa de `w3`, o quitarle el wash al badge—:
 *  no hacía falta elegir, porque el wash no estaba dibujado.
 *
 *  ── POR QUÉ ES NARANJA, QUE ES UNA EXCEPCIÓN Y NO UN DESCUIDO ───────────────
 *
 *  §2.1 cierra los usos del acento en cinco —«CTAs, estado activo, enlaces,
 *  cifras resaltadas dentro de un titular en prosa, barra lateral del ítem
 *  activo»— y da la razón: «su exclusividad como color de acción es lo que lo
 *  hace legible». **Un badge de degradación no es ninguno de los cinco.**
 *
 *  Se levantó como tensión en `docs/AUDITORIA-2026-09-28-dibujo-c6-e-identidad.md`
 *  y **la decidió un humano el 2026-09-28: va el badge entero**. Queda escrito
 *  acá para que no se «corrija» citando §2.1 — es una excepción con dueño y
 *  fecha, no un olvido. Ver `docs/DECISIONES-2026-09-28-badge-degradado.md`.
 *
 *  **Lo que NO cambia** es la regla dura 3: el color no carga el juicio. El
 *  naranja acá no dice «malo» —para eso estarían el ámbar o el rojo, los dos
 *  prohibidos—: dice «esto reclama una acción», que es lo mismo que dice en un
 *  CTA. La severidad la carga el texto.
 *
 *  ── LA TIPOGRAFÍA NO PASA POR `Label`, Y ES A PROPÓSITO ─────────────────────
 *
 *  `Label` es mono **10** por definición de rol —§2.3, `§ANCLA:TIPO-1`— y el
 *  dibujo pide **9**, que es el tamaño de nota. Envolverlo en `Label` habría
 *  vuelto a pintar 10.
 *
 *  Por eso el texto pasa por **`Note`**, la primitiva del otro rol mono que §2.3
 *  declara. Escribir las utilidades a mano acá lo marcó `L15` —«arma un label
 *  inline»— y tenía razón: la regla existe para que el rol viva en un lugar. Lo
 *  que faltaba no era una excepción, era la primitiva.
 *
 *  **El color lo pone el chip y la nota lo hereda**, que es la diferencia entre
 *  `Note` y `Label`: la nota no tiene un gris propio.
 */

import { Note } from '../primitives/Note'

/** `triangle-alert` de lucide, que es el que el `.pen` nombra. `currentColor`
 *  para que herede el `text-acc` del chip y el color viva en un solo lugar. */
function AlertMark() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

export function DegradedBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex h-4.5 items-center gap-1.25 rounded-xs border border-acc px-1.75 text-acc">
      <AlertMark />
      <Note>{children}</Note>
    </span>
  )
}

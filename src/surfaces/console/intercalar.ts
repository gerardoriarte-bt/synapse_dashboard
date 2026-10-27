/** La prosa del agente, partida donde el agente puso cada cifra · 2026-10-27
 *
 *  **El problema que resuelve lo encontró el humano usándolo**: una respuesta
 *  presentaba una tabla —«esta es la inversión por plataforma»— y la tabla se
 *  dibujaba al final de todo, debajo de otros párrafos y de otras tablas. Se
 *  leía como si cada tabla fuera del último texto.
 *
 *  **El lugar sale de cuándo llegó**: `DatoEnRespuesta.enTexto` es cuánto texto
 *  había cuando llegó la cifra. Ver `useChat.ts`.
 *
 *  **Se corta al final del párrafo, nunca a mitad.** Los fragmentos del stream
 *  no respetan párrafos, y un corte en el largo exacto podría partir una frase
 *  o, peor, una tabla de markdown, que sólo se reconoce si sus líneas van
 *  juntas. Así que el corte avanza hasta el próximo `\n\n`, o hasta el final.
 *
 *  **Una cifra sin lugar va al final**, como iban todas antes:
 *
 *   · Sin `enTexto`: un turno reabierto, cuyo historial no lo guarda.
 *   · Con `enTexto` en cero: llegó antes que cualquier palabra. Es lo que pasa
 *     con el resultado de la herramienta SQL, que corre antes de que el agente
 *     escriba (`translateToolResult`, `cortex_sse.go`). Ahí no dice debajo de
 *     qué párrafo va, y ponerla arriba de todo sería adivinar.
 */

export type Tramo<D> = { texto: string; datos: D[] }

/** Dónde se corta para una cifra que llegó con `enTexto` caracteres de prosa. */
function corte(texto: string, enTexto: number | undefined): number {
  if (enTexto === undefined || enTexto <= 0 || enTexto >= texto.length) return texto.length
  // Ya en el borde de un párrafo: la cifra llegó entre dos bloques.
  if (texto.slice(0, enTexto).endsWith('\n\n')) return enTexto
  const fin = texto.indexOf('\n\n', enTexto)
  return fin === -1 ? texto.length : fin
}

export function intercalar<D extends { enTexto?: number }>(
  texto: string,
  datos: readonly D[],
): Tramo<D>[] {
  const tramos: Tramo<D>[] = []
  let desde = 0
  for (const dato of datos) {
    // `Math.max`: las cifras llegan en orden, pero un corte nunca vuelve atrás
    // —eso duplicaría prosa—.
    const hasta = Math.max(desde, corte(texto, dato.enTexto))
    const ultimo = tramos[tramos.length - 1]
    if (hasta === desde && ultimo !== undefined) {
      ultimo.datos.push(dato)
    } else {
      tramos.push({ texto: texto.slice(desde, hasta), datos: [dato] })
    }
    desde = hasta
  }
  if (desde < texto.length) {
    tramos.push({ texto: texto.slice(desde), datos: [] })
  }
  return tramos
}

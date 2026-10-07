/** Cargar meses de un cliente · la lógica, sin pantalla · 2026-10-07
 *
 *  ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 *  **El scheduler diario sólo calcula el mes en curso y el anterior**
 *  —`DD_MATERIALIZE_PERIODS_BACK`, default 1, leído en `7b717aa`—. En QA eso
 *  dejó el dashboard de UA sin nada antes de septiembre, aunque Snowflake tiene
 *  el año entero. Y es lo que le pasa a todo cliente que entra a mitad de año
 *  con datos previos: decisión humana del 2026-10-07, se cargan desde A5.
 *
 *  Acá vive lo que decide QUÉ se ofrece y CUÁNDO terminó lo pedido. La pantalla
 *  —`CargarPeriodos.tsx`— sólo lo dibuja.
 */
import type { Corrida } from '../../api/admin'

/** Cuántos años atrás se ofrecen, contando el en curso. Tres alcanzan para un
 *  cliente que llega con historia, y el servicio igual acepta cualquier mes: es
 *  un límite de la pantalla, no del dato. */
export const ANIOS_OFRECIDOS = 3

/** El mes en curso **del cliente** · vive en `render/format.ts`, que es el
 *  único lugar que arma un `Intl`. Se reexporta para que la pantalla tenga
 *  todo lo de la carga en un solo import. */
export { mesEnCurso } from '../../render/format'

/** Los años que se ofrecen, del más reciente al más viejo. */
export function aniosOfrecidos(mesActual: string): string[] {
  const anio = Number(mesActual.slice(0, 4))
  return Array.from({ length: ANIOS_OFRECIDOS }, (_, i) => String(anio - i))
}

/** Los meses de un año que se pueden pedir · **nunca uno futuro**: calcular un
 *  mes que no empezó deja una fila vacía que después se lee como «cargado». */
export function mesesDelAnio(anio: string, mesActual: string): string[] {
  return Array.from({ length: 12 }, (_, i) => `${anio}-${String(i + 1).padStart(2, '0')}`).filter(
    (m) => m <= mesActual,
  )
}

/** Los meses que tienen al menos una corrida TERMINADA sin error. Uno que
 *  sólo tiene corridas fallidas no está cargado, aunque tenga filas. */
export function mesesCargados(corridas: readonly Corrida[]): Set<string> {
  return new Set(
    corridas.filter((c) => c.terminadaEn !== null && c.error === '').map((c) => c.periodo),
  )
}

/** Los meses con una corrida en vuelo. */
export function mesesEnCurso(corridas: readonly Corrida[]): Set<string> {
  return new Set(corridas.filter((c) => c.terminadaEn === null).map((c) => c.periodo))
}

/** Lo que se pidió desde esta pantalla, y cuándo. */
export type Pedido = { periodos: readonly string[]; desde: number }

/** Margen para comparar el reloj del navegador con el del servicio. Sin él, un
 *  navegador adelantado un minuto daría por no arrancada una corrida que ya
 *  terminó, y la pantalla esperaría para siempre. */
const TOLERANCIA_MS = 60_000

/** Hasta cuándo se espera que aparezcan las filas. Pasado esto se deja de
 *  sondear y se dice, en vez de sondear para siempre. */
export const ESPERA_MAXIMA_MS = 10 * 60_000

/** Los meses pedidos que todavía no tienen una corrida terminada DESPUÉS del
 *  pedido. **Una corrida vieja del mismo mes no cuenta**: si contara, pedir de
 *  nuevo un mes ya cargado se daría por terminado antes de arrancar. */
export function faltanPorTerminar(pedido: Pedido, corridas: readonly Corrida[]): string[] {
  const desde = pedido.desde - TOLERANCIA_MS
  return pedido.periodos.filter(
    (p) =>
      !corridas.some(
        (c) => c.periodo === p && c.terminadaEn !== null && Date.parse(c.arrancadaEn) >= desde,
      ),
  )
}

/** Si la pantalla tiene que seguir mirando el historial. */
export function hayQueEsperar(
  pedido: Pedido | null,
  corridas: readonly Corrida[],
  ahora: number,
): boolean {
  if (mesesEnCurso(corridas).size > 0) return true
  if (pedido === null) return false
  if (ahora - pedido.desde > ESPERA_MAXIMA_MS) return false
  return faltanPorTerminar(pedido, corridas).length > 0
}

/** Las reglas del reporte por correo, aparte del dibujo · F6.6, F6.7 y F6.10
 *
 *  **Son decisiones, no render**, igual que `alta.ts` y `cargaDePeriodos.ts`:
 *  se prueban sin montar nada. Las cifras son las que el backend aplica en
 *  `49ebb26` y producto aceptó el 2026-11-18 (P6.1, P6.2 y P6.5 revisadas en
 *  `plan-fase-6.md`). **El servicio vuelve a validar todo**: estas reglas
 *  existen para decirlo antes de guardar, no para reemplazarlo.
 */
import type { EstadoDeReporte, FrecuenciaDeReporte, Reporte } from '../../api/admin'

/** De 3 a 5 · B6.3. */
export const MINIMO_DE_PREGUNTAS = 3
export const MAXIMO_DE_PREGUNTAS = 5
/** P6.5, revisada el 2026-11-18: 50 y no 20. */
export const MAXIMO_DE_DESTINATARIOS = 50

export const DIAS_DE_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const

export const NOMBRE_DE_FRECUENCIA: Record<FrecuenciaDeReporte, string> = {
  diaria: 'Diaria',
  semanal: 'Semanal',
  mensual: 'Mensual',
}

export const NOMBRE_DE_ESTADO: Record<EstadoDeReporte, string> = {
  borrador: 'Borrador',
  validado: 'Validado',
  activo: 'Activo',
  pausado: 'Pausado',
}

/** «Mensual · día 3 · 08:00» · el literal del dibujo. La hora es la que el
 *  reporte guarda, en la zona del cliente: no se convierte. */
export function cuandoSale(r: Pick<Reporte, 'frecuencia' | 'diaDeSemana' | 'diaDelMes' | 'hora'>): string {
  const partes: string[] = [NOMBRE_DE_FRECUENCIA[r.frecuencia]]
  if (r.frecuencia === 'semanal' && r.diaDeSemana !== null) partes.push(DIAS_DE_SEMANA[r.diaDeSemana] ?? '')
  if (r.frecuencia === 'mensual' && r.diaDelMes !== null) partes.push(`día ${String(r.diaDelMes)}`)
  partes.push(r.hora)
  return partes.join(' · ')
}

/** Por qué no se puede guardar · `null` si se puede. Una sola razón, la
 *  primera: una lista de cinco errores no se lee. */
export function problemaDelReporte(f: {
  nombre: string
  rolId: string
  preguntas: readonly string[]
  frecuencia: FrecuenciaDeReporte
  diaDeSemana: number | null
  diaDelMes: number | null
  hora: string
  destinatarios: number
}): string | null {
  if (f.nombre.trim() === '') return 'Falta el nombre del reporte.'
  if (f.rolId === '') return 'Falta elegir el rol con el que se contesta.'
  if (f.preguntas.length < MINIMO_DE_PREGUNTAS) return `Lleva al menos ${String(MINIMO_DE_PREGUNTAS)} preguntas.`
  if (f.preguntas.length > MAXIMO_DE_PREGUNTAS) return `Lleva como máximo ${String(MAXIMO_DE_PREGUNTAS)} preguntas.`
  if (f.preguntas.some((p) => p.trim() === '')) return 'Hay una pregunta vacía.'
  if (f.frecuencia === 'semanal' && f.diaDeSemana === null) return 'Falta el día de la semana.'
  if (f.frecuencia === 'mensual' && f.diaDelMes === null) return 'Falta el día del mes.'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.hora)) return 'La hora va como 08:00.'
  if (f.destinatarios > MAXIMO_DE_DESTINATARIOS)
    return `Un reporte admite como máximo ${String(MAXIMO_DE_DESTINATARIOS)} destinatarios.`
  return null
}

/** Un correo con forma de correo. La regla de verdad es del servicio. */
export function esCorreo(c: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.trim())
}

/** **Cambiar las preguntas o el rol lo devuelve a borrador** · P6.1 revisada. Lo
 *  demás, no. Sólo importa si ya salió del borrador. */
export function vuelveABorrador(
  r: Pick<Reporte, 'estado' | 'preguntas' | 'rolId'>,
  cambio: { preguntas: readonly string[]; rolId: string },
): boolean {
  if (r.estado === 'borrador') return false
  const mismas =
    r.preguntas.length === cambio.preguntas.length && r.preguntas.every((p, i) => p === cambio.preguntas[i]?.trim())
  return !mismas || r.rolId !== cambio.rolId
}

/** El estado del acceso a los datos de un cliente · A2 · 2026-10-14
 *
 *  **Es una decisión, no un render**, así que vive aparte y se prueba sin montar
 *  nada. Convierte lo que contestó la verificación en una de cinco consecuencias,
 *  y la pantalla dibuja la consecuencia.
 *
 *  **`ok: false` del servicio NO es «sin acceso»**, y es la trampa que esto
 *  existe para evitar: medido en UA el 2026-10-14, `ok` venía en `false` con la
 *  conexión andando y todos los datos presentes, porque seis métricas del
 *  catálogo no tienen cálculo. Por eso el estado no se lee de `ok`: se arma con
 *  las tres cosas que la verificación mira por separado.
 *
 *  **Los errores se distinguen por el código HTTP**, que es lo que el servicio
 *  declara: 404 es un cliente sin agente, 422 credenciales que no conectan, 502
 *  datos que no respondieron.
 */
import { ApiError } from '../../api/types'
import type { VerificacionDeAcceso } from '../../api/admin'

export type EstadoDelAcceso =
  | { estado: 'sin-verificar' }
  | { estado: 'verificando' }
  | { estado: 'vigente'; verificadoEn: string; sinCalculo: string[] }
  | { estado: 'faltan-datos'; verificadoEn: string; afectadas: string[]; sinCalculo: string[] }
  | { estado: 'sin-acceso'; razon: string }
  | { estado: 'sin-configurar' }
  | { estado: 'error'; razon: string }

export function estadoDelAcceso(
  verificacion: VerificacionDeAcceso | undefined,
  error: Error | null,
  verificando: boolean,
): EstadoDelAcceso {
  if (verificando) return { estado: 'verificando' }
  if (error !== null) {
    if (error instanceof ApiError && error.httpStatus === 404) return { estado: 'sin-configurar' }
    if (error instanceof ApiError && error.httpStatus === 422) {
      return { estado: 'sin-acceso', razon: 'Las credenciales de este cliente no permiten conectarse a sus datos.' }
    }
    if (error instanceof ApiError && error.httpStatus === 502) {
      return { estado: 'sin-acceso', razon: 'Los datos de este cliente no respondieron al verificarlos.' }
    }
    return { estado: 'error', razon: error.message === '' ? 'No se pudo verificar el acceso.' : error.message }
  }
  if (verificacion === undefined) return { estado: 'sin-verificar' }
  return verificacion.datosCompletos
    ? { estado: 'vigente', verificadoEn: verificacion.verificadoEn, sinCalculo: verificacion.sinCalculo }
    : {
        estado: 'faltan-datos',
        verificadoEn: verificacion.verificadoEn,
        afectadas: verificacion.afectadas,
        sinCalculo: verificacion.sinCalculo,
      }
}

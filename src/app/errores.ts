/** Los errores del navegador se registran · ISO 27001 A.8.15 y A.8.16 · 2026-11-09
 *
 *  Brecha 8 de `docs/AUDITORIA-2026-11-04-hardening-iso-27001.md`: hasta este
 *  día un error en el navegador de un cliente sólo se sabía si el cliente lo
 *  contaba.
 *
 *  **Va a nuestro nginx, que lo escribe en el log del contenedor** · ver
 *  `/_errores` en `deploy/nginx.conf.template`. No a un servicio de terceros:
 *  eso es sacar datos de la casa, y lo decide quien opera, no el front.
 *
 *  **Lo que viaja es lo mínimo para encontrar el defecto**: el tipo, el
 *  mensaje, las primeras líneas de la pila y la ruta SIN su query. Nada del
 *  usuario, del cliente activo ni de la sesión. La pila nombra los archivos
 *  con su hash, y eso ya dice de qué build es.
 *
 *  **En desarrollo no se manda nada**: Vite no tiene el receptor, y el error ya
 *  está en la consola de quien lo está mirando.
 */

export type TipoDeError = 'error' | 'promesa' | 'react'

/** Diez por carga de página. Un error en un render que se repite no tiene
 *  por qué llenar el log: el primero ya dice todo. */
const TOPE = 10
const LARGO_DEL_MENSAJE = 300
const LINEAS_DE_PILA = 6
const LARGO_DE_LA_PILA = 1500

function recortar(texto: string, largo: number): string {
  return texto.length <= largo ? texto : `${texto.slice(0, largo)}…`
}

function partes(error: unknown): { mensaje: string; pila: string } {
  if (error instanceof Error) {
    const pila = (error.stack ?? '').split('\n').slice(0, LINEAS_DE_PILA).join('\n')
    return { mensaje: `${error.name}: ${error.message}`, pila }
  }
  return { mensaje: String(error), pila: '' }
}

type Opciones = {
  enviar: (cuerpo: string) => void
  /** La ruta sin query · `location.pathname`, que nunca la trae. */
  ruta: () => string
}

export function crearReportero({ enviar, ruta }: Opciones) {
  const vistos = new Set<string>()

  return function reportar(tipo: TipoDeError, error: unknown): void {
    if (vistos.size >= TOPE) return
    const { mensaje, pila } = partes(error)
    // El mismo error dos veces es uno: lo que se repite es el render, no el
    // defecto.
    const clave = `${tipo}|${mensaje}`
    if (vistos.has(clave)) return
    vistos.add(clave)

    enviar(
      JSON.stringify({
        tipo,
        mensaje: recortar(mensaje, LARGO_DEL_MENSAJE),
        pila: recortar(pila, LARGO_DE_LA_PILA),
        ruta: ruta(),
      }),
    )
  }
}

/** `sendBeacon` porque sobrevive a que la página se cierre o se recargue, que
 *  es justo lo que alguien hace después de un error. Si el navegador no lo
 *  tiene, `fetch` con `keepalive` hace lo mismo. Un registro que falla no se
 *  vuelve a intentar ni se avisa: sería un error sobre el error. */
function enviarAlServidor(cuerpo: string): void {
  try {
    const blob = new Blob([cuerpo], { type: 'application/json' })
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon('/_errores', blob)) {
      return
    }
    void fetch('/_errores', { method: 'POST', body: blob, keepalive: true }).catch(() => undefined)
  } catch {
    // Nada: ver arriba.
  }
}

export const reportarError: (tipo: TipoDeError, error: unknown) => void = import.meta.env.DEV
  ? () => undefined
  : crearReportero({ enviar: enviarAlServidor, ruta: () => window.location.pathname })

/** Lo que React no ve: un error en un manejador, un `setTimeout`, una promesa
 *  sin `catch`. Lo que pasa DENTRO del render lo reporta la raíz de React ·
 *  ver `main.tsx`. */
export function escucharErroresGlobales(reportar = reportarError): void {
  window.addEventListener('error', (e) => reportar('error', e.error ?? e.message))
  window.addEventListener('unhandledrejection', (e) => reportar('promesa', e.reason))
}

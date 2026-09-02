/** Preparación de cada corrida · F0.9.
 *
 *  Corre para TODOS los archivos, en `node` y en `jsdom`. Lo que necesita un DOM
 *  va detrás de la guarda: importar `@testing-library/react` en el entorno node
 *  arrastra `react-dom` y revienta antes de la primera prueba.
 */
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

/** El tamaño que reporta el doble de ResizeObserver. Exportado para que una
 *  prueba pueda calcular la escala esperada en vez de copiar un número. */
export const TEST_SIZE = { width: 600, height: 300 }

/* ── MSW ──────────────────────────────────────────────────────────────────────
 *
 * `onUnhandledRequest: 'error'` no es rigor decorativo. Sin él, una petición sin
 * handler se queda colgada y la prueba falla por timeout, que se lee igual que
 * un bug de la implementación. Con él dice exactamente qué URL nadie mockeó.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

/** Entre pruebas se vuelve a los handlers base: un `server.use()` que se filtra
 *  al archivo siguiente produce una prueba que pasa sola y falla acompañada. */
afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

/* ── Solo con DOM ─────────────────────────────────────────────────────────── */

if (typeof document !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')

  const { cleanup } = await import('@testing-library/react')
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  /** jsdom no implementa ResizeObserver, y sin él ningún plot que mida su
   *  contenedor llega a dibujarse. El doble no solo evita el error: informa un
   *  tamaño fijo, así que los plots SÍ se renderizan y se puede afirmar sobre
   *  las marcas que producen y no solo sobre el contenedor vacío. */
  globalThis.ResizeObserver ??= class {
    private readonly callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }

    /** Avisa en el acto, cosa que el observer real NO hace —notifica en un frame
     *  posterior. Es una simplificación deliberada para que una prueba lea un
     *  tamaño sin esperar, y vale mientras ninguna dependa del retardo. */
    observe(target: Element): void {
      this.callback(
        [{ target, contentRect: TEST_SIZE } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      )
    }

    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver

  /** SVG en jsdom no trae `getComputedTextLength`. Devuelve el avance medido de
   *  JetBrains Mono, que es el mismo número que usa el eje. */
  if (typeof SVGElement !== 'undefined') {
    const proto = SVGElement.prototype as unknown as { getComputedTextLength?: () => number }
    proto.getComputedTextLength ??= function (this: SVGElement) {
      return (this.textContent ?? '').length * 7.2
    }
  }
}

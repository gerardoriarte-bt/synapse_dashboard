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
 * `onUnhandledFrame: 'error'` no es rigor decorativo. Sin él, una petición sin
 * handler se queda colgada y la prueba falla por timeout, que se lee igual que
 * un bug de la implementación. Con él dice exactamente qué URL nadie mockeó.
 *
 * **Hasta msw 2 se llamaba `onUnhandledRequest`** · 2026-11-25. msw 3 lo
 * renombró porque también cubre WebSocket, y conserva las tres estrategias:
 * medido ese día, con `'error'` el `fetch` se rechaza sin salir a la red y
 * nombra la URL; con `'warn'` la petición sí sale.
 */
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
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

  const { cleanup, configure } = await import('@testing-library/react')

  /** **Cinco segundos de espera, para todas** · mejora #3 de
   *  `docs/AUDITORIA-2026-11-25-calidad-de-codigo.md`, 2026-11-26.
   *
   *  El segundo por defecto de testing-library alcanza con la máquina libre y
   *  no con la máquina cargada —otra corrida en paralelo, el build—, y la
   *  prueba que se pasaba de largo no fallaba por un defecto sino por la
   *  carga. Se parcheaba de a una (`lento = { timeout: 4000 }` en
   *  `tab.test.tsx`); acá se fija una vez. Una espera más larga no esconde un
   *  defecto: `findBy*` vuelve en cuanto aparece lo que busca, así que sólo
   *  cuesta tiempo cuando la prueba ya iba a fallar. */
  configure({ asyncUtilTimeout: 5000 })

  /** **Los cuerpos de panel, precargados antes de la primera prueba.**
   *
   *  Cada cuerpo es un `import()` de `LOADERS` · §8, un chunk por cuerpo. En
   *  la prueba eso significa que el PRIMER panel de cada tipo transforma su
   *  módulo —y los plots que arrastra— DENTRO de la espera del `findBy*`, y
   *  con carga eso solo se comía el segundo. Precargados acá, `lazy` encuentra
   *  el módulo ya resuelto y la espera mide lo que la prueba quiere medir.
   *
   *  **No toca el build**: `registry.ts` no cambia y los cuerpos siguen en sus
   *  chunks, que es lo que verifica `carga-diferida`. Va sólo con DOM porque
   *  los archivos `node` no montan cuerpos, y transformar quince módulos ahí
   *  sería arranque regalado. */
  const { LOADERS } = await import('../src/render/bodies/registry')
  beforeAll(async () => {
    await Promise.all(Object.values(LOADERS).map((cargar) => cargar()))
  })

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

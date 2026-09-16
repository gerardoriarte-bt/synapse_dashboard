/** La entrada del modo de desarrollo · `npm run dev:mock`
 *
 *  **Una entrada aparte, y esa es toda la decisión de diseño.** `src/main.tsx`
 *  no se toca y el build de producción no llega hasta acá: F0.8 dice que los
 *  mocks no entran al bundle y está «cumplido por construcción» — la garantía es
 *  que **no existe ruta de import desde `src/` hasta un mock**.
 *
 *  Un `if (import.meta.env.DEV)` dentro de `main.tsx` habría sido más corto y
 *  habría cambiado esa garantía por una confianza en el tree-shaking. La
 *  estructura sostiene la regla; la revisión, no.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/tokens/tokens.css'
import { worker } from './mocks/browser'

const root = document.getElementById('root')
if (root === null) throw new Error('Falta #root en index.html')

/** **La URL se normaliza a `/` antes de montar, y sin esto la pantalla queda en
 *  negro.**
 *
 *  `App` monta un `BrowserRouter` y las rutas son `/`, `/login`, `/admin/*` y
 *  `/builder/*`. El navegador, en cambio, está parado en `/index.dev.html`, que
 *  no matchea ninguna: React Router avisa «No routes matched location» **por
 *  consola** y renderiza `null`. La app arranca, MSW arranca, y no se ve nada.
 *
 *  Se descubrió recién el 2026-09-16, abriéndolo en el navegador por primera
 *  vez. Estaba construido y probado por unidad desde el 15: es exactamente la
 *  clase de falla que ninguna prueba iba a ver, porque el defecto no está en un
 *  componente sino en la URL desde la que se los monta.
 *
 *  **El costo de hacerlo así:** una recarga dura vuelve a `/`, que sirve
 *  `index.html` —la app REAL contra el servicio real—. Es el precio de tener
 *  dos entradas sobre un mismo servidor de Vite sin `basename`; para volver al
 *  modo mock hay que pedir `/index.dev.html` de nuevo.
 *
 *  ── Y POR ESO EXISTE `?ir=` ─────────────────────────────────────────────────
 *
 *  Como la única forma de entrar es `/index.dev.html`, **no hay manera de abrir
 *  una pantalla concreta**: se cae siempre en la consola y desde ahí no hay
 *  enlace a admin ni al builder, que son superficies aparte. Tampoco sirve
 *  escribir `/admin` en la barra: eso sirve `index.html` y sale la app real.
 *
 *      /index.dev.html?ir=/admin/cliente
 *      /index.dev.html?ir=/builder/preview
 *
 *  Es la diferencia entre poder mirar una pantalla y tener que llegar a ella
 *  haciendo clics. */
const destino = new URLSearchParams(window.location.search).get('ir')
// Solo rutas internas: un `ir=https://…` sería un redirector abierto, y este
// archivo no llega a producción pero la costumbre sí.
const ruta = destino !== null && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/'
if (window.location.pathname + window.location.search !== ruta) {
  window.history.replaceState(null, '', ruta)
}

// **`onUnhandledRequest: 'warn'` y no `'error'`**, al revés que en las pruebas.
// Ahí una petición sin handler es un defecto que hay que ver; acá el navegador
// pide fuentes, íconos y el HMR de Vite, y romper con eso volvería el modo
// inusable por ruido que no es nuestro.
void worker
  .start({ onUnhandledRequest: 'warn', quiet: true })
  .then(() => {
    // Se dice, y se dice fuerte. Alguien que abra esto sin saber puede creer que
    // está viendo el servicio real — y entonces «funciona» no significa nada.
    // eslint-disable-next-line no-console
    console.info(
      '%cSynapse · MODO MOCK',
      'background:#e8590c;color:#fff;padding:2px 6px;border-radius:3px',
      '\nNingún dato es real. Entrá con cualquier correo y contraseña.\n' +
        'Esto NO verifica el cable: eso lo hace `npm run humo` contra el servicio.',
    )
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })

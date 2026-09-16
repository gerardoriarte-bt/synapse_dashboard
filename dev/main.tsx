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

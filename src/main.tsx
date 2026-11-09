import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { escucharErroresGlobales, reportarError } from '@/app/errores'
import '@/tokens/tokens.css'

const root = document.getElementById('root')
if (root === null) throw new Error('Falta #root en index.html')

escucharErroresGlobales()

// **Los dos, y no sólo el que no se atrapa** · 2026-11-09. Con la frontera de
// abajo puesta, todo error de render pasa a ser «atrapado», y sin
// `onCaughtError` ninguno se registraría. Ver `src/app/errores.ts`.
createRoot(root, {
  onCaughtError: (error) => reportarError('react', error),
  onUncaughtError: (error) => reportarError('react', error),
}).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

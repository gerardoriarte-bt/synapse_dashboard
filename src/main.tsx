import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/tokens/tokens.css'

const root = document.getElementById('root')
if (root === null) throw new Error('Falta #root en index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

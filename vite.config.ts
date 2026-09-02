/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    /* Las pruebas se agrupan en `tests/`, fuera de `src/`. Los handlers de MSW
     * son datos falsos y no puede existir ruta desde una superficie hasta ellos
     * — es F0.8 sostenida por la estructura y no por la revisión. */
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],

    /* Node por defecto: levantar un DOM para probar una función pura es tiempo
     * de arranque regalado. El archivo que renderiza —o que necesita
     * `localStorage`, o `fetch` de una URL relativa— lo pide con un
     * `// @vitest-environment jsdom` en la primera línea. */
    environment: 'node',

    /* Sin globales: `describe`, `it` y `expect` se importan. Un símbolo que
     * aparece sin import es un símbolo que el typecheck del proyecto de app no
     * sabría de dónde sacar. */
    globals: false,

    setupFiles: ['tests/setup.ts'],
  },
})

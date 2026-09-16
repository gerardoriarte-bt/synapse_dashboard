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

  server: {
    /* **Un solo servicio, una sola base** · F1.37, 2026-09-14.
     *
     * `AntPack-dev/synapse-api-go` sirve `/auth/*`, `/config/*` y `/admin/*`
     * desde el MISMO binario y bajo el mismo `/api/v1` — verificado en su
     * `router.go`, donde los tres cuelgan de `v1 := router.Group("/api/v1")`.
     * En local levanta en 4010 con su `docker-compose`.
     *
     * Hasta hoy esto proxeaba las rutas de acceso UNA POR UNA, con la razón
     * escrita: «la API de la consola es otro servicio y va a tener otro
     * destino». Resultó no serlo. Enumerar prefijos ya había costado una vez
     * —`password-reset-requests` cae fuera de `/auth` y el proxy devolvía 404,
     * así que parecía que el endpoint no existía— y con `/config/*` y
     * `/admin/*` la lista solo se alarga.
     *
     * Sin el proxy el front pide contra el propio Vite y le vuelve un 404 sin
     * cuerpo: la pantalla dice «no se pudo conectar» y parece un problema del
     * login cuando es que nadie está escuchando.
     *
     * El destino se mueve sin tocar esto: `API_ORIGIN=http://otro:4010 npm run
     * dev`, que es lo que hace falta cuando el servicio corre en un contenedor
     * con otro nombre de red. `AUTH_ORIGIN` sigue funcionando para no romperle
     * el entorno a nadie. */
    proxy: {
      '/api/v1': {
        target:
          process.env['API_ORIGIN'] ?? process.env['AUTH_ORIGIN'] ?? 'http://localhost:4010',
        changeOrigin: true,
      },
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

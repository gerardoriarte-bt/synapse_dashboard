/** El cliente sobre el que se trabaja · compartido entre superficies · 2026-10-06
 *
 *  **Decisión humana del 2026-10-06**: «Debe ser lineal: una selección de tenant
 *  unifica todas las pantallas». Hasta ese día administración y builder tenían
 *  cada una su `useState` y caían a `lista[0]` —el primero que devuelve el
 *  servicio, que en QA es Keralty—, así que entrar al builder después de
 *  trabajar sobre UA en administración mostraba otro cliente sin aviso.
 *
 *  **Vive en un contexto de la app, no en `localStorage`**: sobrevive a ir y
 *  volver entre superficies —que es lo que se pidió— y cada montaje de prueba
 *  arranca limpio, sin heredar la elección de la prueba anterior.
 *
 *  **La consola no lo sigue, y no por elección.** Su cliente es el del token de
 *  sesión: `JWTMiddleware` pone `claims.TenantID` en el contexto y ninguna ruta
 *  de `/config/*` acepta otro —leído en `middleware.go` el 2026-10-06—. Que la
 *  consola cambie de cliente es un pedido al backend, no algo que el front
 *  pueda hacer solo.
 */
import { createContext } from 'react'

export type ClienteDeTrabajo = {
  elegido: string | null
  elegir: (id: string) => void
}

export const ContextoDeCliente = createContext<ClienteDeTrabajo | null>(null)

# Entrega · el login, conectado contra `synapse-api-go`

**2026-09-08.** El mensaje que se le pasa a quien mantiene la API de acceso.
Está acá para que no se pierda en un chat: lo que se entregó, dónde revisarlo y
las tres cosas que necesitamos de ese lado.

Rama `Gerardo` de `gerardoriarte-bt/synapse_dashboard` · commits
`b650839..50f9b29`.

---

## El mensaje

**El login del front ya está conectado contra `synapse-api-go`.**

Se puede probar en local: levantás el servicio con su `docker-compose` —queda en
`:4010`— y `npm run dev` en el front. Vite proxea `/api/v1/auth` hacia ahí, así
que no hay que configurar nada.

**Qué quedó hecho**

- Pantalla de login en `/login` — el guardia redirigía ahí y esa ruta no existía.
- Un `401` de cualquier endpoint cierra la sesión y vuelve al login.
- **Bloqueo obligatorio de cambio de contraseña**: con `password_updated: false`
  no se llega a la consola, ni escribiendo la URL. Lo pide tu propio OpenAPI en
  `/auth/login`.
- Los tipos del cliente salen **generados de tu spec**, no escritos a mano.

**Dónde revisarlo**

| Archivo | Qué es |
|---|---|
| `src/api/auth.ts` | El cliente |
| `src/surfaces/console/Login.tsx` · `ChangePassword.tsx` | Las dos pantallas |
| `src/app/auth/AuthGuard.tsx` | Dónde vive el bloqueo |
| `contracts/synapse-auth.yaml` | Copia versionada de tu OpenAPI |
| `tests/api/auth.test.ts` · `tests/app/guard.test.tsx` | 18 pruebas contra tu envelope real |

---

## Necesito tres cosas

El detalle largo está en `PARA-BACKEND.md`.

### 1 · Decime qué servicio sirve chat, hilos y solicitudes

Están definidos dos veces y el front está escrito contra la columna izquierda:

| Contrato de la consola | Tu API |
|---|---|
| `POST /config/chat` | `POST /chat/stream` |
| `GET /config/chat/hilos` | `GET /history/threads` |
| `GET /config/chat/hilos/{id}` | `GET /cortex/threads/{id}` |
| `GET`/`POST /config/solicitudes` | `/access-requests` + aprobar y rechazar |

No reapunté nada. Con que me digas cuál gana, alcanza — si gana la tuya, es medio
día de trabajo del front. **Tus solicitudes de acceso son más completas que las
del contrato**, así que esa la daría por ganada ya.

### 2 · Cambiá `Error` a objeto en `internal/adapters/handler/response.go`

```go
// hoy
Error string `json:"error,omitempty"`

// §4.1 del contrato
Error *struct {
    Codigo  string `json:"codigo"`
    Mensaje string `json:"mensaje"`
} `json:"error,omitempty"`
```

Hoy tu error llega a nuestro cliente como `code: undefined, message: ""` — el
usuario ve una pantalla de error **sin una palabra**. Por eso el login tiene su
propio desenvolvedor; con este cambio ese archivo se borra.

El `codigo` te lo propongo así: `CAMPO_*` para error de campo, `REGLA_*` para
regla de negocio, `FALLO_*` para fallo técnico. Lo que importa es que la familia
sea el prefijo — así el front decide sobre el prefijo y podés agregar códigos sin
que cambiemos nada.

### 3 · Apretá `ErrorResponse.success` en tu `openapi.yaml`, línea 97

```yaml
# hoy — no discrimina: TypeScript no puede estrechar la unión
success:
  type: boolean
  example: false

# lo que hace falta
success:
  type: boolean
  enum: [false]
```

Tu código Go ya lo pone siempre en `false`; es el spec el que quedó suelto. Lo
mismo en `SuccessResponse` (línea 88) con `enum: [true]`. Mientras tanto miro el
status HTTP, que funciona igual — pero con esto los tipos generados lo resuelven
solos.

---

**La 2 y la 3 son cambios chicos y concretos. La 1 es la que bloquea de verdad**:
hasta que no esté, no se toca el chat.

---

*Estado del front al enviar · Fase 0 cerrada entera, 13 de 13. Después del login
la consola falla, y es lo esperado: pide `/config/me`, `/config/catalog`,
`/config/tabs` y `/config/panels:batch`, que ningún servicio expone. Eso y el
resto está en `PARA-BACKEND.md` — si solo se lee una cosa, que sea el punto 0.*

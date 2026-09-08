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

## Enviado como PR · 2026-09-08

**`AntPack-dev/synapse-api-go#1`** — https://github.com/AntPack-dev/synapse-api-go/pull/1

Las dos peticiones chicas van **implementadas** en ese PR (el `enum` de `success`
y la migración de roles, con `go build` y `go vet` en limpio). Las otras dos van
en el cuerpo, sin implementar: el envelope porque rompe todos los `SendError` y
es decisión suya, y la de solicitudes porque es una pregunta.

## Necesito cuatro cosas

El detalle largo está en `PARA-BACKEND.md`.

### 1 · Decime si las solicitudes de acceso las sirve tu API

**El chat ya se resolvió** y no hace falta que contestes: el de tu servicio es de
otro producto. El nuestro es el contextual del panel —se abre desde un panel y
lleva su métrica— y vive en `/config/chat`. Son dos chats distintos, no dos
definiciones del mismo.

Lo que sigue definido dos veces son las solicitudes:

| Contrato de la consola | Tu API |
|---|---|
| `GET`/`POST /config/solicitudes` | `POST /access-requests` · `GET /access-requests/tenants` |
| — | `GET /admin/access-requests` |
| — | `POST /admin/access-requests/{id}/approve` · `/reject` |

**La tuya gana sola**: tiene aprobar, rechazar, listar por tenant, y de ahí ya
cuelga la recuperación de contraseña que acabo de construir. La del contrato
tiene dos rutas y ninguna implementación conocida.

Con que me confirmes que es la tuya, reapunto F2.3 — es medio día.

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

### 4 · Normalizá el `name` de la tabla `roles`

```sql
UPDATE roles SET name = lower(name);
```

Tu spec declara `role: enum [admin, planner, user]` y la tabla tiene `Planner`
con mayúscula. Verificado contra la base con el servicio corriendo:

| Valor que devuelve tu API | Usuarios | ¿En el enum? |
|---|---|---|
| `Planner` | **26** | **no** |
| `admin` | 3 | sí |
| `user` | 3 | sí |

**26 de 32 usuarios reciben un `role` que tu propio contrato no admite.**

Hoy no rompe nada —tu `RoleAllowedMiddleware` normaliza con `ToLower` de los dos
lados, así que la autorización funciona bien; lo verifiqué para no hacerte
arreglar algo que no está roto—. Lo que está mal es el contrato: mi tipo generado
dice `"admin" | "planner" | "user"` y ese valor no llega nunca para 26 usuarios.
El día que algo compare contra `"planner"`, falla para el 81% y solo en
producción.

Ensanchar el enum no sirve: bendice la inconsistencia y la duplica en cada
consumidor. Y agregale un `CHECK (name = lower(name))` para que no vuelva.

**Lo que NO hay que tocar**: que cada tenant tenga su propia fila de rol es el
diseño —`roles.tenant_id` existe a propósito—. Lo único a unificar es la
capitalización.

---

**La 2, la 3 y la 4 son cambios chicos y concretos. La 1 es la que bloquea de
verdad**: hasta que no esté, no se toca el chat.

---

*Estado del front al enviar · Fase 0 cerrada entera, 13 de 13. Después del login
la consola falla, y es lo esperado: pide `/config/me`, `/config/catalog`,
`/config/tabs` y `/config/panels:batch`, que ningún servicio expone. Eso y el
resto está en `PARA-BACKEND.md` — si solo se lee una cosa, que sea el punto 0.*

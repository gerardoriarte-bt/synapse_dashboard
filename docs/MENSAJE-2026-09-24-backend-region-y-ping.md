# Para el equipo de backend · dos cosas del cliente de Snowflake · 2026-09-24

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué
> evidencia. No se actualiza.

Hola. Cargué por primera vez un tenant con credenciales reales de Snowflake y un
agente de Cortex, y me topé con dos cosas del cliente. La primera impide
conectar y la segunda es un chequeo que dice que todo está bien sin haber
comprobado nada.

Todo lo de abajo lo medí hoy contra `a643cfe`, corriendo el binario en local.

Gracias por `a643cfe`, dicho sea de paso: lo verifiqué contra el servicio
levantado y las credenciales del tenant ya no salen en ninguna respuesta.

---

## 1 · `BaseURL()` arma el host sin la región · nos impide conectar

`domain.SnowflakeAgentConfig.BaseURL()` construye:

```go
return "https://" + strings.ToLower(c.Account) + ".snowflakecomputing.com"
```

Nuestra cuenta es `MAA16864` y vive en `east-us-2.azure`, así que el host que
corresponde lleva la región. Sin ella, la cuenta no existe:

| Host | Respuesta |
|---|---|
| `maa16864.snowflakecomputing.com` ← el que arma el código | **404** |
| `maa16864.east-us-2.azure.snowflakecomputing.com` ← el real | **401** · existe y pide firma |

Eso es lo que veíamos como `crear thread: status inesperado 404` en
`POST /config/chat`.

**Y la parte que más sorprende: el campo correcto ya lo tienen.**
`tenants.snowflake_url` se pide en el alta con `binding:"required"`, se cifra
con el resto y **no se lee nunca**. `SnowflakeAgentConfig` declara
`OverrideBaseURL`, `BaseURL()` lo respeta si está… y ningún lugar del código se
lo asigna. Lo busqué en todo el repositorio: sólo aparece en su declaración y en
el `if` que lo lee.

**La corrección es una línea**, en
`internal/core/services/snowflake_config.go`:

```go
 return domain.SnowflakeAgentConfig{
+	OverrideBaseURL: tenant.SnowflakeURL,
 	Account:         tenant.SnowflakeAccount,
 	...
```

La probé en una copia local: con eso el 404 pasó a **401**, o sea que la
petición llega a la cuenta y lo único que queda pendiente es que nos registren
la clave pública. **No lo mandé como PR** — es un archivo suyo y prefiero que lo
apliquen ustedes.

**Esto no es sólo nuestro entorno.** El formato sin región sólo funciona en
cuentas antiguas de AWS us-west-2; cualquier cuenta en Azure, GCP o en otra
región de AWS falla igual.

## 2 · `GET /api/v1/agents/ping` dice «ping snowflake ok» sin llamar a Snowflake

Fui a buscar ese endpoint justamente para verificar lo de arriba, y por el
nombre parecía lo indicado. Lo que hace es:

```go
tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
if tenant == nil { return ErrAgentTenantNotFound }
slog.InfoContext(ctx, "ping snowflake ok", ...)
return nil
```

Lee el tenant de Postgres y devuelve `200 {"status":"ok"}`. **No abre ninguna
conexión, no firma ningún JWT y no toca Snowflake.** Con el defecto 1 activo
—que impide conectar del todo— este ping seguía contestando `ok`.

No es urgente, pero mientras exista así conviene saber que **un `ok` de acá no
significa que la conexión funcione**. Si les sirve, el ping que a nosotros nos
resolvería el problema es uno que firme el JWT y haga una llamada barata contra
la cuenta: con eso, configurar un tenant nuevo deja de ser a ciegas.

---

## Lo que sigue de nuestro lado

Con la línea del punto 1 aplicada y la clave pública registrada por el equipo de
datos, probamos el chat de punta a punta y les devolvemos el resultado: qué
preguntamos, qué contestó y cuánto tardó.

Los dos pedidos anteriores siguen en pie y no los repito acá — la colisión de
`GET /admin/tenants/{tenantId}/roles` y que `POST /config/chat` acepte contexto
de pestaña. Están en `docs/MENSAJE-2026-09-22-backend-roles-y-hallazgo.md`.

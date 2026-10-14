# Para el equipo de backend · permisos: quién ve y quién edita, y el super-admin · 2026-10-10

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `9dc481e` el 2026-10-10**: `internal/core/domain/user.go`,
`internal/adapters/handler/middleware.go` y `router.go` leídos, y el binario de
`9dc481e` corriendo acá con la base local. Desde ahí, con el token de un usuario
`admin` de un cliente, se leyó y se escribió en otro. Del lado del front medimos
primero lo nuestro: la consola no puede cambiar de cliente por su cuenta, y está
bien que no pueda (§3).

Hola. Este mensaje es más largo que los anteriores a propósito. No es un campo
que falta: es **cómo se decide quién ve y quién edita**, y conviene que se
entienda el porqué antes de tocar código. Va en este orden: qué vimos, la causa,
por qué es un problema, qué dice el diseño, la solución que proponemos, por qué
ese camino y no otro, y qué les pedimos.

---

## 1 · Qué vimos

En QA, producto quiso pasar del dashboard de «Synapse UA HTML» al de «Lobueno
Analytics» y no pudo. **No son dos dashboards: son dos clientes** —la lista
pública de `GET /access-requests/tenants` trae cinco: Keralty, Lobueno
Analytics, Lobueno Analytics Terpel, Sistema y Synapse UA HTML—.

Y apareció la incoherencia de fondo: **en administración y en el builder se ven
y se editan los dashboards de todos los clientes, pero en la consola sólo los de
uno.** La misma persona puede componer un dashboard que no puede abrir.

Producto lo resumió así, y es el criterio que proponemos: *«veo los que tengo
permisos, y puedo visualizar y editar los dashboards según eso; y si no los
tengo, no los veo»*.

## 2 · La causa · medida

**Un usuario pertenece a un solo cliente.** `User.TenantID` es obligatorio y
único (`user.go:11`). El login emite un token con ese cliente, y la consola sólo
habla de él: `JWTMiddleware` pone `claims.TenantID` (`middleware.go:72`) y
ninguna ruta de `/config/*` acepta otro. **Eso es correcto, y queremos
conservarlo.**

**Pero «admin» es el nombre de un rol, y no mira el cliente.**
`AdminOnlyMiddleware` es `RoleAllowedMiddleware("admin")` (`middleware.go:113`),
que compara el texto del rol del token —sin distinguir mayúsculas— y deja pasar.
**Las rutas de `/admin/*` no comparan el cliente del token con el cliente que se
está tocando.**

**Lo medimos.** Con el token de un usuario `admin` del cliente e65f81ae…, sobre
el otro cliente de la base local (11111111…):

| Llamada | Respuesta |
|---|---|
| `GET /admin/tenants/{tenantId}/roles/composition` | **200** · 3 roles del otro cliente |
| `GET /admin/tenants/{tenantId}/users` | **200** |
| `GET /admin/tenants/{tenantId}/catalog` | **200** · 12 métricas del otro cliente |
| `GET /admin/tenants/{tenantId}/layouts` | **200** |
| `POST /admin/tenants/{tenantId}/roles` | **201** · creamos un rol en el otro cliente, y lo borramos enseguida |

## 3 · Por qué es un problema, y no sólo una incoherencia

1. **Un admin de un cliente administra todos los clientes.** Hoy se nota poco
   porque los admins son de Lo Bueno. El día que Keralty tenga su propio admin
   —que es lo normal—, ese usuario va a poder leer los usuarios de UA, editar
   sus dashboards y crearle roles.
2. **Se puede llegar a admin de todo desde el formulario público.** Lo medimos
   el 2026-10-09: aprobar una solicitud asigna el rol del agente elegido, y el
   agente de UA tiene `target_role: admin`. Quien aprueba con ese agente le da,
   sin saberlo, acceso a todos los clientes a alguien que se registró desde el
   login.
3. **Cualquier rol que se llame `admin` abre la plataforma.** Los nombres de rol
   son texto libre por cliente: crear uno con ese nombre en cualquier cliente
   tiene el mismo efecto.
4. **La consola no puede resolverlo por su cuenta, y no debe.** Si el front
   dejara cambiar de cliente a «quien tenga rol admin», extendería el mismo
   agujero a los datos de la consola.

## 4 · Lo que el diseño ya define

`design.md` es normativo para nosotros, y esto ya lo resolvió:

- **§3.1:** *«Un usuario pertenece a exactamente un tenant. Sin excepciones, sin
  usuarios multi-tenant, sin "usuario con permisos extendidos". Esta regla no se
  relaja nunca.»*
- **§3.2 · dos planos de identidad:**

| Plano | Quién | Alcance | Autenticación |
|---|---|---|---|
| Operación | Usuarios de cliente | Un cliente, siempre | Login del cliente |
| Plataforma | Super-admin (Lo Bueno) | Varios clientes, por diseño | Login separado, MFA obligatorio |

  *«Son tablas distintas y sesiones distintas. Todo acceso cross-tenant del plano
  plataforma se audita: quién, qué tenant, cuándo, qué acción.»*
- **§3.5:** `SuperAdmin { id, nombre, email, mfaActivo, ultimoAcceso,
  accesoPorTenant[] }`, la única entidad sin cliente.

**Hoy el plano de plataforma no existe**: el super-admin está implementado como
un rol más dentro de un cliente. De ahí sale todo lo anterior.

## 5 · La solución que proponemos

**Decisiones de producto del 2026-10-10:** editar se decide **por rol**, y los
dashboards quedan supeditados al rol. Un admin de Lo Bueno opera **los clientes
que se le entregaron**, que pueden ser varios. El admin de Keralty ve y edita
**sólo Keralty**.

### 5.1 · Dos planos, como dice el diseño

**Plano de operación · usuarios de cliente.** Como hoy: un cliente, un rol. El
rol ya define **qué dashboards ve** —`PUT /admin/roles/{roleId}/dashboards`—, y
le sumamos **si puede editar**: un permiso del rol, no su nombre. Un usuario de
Keralty con un rol que edita compone los dashboards de Keralty, y nada de otro
cliente.

**Plano de plataforma · super-admin.** Una entidad aparte, sin cliente, con su
propio login y MFA, como §3.2 pide. Cada super-admin tiene **la lista de
clientes que opera** (`accesoPorTenant[]`), que pueden ser todos o algunos.
**Gestionar super-admins** es una capacidad aparte, que tienen sólo algunos: con
eso alcanza y no hace falta un tercer nivel.

### 5.2 · Una sola regla, aplicada en el servidor

En cada ruta que toca un cliente —`/admin/*`, el builder y la consola—:

> Pasa si es **un usuario de ese cliente** con un rol que lo permite, **o un
> super-admin con ese cliente en su lista**. Si no, 403. Nunca por el nombre del
> rol.

Y **cada entrada de un super-admin a los datos de un cliente se registra**:
quién, qué cliente, cuándo, qué acción. Es lo que §3.5 llama «el privilegio
transversal se compensa con trazabilidad».

### 5.3 · Cómo se ve desde el front, cuando exista

- **La consola** lista los dashboards que se pueden ver, agrupados por cliente.
  Un usuario de cliente ve un solo grupo, como hoy. Un super-admin ve los
  clientes de su lista, y entrar a uno es elegir su dashboard.
- **Administración y builder** muestran sólo los clientes y dashboards que se
  pueden editar.
- **Las tres superficies leen el mismo permiso**, que es lo que producto pidió.

## 6 · Por qué este camino y no otro

| Alternativa | Por qué no |
|---|---|
| **Usuarios con varios clientes** · una tabla usuario-cliente | Viola §3.1, que el diseño declara innegociable. Mezcla los dos planos: un error de aislamiento en una consulta filtraría datos entre clientes |
| **Dejar «admin» como está** y agregar un selector de cliente en la consola | Hereda el agujero del punto 3 y lo extiende a la consola: cualquier rol `admin` vería los datos de todos |
| **Un usuario por cliente para cada persona de Lo Bueno** | Funciona hoy sin cambiar nada, pero no escala: cinco clientes son cinco cuentas y cinco contraseñas por persona, y no deja rastro de quién operó qué como super-admin |
| **Lo propuesto** · dos planos y permiso por rol | Es lo que el diseño ya definió. Cierra el agujero, y la consola y la administración leen el mismo permiso |

## 7 · Qué les pedimos, en este orden

1. **Cerrar el agujero primero, aunque sea provisorio.** Que `/admin/*` exija
   que el cliente de la ruta sea el del token, salvo para los usuarios de
   plataforma que hoy operan varios. Ustedes saben cómo están identificados en
   QA; nosotros no lo pudimos ver. Es lo más urgente, y no espera al resto.
2. **El plano de plataforma**: la entidad super-admin, con login separado, MFA,
   su lista de clientes y el registro de cada entrada.
3. **El permiso de editar en el rol**, aplicado en `/admin/*` y el builder, en
   lugar del nombre `admin`.
4. **Que `/config/me` diga qué se puede ver y qué se puede editar**: los
   clientes y dashboards accesibles, con su nivel. Con eso el front arma el
   selector de la consola y filtra administración y builder sin decidir nada.
5. **Que la consola de un super-admin pueda abrir otro cliente de su lista.**
   La forma la eligen ustedes: un token nuevo por cliente, que es lo más simple
   porque todo `/config/*` sigue igual, u otra.
6. **Al aprobar una solicitud, que el rol lo elija quien aprueba**, como ya les
   pedimos el 2026-10-09. Con el punto 3 deja de ser grave, pero sigue siendo
   lo correcto.

## 8 · Preguntas para ustedes

- ¿Qué es hoy el cliente **«Sistema»** en QA? Si ahí viven las cuentas de Lo
  Bueno, puede ser el punto de partida del plano de plataforma.
- ¿Prefieren el token por cliente (5.3 y punto 5) o que el super-admin mande el
  cliente en cada pedido? Al front le sirven las dos.

## Lo que NO medimos

- **QA.** No usamos credenciales reales: todo se midió contra el binario local.
  No sabemos cuántos usuarios tienen hoy un rol `admin` en QA ni de qué
  clientes.
- **Las rutas del builder una por una.** Viven en el mismo grupo `adminOnly` del
  `router.go`, así que leímos que heredan la misma regla. Llamamos cinco rutas,
  no todas.

Gracias.

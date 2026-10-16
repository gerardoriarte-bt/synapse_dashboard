# Auditoría · el selector de clientes contra el aislamiento de `8272085` · 2026-10-16

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se cruzó:** el selector de cliente de administración y builder, y el
alcance que declara el chrome, contra lo que el backend hace desde `8272085`
—el aislamiento entre clientes de `RESPUESTA-2026-10-13-backend-permisos.md`—.

**Contra qué:** el último commit del backend es `cb37429`, del 2026-10-14; no
hay nada posterior en su remoto, verificado con `git ls-remote` el 2026-10-16.
El binario medido es `3651d70`, que contiene `8272085`, con la base local y el
usuario `dev@synapse.local` (rol `admin` de UA). Se midió dos veces: **sin**
`PLATFORM_OPERATOR_USER_IDS` y **con** ese usuario en la lista. El código se
leyó en `tenant_scope.go`, `router.go`, `agent_handler.go` y
`dd_materialize_handler.go`.

---

## Lo que anda, y no pidió cambios

| | Admin de un cliente | Operador de plataforma |
|---|---|---|
| `GET /admin/tenants` | **sólo su cliente** | los dos clientes locales |
| Selector en administración y builder | el nombre, sin caja | `<select>` con los dos; arranca en el propio |
| `/admin/tenants/{otro}/…` · catálogo, usuarios, agentes, feeds, roles, dashboards, layouts, `schema-check` | **403** «no puedes administrar otro cliente» | 200 |
| Consola | el cliente del token | el cliente del token |

**Visto en pantalla, como operador:** al elegir el otro cliente en Catálogo,
las ocho llamadas de la pantalla pasaron a ese cliente y contestaron 200; al
abrir el builder desde el menú, el selector seguía en el elegido. **La consola
no tiene selector**, que es lo que el backend pide: «hasta entonces el front no
debe armar un selector de cliente».

## Lo que quedó falso, y era nuestro

**«Alcance · todas las cuentas»** en Clientes y Usuarios. Desde `8272085` un
admin que no está en `PLATFORM_OPERATOR_USER_IDS` ve **un solo cliente**, y el
rótulo seguía diciendo todas. El front no sabe quién es operador —`/config/me`
no lo dice, y su respuesta lo deja para el pedido 4—, así que el chrome **cuenta
lo que llegó**: «Alcance · 1 cliente», «Alcance · 2 clientes». Con la lista
vacía, mientras carga, no afirma nada.

Prueba en `tests/surfaces/admin/admin.test.tsx`, verificada con dos mutaciones:
el plural fijo mata la prueba nueva, y el rótulo viejo mata las dos.

## Lo que está abierto del lado de ellos

**Dos rutas que su respuesta no menciona** cruzan clientes sin mirar el token.
No llevan `:tenantId` en la ruta, así que `RequireRouteTenant` no las ve, y sus
manejadores no comparan:

| Ruta | Qué devuelve a un admin de otro cliente | Medido |
|---|---|---|
| `GET /admin/agents?tenant_id=` | Los agentes de **cualquier** cliente. El grupo admite también `planner` | 200 con la semilla. Vacío porque la semilla no tiene agentes; lo abierto sale del código |
| `GET /admin/materialize/runs` | Las corridas de **cualquier** cliente, con `tenant_id` o sin filtro | 200. Sólo UA tiene corridas en local, así que el cruce sale del código |

**Las que ellos sí declaran abiertas**, remedidas: `GET /admin/layouts/{layoutId}`,
su `preview` y sus `publications`, y `GET /admin/dashboards/{dashboardId}/publications`
de la semilla contestan **200** a un admin de UA.

**El front no usa ninguna de las dos rutas nuevas para cruzar**: pide agentes
por `/admin/tenants/{tenantId}/agents` y corridas con el cliente de trabajo.

Pedido en `MENSAJE-2026-10-16-backend-dos-rutas-entre-clientes.md`.

## Lo menor

**El selector muestra sólo el nombre**, y los dos clientes locales se llaman
«Under Armour México». En el `<select>` no se distinguen; la lista de Clientes
sí, porque agrega el id corto. En QA los nombres no deberían repetirse, así que
no se tocó.

## Lo que sigue sin hacer, y no se vuelve a pedir

Los pedidos 2 a 6 del 2026-10-10 —super-admin, permiso de editar en el rol,
`/config/me` con ver y editar, la consola de otro cliente y el rol al aprobar—
siguen como dijo su respuesta del 13: **no hechos**.

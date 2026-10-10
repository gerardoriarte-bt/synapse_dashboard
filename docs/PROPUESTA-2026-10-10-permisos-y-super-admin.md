# Permisos: un solo criterio para ver y editar, y el super-admin · 2026-10-10

> **Propuesta de spec abierta, con fecha.** Registra decisiones de producto
> tomadas el 2026-10-10 y la parte de ellas que amplía `design.md`. **El agente
> no modifica `design.md`**: la ampliación queda acá hasta que se incorpore.

## 0 · De dónde sale

El humano, al querer pasar de un dashboard a otro en QA: «me hace ruido el hecho
de que desde el administrador pueda ver los dashboards, pero no la presentación
hacia usuario cliente, debería ser consistente: veo los que tengo permisos y
puedo visualizar y editar los dashboards según eso, y si no los tengo no los
veo».

**Lo que estaba viendo eran dos clientes, no dos dashboards.** En QA, «Synapse UA
HTML» y «Lobueno Analytics» son dos tenants. Lo leímos de
`GET /access-requests/tenants`, la lista pública del formulario de acceso, el
2026-10-10.

## 1 · Lo medido · contra `9dc481e`, el 2026-10-10

| | Dónde | Qué hace |
|---|---|---|
| Un usuario, un cliente | `internal/core/domain/user.go:11` | `TenantID` obligatorio y único |
| La consola, atada al token | `internal/adapters/handler/middleware.go:72` | El cliente sale de `claims.TenantID` y ninguna ruta de `/config/*` acepta otro |
| «Admin» es un nombre | `middleware.go:113` | `AdminOnlyMiddleware` es `RoleAllowedMiddleware("admin")`: compara el texto del rol, sin mirar el cliente |
| Admin de un cliente sobre otro | binario de `9dc481e`, base local | Con el token de un admin del cliente e65f81ae…, sobre el cliente 11111111…: leer roles, usuarios, catálogo y layouts → **200**; **crear un rol → 201** |
| Aprobar da el rol del agente | medido el 2026-10-09 | Una solicitud del formulario público, aprobada con el agente de UA (`target_role: admin`), **entró como admin** |

**El resultado:** cualquier usuario cuyo rol se llame `admin`, en cualquier
cliente, administra todos los clientes. La consola, en cambio, sólo muestra el
cliente del token. Por eso las dos caras no coinciden.

## 2 · Lo que `design.md` ya define

- **§3.1:** un usuario pertenece a exactamente un tenant, «sin usuario con
  permisos extendidos. Esta regla no se relaja nunca».
- **§3.2:** dos planos de identidad. **Operación**: usuarios de cliente, un
  tenant siempre. **Plataforma**: super-admin de Lo.Bueno, varios clientes por
  diseño, login separado, MFA obligatorio, y todo acceso a otro cliente
  auditado.
- **§3.5:** `SuperAdmin { id, nombre, email, mfaActivo, ultimoAcceso,
  accesoPorTenant[] }`, la única entidad sin `tenantId`.
- **§7.3, A1:** la banda de super-admins y sus reglas: MFA, no quedarse sin
  ninguno, nadie se revoca a sí mismo, alta por invitación.

**El backend de hoy no implementa ese plano**: el super-admin es un rol con
nombre `admin` dentro de un cliente. Eso es lo que viola §3.1.

## 3 · Las decisiones · humano, 2026-10-10

1. **Un solo criterio para ver y editar.** Lo que un usuario no puede ver no
   aparece en ninguna superficie, ni en la consola ni en administración ni en el
   builder.
2. **Editar se decide por ROL.** El dashboard queda supeditado al rol: el rol
   dice qué dashboards se ven y si se pueden editar.
3. **El admin de Lo Bueno opera los clientes que se le entregaron**, que pueden
   ser varios. **El admin de Keralty ve y edita sólo Keralty**, porque no se le
   dio más.
4. **El super-admin es el nivel de plataforma.** Recomendación aceptada: no hace
   falta un tercer nivel. Lo que distingue a un super-admin de otro es **su
   lista de clientes** (`accesoPorTenant[]`) y una capacidad explícita,
   **gestionar super-admins**, que tienen sólo algunos.

## 4 · Lo que amplía `design.md` · la propuesta de spec

**Que un rol de CLIENTE pueda editar.** `design.md` describe el builder y la
administración como superficies del super-admin (§7.2, §7.3). La decisión 2
permite que un rol de cliente —el admin de Keralty— edite los dashboards de su
cliente. **No es un usuario con permisos extendidos**: nunca sale de su tenant.
Lo que se amplía es qué puede hacer dentro de él.

**Que el acceso del super-admin sea una lista y no «todos».** §3.5 ya tiene
`accesoPorTenant[]`, y lo presenta como trazabilidad. La decisión 3 lo vuelve
también la concesión: cuáles clientes opera cada uno.

## 5 · Lo que esto cambia en el front · cuando el backend lo sirva

- **Consola:** el selector lista todos los dashboards que se pueden ver,
  agrupados por cliente. Para un usuario de cliente es un solo grupo, como hoy;
  para un super-admin son los clientes de su lista. Cambiar a otro cliente es
  elegir uno de sus dashboards.
- **Administración y builder:** sólo los clientes y dashboards que se pueden
  editar. El cliente de trabajo (`useClienteDeTrabajo`) ofrece esa lista y nada
  más.
- **A1:** la banda de super-admins del dibujo, con la lista de clientes de cada
  uno.

Nada de esto se construye antes: sin el campo en el contrato, la tarea está
bloqueada.

## 6 · El pedido

`docs/MENSAJE-2026-10-10-backend-permisos-y-super-admin.md`.

# Para el equipo de backend · 2026-09-22

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué
> evidencia. No se actualiza.
>
> **Reemplaza a `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`**, que pedía
> correr las migraciones. Eso quedó viejo en un día: las corrimos nosotros
> contra una base local y el chat avanzó hasta el siguiente obstáculo.

Levantamos `82da946` limpio contra una base Postgres local —en Docker, con
`DB_AUTO_MIGRATE=true`, que ahí sí se puede— y medimos ruta por ruta. Todo lo de
abajo está medido hoy, no supuesto.

Son tres cosas: **una que nos frena**, **una decisión que necesitamos** y **un
hallazgo en el código que conviene que miren**.

---

## 1 · El chat necesita un agente · nos frena

Las migraciones ya no son el problema. Con las tablas creadas, el chat responde:

```
POST /api/v1/config/chat
409 · {"success":false,"error":"no hay agente activo disponible para este tenant y rol"}
```

`GET /api/v1/admin/tenants/{tenantId}/agents` devuelve `[]`. Un agente pide
cuenta, usuario, rol y clave privada de Snowflake, y el servicio no tiene un modo
que no llame a Cortex —`internal/core/services/cortex_chat.go` habla contra
Cortex de verdad—. **Nosotros no corremos nada en Snowflake.**

**Por qué importa:** todo el chat del front está construido y probado contra
mocks nuestros, y los mocks responden lo que *nosotros creemos* del cable. Ya nos
pasó una vez: el discriminador del SSE se había movido a la línea `event:`, las
pruebas pasaban en verde y el chat no pintaba una sola palabra. **Hasta que no
haya un agente de verdad, no sabemos si vuelve a pasar.**

**Lo que pedimos, cualquiera de las dos:**

- **Un agente de prueba** cargado para un tenant, con credenciales que podamos
  usar desde acá. Nos alcanza con uno y con vistas de solo lectura.
- **O un modo sin Cortex** —un flag— que emita la misma trama SSE con respuestas
  fijas. Con eso verificamos la frontera sin tocar Snowflake, y a ustedes les
  sirve para sus propias pruebas.

**Cómo nos lo mandan:** con el agente cargado alcanza que nos digan el tenant y
el usuario; lo comprobamos nosotros y les devolvemos el resultado. Si es un flag,
el nombre de la variable y qué emite.

---

## 2 · La misma ruta, dos respuestas distintas · necesitamos que decidan

`GET /api/v1/admin/tenants/{tenantId}/roles` está registrada **dos veces**, y las
dos son razonables:

| | Suya · `168a761` | Nuestra · en el fork |
|---|---|---|
| Handler | `ddDashboardHandler.ListRoles` | `ddRoleHandler.List` |
| DTO | `DDRoleAccess` | `DDRoleDTO` |
| Campos | `id`, `name`, `dashboard_ids`, `default_dashboard_id` | `id`, `tenant_id`, `name`, `tab_ids`, `hidden_metric_ids`, `layout_overrides`, `user_count` |
| Contesta | **qué dashboards ve este rol** | **qué ve este rol dentro de un layout**, y si se puede borrar |

**No es un choque de nombres: son dos preguntas distintas** que quedaron con la
misma URL. La suya es de multi-dashboard; la nuestra es de composición por rol y
lleva `user_count` porque la pantalla tiene que saber si el rol se puede borrar
**antes** de ofrecer el botón.

**Esto es lo que frena el rebase.** Nuestra rama está rebasada y verde sobre
`82da946`, pero contra `168a761` el conflicto es real y no lo resolvemos solos:
elegir por ustedes sería decidir la forma de su API.

**Lo que proponemos, y es lo que menos les cuesta:** **nos corremos nosotros.**
Ustedes se quedan con `/roles` tal como está y nosotros movemos la nuestra —
`GET /admin/tenants/{tenantId}/roles/composition` nos sirve, o el nombre que
prefieran. Cero cambios en su código, que es la regla con la que venimos
trabajando.

**La alternativa, si les gusta más:** un solo recurso con la unión de los campos.
Es más lindo de consumir y tiene un costo real —un DTO con dos dueños—, así que
la decisión es de ustedes.

**Cómo nos lo mandan:** una línea alcanza. «Se quedan ustedes con `/roles`, muevan
la suya a X» o «únanlas». Con eso rebasamos y les dejamos el PR al día.

---

## 3 · Un hallazgo · el `Tenant` embebido serializa sus credenciales

**Todavía no se ve una credencial en ninguna respuesta**, y por eso lo mandamos
ahora y no como incidente. Es la forma, no un dato filtrado.

`domain.Tenant` declara `PrivateKeyPEM` y `PrivateKeyPassphrase` **sin etiqueta
`json`**, así que se serializan con el nombre del campo. Y varias entidades lo
embeben **sin `json:"-"`**: `dd_layout_version.go`, `agent.go`,
`access_request.go`, `role.go`, `user.go`.

Dos repositorios hacen `Preload("Tenant")` —`agent_repository.go` y
`access_request_repository.go`— y `GET /admin/agents?tenant_id=` devuelve
`domain.Agent` **crudo**, no el DTO que sí usa `GET /admin/tenants/{id}/agents`.

Lo que vimos hoy, contra nuestra base local:

```
GET /api/v1/admin/tenants/{tenantId}/layouts
→ { "ID": "…", "Tenant": { "PrivateKeyPEM": "", "PrivateKeyPassphrase": "", … } }
```

Sale vacío porque nuestro tenant local no tiene credenciales cargadas. **Con un
tenant que sí las tenga y un agente cargado, ese `Preload` las pone en la
respuesta**, y esas rutas las consume un navegador.

**La corrección ya está en su código:** `dd_catalog_metric.go` embebe el mismo
`Tenant` **con `json:"-"`**. Faltaría aplicarlo parejo, o devolver un DTO en las
rutas que preloadean. No lo tocamos nosotros: es de ustedes y no queremos meter
ruido en un archivo suyo.

---

## Lo que NO les pedimos, para que no se mezcle

Medimos varias cosas que siguen faltando y **ninguna es urgente hoy**, así que
van nombradas y sin pedido: `GET /config/plots` y `GET /config/feeds` dan 404,
`sync-catalog` sigue sin correr —el catálogo devuelve las doce claves de la
semilla de Postgres y no las diez de Snowflake—, la columna de una tabla no
declara `decimals` ni `unit`, y el panel que dice `31 DAYS` en su BASE sirve ocho
puntos mensuales. Están en `plan-de-trabajo.md` con su tarea; las levantamos
cuando toquen.

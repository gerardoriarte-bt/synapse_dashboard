> ⚠️ **HISTÓRICO · no usar como referencia de rutas.** Se conserva tal como se
> mandó. **Su cita de `GET /admin/tenants/{tenantId}/roles` venció el
> 2026-09-25**: ese listado se movió a `.../roles/composition` porque
> `168a761` puso el de ellos en la ruta original, y en `/roles` sólo quedó el
> `POST`. El razonamiento del mensaje sigue siendo el que explica por qué se
> pidió lo que se pidió.

# Para el equipo de backend · 2026-09-22

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué
> evidencia. No se actualiza.
>
> **Reemplaza a `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`**, que pedía
> correr las migraciones. Eso quedó viejo en un día: las corrimos nosotros
> contra una base local y el chat avanzó hasta el siguiente obstáculo.
>
> **Va junto con `docs/MENSAJE-2026-09-22-datos-agente-cortex.md`**, que es la
> mitad que le toca al equipo de datos: el agente de Cortex y sus credenciales
> son de ellos, no de backend.

Levantamos `82da946` limpio contra una base Postgres local —en Docker, con
`DB_AUTO_MIGRATE=true`, que ahí sí se puede— y medimos ruta por ruta. Todo lo de
abajo está medido hoy, no supuesto.

Son tres cosas: **una que arranca cuando datos entregue la clave**, **una
decisión que necesitamos** y **un hallazgo en el código que conviene que miren**.

---

## 1 · El chat · lo que les toca a ustedes, cuando datos entregue la clave

**Corrección respecto de cómo se lo planteamos primero:** el agente de Cortex lo
maneja el **equipo de datos**, no ustedes. El pedido de credenciales va por ahí —
`docs/MENSAJE-2026-09-22-datos-agente-cortex.md`.

Lo que sí es de ustedes es el final del camino. Hoy:

```
POST /api/v1/config/chat
409 · {"success":false,"error":"no hay agente activo disponible para este tenant y rol"}
```

`GET /api/v1/admin/tenants/{tenantId}/agents` devuelve `[]`. Cuando datos nos dé
el par de claves, hay que **cargar el tenant y el agente** con las rutas de alta
que su router ya registra —`tenantHandler.Create` y `agentHandler.CreateForTenant`,
en `internal/adapters/handler/router.go`—. Nosotros **no las tenemos transcritas
al cable** porque no las llamamos desde el front, y una ruta transcrita que nadie
llama envejece sin que nadie lo note.

Verificamos contra la cuenta `MAA16864` que todo lo demás está:

| Campo | Valor verificado el 2026-09-22 |
|---|---|
| `snowflake_account` | `MAA16864` |
| `snowflake_user` | `SYNAPSE_SERVICE_USER` |
| `snowflake_role` | `SYNAPSE_APP_ROLE` |
| `snowflake_db` · `snowflake_schema` | `DB_BT_UA` · `BT_UA_MART_ANALYTICS` |
| `snowflake_cortex_agent_name` | `SYNAPSE_UA` |
| `warehouse` | `SYNAPSE_UA` |
| `semantic_views` | `["SYNAPSE_UA"]` |

**Lo único que falta es `private_key_pem`.** Si prefieren cargarlo ustedes en vez
de que lo hagamos nosotros, mejor — ver el punto 3, que es la razón.

**Por qué esto no puede esperar mucho:** todo el chat del front está probado
contra mocks nuestros, y un mock responde lo que *nosotros creemos* del cable. Ya
nos pasó: el discriminador del SSE se había movido a la línea `event:`, las
pruebas pasaban en verde y el chat no pintaba una palabra.

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

**Esto es lo que vuelve urgente al punto 1.** Al equipo de datos le pedimos hoy
una clave privada de Snowflake, y **se lo contamos en el mismo pedido**: no nos
parece correcto pedir un secreto sabiendo que hay un camino por el que puede
salir. Les recomendamos a ellos entregar primero una clave revocable. Si esto se
corrige antes, mejor para todos.

---

## Lo que NO les pedimos, para que no se mezcle

Medimos varias cosas que siguen faltando y **ninguna es urgente hoy**, así que
van nombradas y sin pedido: `GET /config/plots` y `GET /config/feeds` dan 404,
`sync-catalog` sigue sin correr —el catálogo devuelve las doce claves de la
semilla de Postgres y no las diez de Snowflake—, la columna de una tabla no
declara `decimals` ni `unit`, y el panel que dice `31 DAYS` en su BASE sirve ocho
puntos mensuales. Están en `plan-de-trabajo.md` con su tarea; las levantamos
cuando toquen.

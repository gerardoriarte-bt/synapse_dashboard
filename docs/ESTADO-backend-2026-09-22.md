# Qué sirve el backend hoy · corte del 2026-09-22

> **Un corte verificado contra el servicio corriendo, con fecha.** No se
> actualiza: cuando venza, se reemplaza por otro. Lo que sigue vigente vive en
> `plan-de-trabajo.md`, que es la fuente.

Se midió porque `docs/ESTADO.md` decía «0 tomables · 40 bloqueadas» y **entre
las bloqueadas había veinticuatro `B*` que el servicio implementa y usamos todos
los días**. No se habían movido porque la regla de este repositorio pide
verificarlas contra un servicio corriendo, y hasta el 2026-09-22 no había
ninguno que fuera nuestro.

---

## Lo primero que enseñó, y es lo que más vale

**Casi registramos nuestro propio código como avance del backend.**

El binario que veníamos corriendo en `:4010` es el **fork** —`rebase-prueba`,
rebasado sobre `82da946`—, y la primera pasada de medición encontró
`measurement_window` en el catálogo, `open_period` en `/config/me`, `user_count`
y `last_published_at` en `/admin/tenants`, `PublishedBy` en los layouts y una
ruta `/admin/layouts/{layoutId}/diff`. Todo eso parecía ser B1.17, B1.25, B1.27,
B4.1 y B4.2 llegando.

**Las seis cosas son nuestras.** Las escribió el equipo de front en `2fafe82` y
`198fea8`, y ninguna existe en `82da946`:

```
git diff 82da946..rebase-prueba -- '*.go' | grep '^+.*measurement_window'
```

Correr el fork contra la base local hace que nuestro código se vea como el de
ellos. **La medición sólo cuenta contra upstream limpio**, así que se levantó
`82da946` en un worktree aparte, en `:4011`, contra la misma base — y es contra
ése que está hecha la tabla de abajo.

Es la misma familia que «un mock que habla el idioma de tu capa interna no prueba
la frontera, la esconde», entrando por otro lado: **un binario propio que sirve
las rutas de otro no prueba que el otro las sirva.**

## Cómo se midió

| | |
|---|---|
| Servicio | `82da946` limpio, en un worktree, `:4011` |
| Base | la local de `dev/postgres`, migrada y sembrada por el propio binario |
| Credenciales | `dev@synapse.local`, rol `admin`, del `arranque.sql` |
| Herramienta | `npm run humo` para las rutas transcritas · sondas directas para el resto |

**Dos límites que conviene tener presentes.** La base es local y recién sembrada,
así que lo que se mide del *dato* —que la semilla exista, que doce paneles
resuelvan— dice menos que contra un entorno vivo. Y el `PUT` de layouts no se
probó: escribe.

---

## La tabla

| Tarea | Criterio, en corto | Medido contra `82da946` | Estado |
|---|---|---|---|
| **B0.4** · envelope | envelope en todo · `codigo` estable | `/config/*` y `/admin/*` lo llevan; **un 404 de ruta desconocida devuelve `404 page not found` en texto plano**, y el error trae `error` como cadena, **sin `codigo`** | ⬜ |
| **B1.1** · `/config/me` | cada `Periodo` declara `grano` | `periods` son cadenas sueltas · `tenant.name` viene vacío | ⚠️ |
| **B1.6** · batch | fallo parcial · ocho en una llamada | **doce paneles en una llamada**, los doce `AVAILABLE`. El fallo parcial **no se pudo medir**: no hay panel que falle | ⚠️ |
| **B1.13** · `Presentacion` | rótulos ya redactados · `label` con unidad | **cumple** · llega en 6 de 12 —los seis `kpi`— con `label`, `meter` y `comparative` redactados. Los dos monetarios dicen «USD · TOTAL» y los otros cuatro «TOTAL», que es correcto: ROAS y los conteos no llevan unidad | **✅** |
| **B1.14** · formas de `Valor` | `tabular` declara `decimales` y `unidad` | **no cumple** · la columna es `{key, title, numeric}` y nada más. Además **un panel `prose` llega sin `pillars`** | ⬜ |
| **B1.15** · mínimos por forma | gauge sin máximo · serie vacía | **no medible** · la semilla no trae ni un `gauge` ni una serie vacía | ⬜ |
| **B1.16** · seed | 1 tenant · 1 layout · 1 pestaña · 4–6 paneles | 1 · 1 · 1 · **12 paneles** y 12 métricas. Sigue faltando «Brand Momentum» | ⚠️ |
| **B1.17** · modelo `Metrica` | `window` en el catálogo | **ausente en upstream** · el campo que veíamos es del fork | ⬜ |
| **B1.18** · sync con Snowflake | el catálogo sale de la vista | **no corrió** · `/config/catalog` devuelve las **doce claves de la semilla de Postgres** y no las diez de Snowflake | ⬜ |
| **B1.19** · filtrar por rol | el catálogo llega filtrado | **no medible** · hay un solo usuario | ⬜ |
| **B1.21** · mínimos por gráfico | `GET /config/plots` | **404** · la ruta no existe | ⬜ |
| **B1.25** · `ventana` | el campo en el catálogo y en la BASE | **ausente en upstream** · es del fork, y ahí llega **vacío en las doce** | ⚠️ |
| **B1.27** · período cerrado | un campo que diga si está en curso | **ausente en upstream** · `open_period` es del fork | ⚠️ |
| **B2.7** · `SIN_PERMISO` | estado en el batch | **no medible** · depende de B0.9 | ⬜ |
| **B2.13** · salud de feeds | por fuente, con frescura | **404** · no hay ruta | ⬜ |
| **B3.1** · chat SSE | eventos en orden | **409 · «no hay agente activo disponible para este tenant y rol»** · ver abajo | ⬜ |
| **B3.9** · CRUD de agentes | ninguna respuesta incluye la credencial | el CRUD existe y responde. **Ver el hallazgo de abajo** | ⬜ |
| **B3.11** · migraciones | las nueve columnas en la base **compartida** | corridas en la **local**, por `DB_AUTO_MIGRATE=true`. La compartida no responde desde acá, así que el criterio **sigue sin verificarse** | ⬜ |
| **B4.1** · `/admin/tenants` | cinco campos | devuelve `{id, name}` · **faltan los cinco** | ⚠️ |
| **B4.2** · layouts del tenant | autor, diferencia y reversión | `{ID, TenantID, Status, VersionID, PublishedAt, …}` · **sin autor y sin diff** | ⚠️ |
| **B4.4** · `PUT /admin/layouts/{id}` | editar pestañas y paneles | **no probado**: escribe | ⚠️ |
| **B4.10** · roles y preview | `tabIds`, `hiddenMetricIds`, preview | **404** en upstream | ⬜ |
| **B5.1** · varios layouts | `layouts` sólo con más de uno | **no medible** · hay un solo layout | ⬜ |

**Una sola tarea se mueve: B1.13.** El resto se queda donde estaba, y eso
también es resultado: el tablero decía la verdad.

---

## Lo que sí cambió, aunque no mueva un estado

### El chat ya no espera migraciones · espera un agente

`CLAUDE.md` decía que lo único que frenaba era B3.11. **Eso venció**: la base
local corrió las migraciones. Lo que frena ahora es otra cosa y es más dura:

```
POST /api/v1/config/chat
409 · {"success":false,"error":"no hay agente activo disponible para este tenant y rol"}
```

`GET /admin/tenants/{tenantId}/agents` devuelve `[]`. Un agente necesita cuenta,
usuario, rol y clave privada de Snowflake, y **el servicio no tiene modo sin
Cortex** —`internal/core/services/cortex_chat.go` habla contra Cortex de verdad—.
Nosotros no corremos nada en Snowflake.

**Consecuencia:** las once tareas cerradas de Fase 3 siguen verificadas **sólo
contra mocks**, y no hay forma de cambiarlo desde acá. El pedido correcto ya no
es «corran las migraciones» sino **un agente de prueba con credenciales, o un
modo que no llame a Cortex**.

### Un hallazgo para ellos · el `Tenant` embebido serializa sus credenciales

`domain.Tenant` declara `PrivateKeyPEM` y `PrivateKeyPassphrase` **sin etiqueta
`json`**, y varias entidades lo embeben también sin `json:"-"`:
`dd_layout_version.go`, `agent.go`, `access_request.go`, `role.go`, `user.go`.
Dos repositorios hacen `Preload("Tenant")` —`agent_repository.go` y
`access_request_repository.go`—, y `GET /admin/agents?tenant_id=` devuelve
`domain.Agent` **crudo**, no el DTO que sí usa `GET /admin/tenants/{id}/agents`.

**Hoy no se ve una credencial**: nuestro tenant local las tiene vacías a
propósito y no hay agentes cargados, así que `GET /admin/tenants/{id}/layouts`
serializa el `Tenant` embebido **en cero**. Es una filtración **latente**, no una
observada — pero la forma ya está ahí.

**La corrección está en su propio código:** `dd_catalog_metric.go` embebe el
mismo `Tenant` **con `json:"-"`**. Falta aplicarlo parejo, o devolver un DTO en
las rutas que preloadean.

### Tres diferencias del dato, chicas y anotadas

- La columna de una tabla no declara `decimals` ni `unit`, así que la
  participación se dibuja «39.6» donde el `.pen` pone «39.6%».
- Un panel `prose` —el `executive_summary`— llega **sin `pillars`**, sólo
  `headline`.
- El panel que declara `31 DAYS` en su BASE **sirve ocho puntos mensuales**
  (`jan`, `feb`, `mar`…), los mismos que el de doce meses. Es lo que dejó a
  F1.44 sin poder deducir qué significa `cut` en un `series`.

### La materialización de `82da946` responde

`GET /admin/materialize/status` → `{enabled:false, run_at:"03:00",
run_on_boot:true, running:false}` y `/runs` → `[]`. El modelo nuevo está ahí y
apagado, que es lo que el flag por defecto dice.

---

## Qué hacer con esto

1. **B1.13 pasa a ✅** con esta fecha.
2. Las esperas de B1.17, B1.25, B1.27, B4.1 y B4.2 se quedan como están —**lo que
   creíamos llegado es nuestro**— y conviene que el pedido lo diga, para que
   nadie lo vuelva a leer como cumplido.
3. B1.18, B1.21, B2.13 y B4.10 pasan de «no verificado» a **medido y ausente**.
4. El pedido del chat se reescribe: agente, no migraciones.
5. El hallazgo del `Tenant` embebido se les manda.

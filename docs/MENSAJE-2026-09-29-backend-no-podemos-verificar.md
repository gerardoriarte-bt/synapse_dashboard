> ## ⚠ ESTE MENSAJE QUEDÓ OBSOLETO EL MISMO DÍA · NO SE ENVÍA
>
> Se escribió a la mañana, cuando su respuesta describía código que no estaba en
> el repositorio. **Empujaron a la tarde** —`e1037d9` y `de881e1`— y todo lo que
> acá se dice «no está» pasó a estar.
>
> **Se conserva sin editar**, que es la regla de esta casa para los mensajes: lo
> que reemplaza es `docs/MENSAJE-2026-09-29-backend-todo-medido.md`, con lo
> medido contra `de881e1`.
>
> **Lo que sí sirvió de acá**: que el documento llegara antes que el commit, y
> que no cerráramos nada contra él. Si lo hubiéramos hecho, habríamos cerrado
> diez pedidos el 28 y el 29 no habría habido nada que medir.

# Para el equipo de backend · no podemos verificar el commit que describen · 2026-09-29

> Contesta su `RESPUESTA-2026-09-28-todo-lo-que-falta.md`. **Ustedes mismos
> pidieron que remidiéramos antes de regenerar** —«los seis pedidos de código de
> su lista deberían caerse solos»—, así que lo hicimos primero.
>
> **No se cayó ninguno**, y creemos que no es porque estén mal: es porque **el
> código no está en el repositorio que seguimos.**

## Lo que miramos, en orden

| Qué | Resultado |
|---|---|
| `git fetch` sobre `feature/dynamic-dashboard-backend` | **Sin commits nuevos** · la punta sigue en `f70cec2` |
| `git log --all --since=2026-09-28` | Sólo `f70cec2`, `52f1990` y `5924bf2` — los de antes |
| Las ramas, según la API de GitHub | **Dos**: `feature/dynamic-dashboard-backend` → `f70cec2` y `main` → `c366289` (13 de agosto) |
| Pull requests abiertos | **Ninguno** |

El remoto que miramos es `https://github.com/AntPack-dev/synapse-api-go.git`. Si
hay otro, decímos cuál y lo medimos hoy mismo.

## Y lo corroboramos midiendo, no sólo con `git`

El servicio que tenemos levantado está construido desde `f70cec2`. Las cinco
cosas que el documento da por entregadas siguen como antes:

| Dicen | Medido |
|---|---|
| `POST /admin/agents` pasa por el traductor | `Key: 'createAgentRequest.tenant_id' Error:Field validation for 'tenant_id' failed on the 'required' tag` |
| `FORBIDDEN` trae `reason` y `unlocks_with` | El payload es `{request_from, status}` y nada más |
| `DEGRADED` trae `stale_since` | Sus claves son `governance message reason status unlocks_with value` · sin `stale_since` |
| `roles/composition` devuelve `tab_keys` | El rol trae `tab_ids` · **no hay `tab_keys`** |
| El diff sale con `[]` en vez de `null` | `tabs_added`, `panels_added` y `tabs_reordered` vuelven **`null`** |

**No lo tomen como una acusación**: lo más probable es que el commit no esté
empujado todavía, o que esté en un remoto que no conocemos. Lo decimos porque
**pedirnos que remidamos contra algo que no podemos alcanzar nos deja sin forma de
cerrarles nada** — y porque la semana pasada nos pasó lo inverso y les mandamos
cosas equivocadas.

**Lo que necesitamos es una línea:** el commit o la rama. Con eso remedimos el
mismo día y los seis se caen solos, como dicen.

## Un documento que citan y no llegó

`RESPUESTA-2026-09-28-todo-lo-que-falta.md` remite a
**`RESPUESTA-2026-09-28-tres-del-alta.md`** para B1.29–B1.31, y ese archivo **no
llegó**. Así que de los tres del alta —`schema-check`, `sync-catalog` como ruta y
el par RSA— **no tenemos su respuesta**, sólo la referencia.

## Donde tienen razón y el error es nuestro

**«Dicen que nos pasaron los tres archivos el 28; no nos llegaron.»** Es cierto, y
la causa es la misma de todo lo demás: **estaban en NUESTRO repositorio**, que
ustedes no ven. Decir «se los pasamos» cuando lo que hicimos fue escribirlos en
nuestro lado es exactamente el error que les estamos señalando, al revés.

**Va en uno solo, completo:** `docs/ENTREGA-2026-09-29-repertorio-de-graficos.md`
—537 líneas— con el repertorio de los 49, la decisión de los mínimos y el
fragmento del contrato con `GET /config/plots`, `GraficoId`, `Grafico` y
`MinimoDeDatos` tal cual están.

**Lo que conviene no perder al implementarlo**: el mínimo es **de la forma**, y un
gráfico lo sube sólo si su geometría lo exige — sólo tres lo hacen. Y
`MinimoDeDatos` lleva `forma` porque **nueve de los 49 sirven dos formas** con
umbrales distintos sobre la misma variable.

## Las tres respuestas que SÍ pudimos usar

Éstas no necesitaban código y las tomamos:

**`cut`** · gracias, cierra la duda: `day` y `month`, lo aplica el front, y lo
mismo vale para `normalization` y el `order` de las tablas. Coincide con lo que
habíamos medido —ningún consumidor en `internal/core/`—. **B1.32 se cierra.**

**`ERROR`** · los dos caminos que describen contestan la pregunta. El segundo es
el que nos servía: `options` inválidas en un layout publicado antes de que
existiera la validación. **Queda escrito como alcanzable y con cómo.**

**`/config/solicitudes`** · perfecto que lo lleven a producto. Mientras tanto
pintamos el estado **sin CTA**, que es lo que ya habíamos propuesto — un botón que
devuelve 404 es peor que su ausencia.

## Qué hacemos mientras tanto

**Los pedidos quedan abiertos y con su marca**, que ahora dice contra qué commit
se midió cada uno: hoy los once dicen `f70cec2`. En cuanto nos pasen el commit
nuevo, remedimos y `PARA-BACKEND.md` se regenera solo con lo que quede.

**No los cerramos contra un documento.** Es la regla que nos costó cinco pedidos
falsos la semana pasada, y aplica igual cuando el documento es de ustedes: una
respuesta que dice «hecho» es una afirmación, no una medición.

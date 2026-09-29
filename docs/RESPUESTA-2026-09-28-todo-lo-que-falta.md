# Para el equipo de frontend · los once, contestados · 2026-09-28 (noche)

> Contesta su `MENSAJE-2026-09-28-backend-todo-lo-que-falta.md`. Midieron contra `f70cec2`;
> este commit trae **dos tandas** que no habían visto: los tres del alta (B1.29–B1.31, ya
> respondidos en `RESPUESTA-2026-09-28-tres-del-alta.md`) y lo de abajo. Todo medido contra el
> servicio corriendo sobre la base local.

## Código que entra en este commit

| Pedido | Qué | Cómo se ve |
|---|---|---|
| **B0.4** | `POST /config/chat` y los binding de `POST /admin/agents*` pasan por el traductor | `400 VALIDATION_REQUEST · solicitud inválida: el campo 'tenant_id' es obligatorio; …` |
| **B2.14** | `FORBIDDEN` trae `reason` y `unlocks_with` como los otros estados | `{status: FORBIDDEN, reason: "Tu rol no tiene acceso a esta métrica", unlocks_with: "Pedile al administrador del tenant que la habilite para tu rol", request_from: "admin"}` |
| **B1.28** | `DEGRADED` por antigüedad dice desde cuándo | `stale_since` (ISO) = última materialización + tolerancia, y la `reason` nombra la fecha: «Los datos tienen más de 3 días: la última actualización fue el 2026-09-25» |
| **B4.18** | `roles.tab_keys` | Ver abajo |
| **B1.29 · B1.30 · B1.31** | Los tres del alta | `RESPUESTA-2026-09-28-tres-del-alta.md` |
| — | Diff de publicaciones sin `null` | Las colecciones vacías salen `[]`. Las publicaciones ya guardadas conservan el JSON viejo con `null`; las nuevas no |

### B4.18 · `roles.tab_keys`, como lo acordamos

- **Columna nueva `tab_keys`** (lista de `dd_tabs.key`). Es la fuente de verdad hacia adelante:
  si el rol tiene `tab_keys`, la pestaña se decide por su `key`; si está vacía, se usa `tab_ids`
  como hasta ahora; ambas vacías = todas. Un rol restringido por key **sobrevive a publicar y a
  revertir**.
- **`POST /admin/tenants/{id}/roles` y `PUT /admin/roles/{id}` aceptan `tab_keys`** (se
  normalizan a slug, se quitan repetidas; cada una debe existir en algún layout del tenant,
  borradores incluidos, para poder preparar el rol antes de publicar → `400 VALIDATION_REQUEST`
  si no). `GET .../roles/composition` devuelve `tab_keys` y `tab_ids`, siempre listas.
- **La migración rellena `tab_keys` una sola vez** con las keys de los `tab_ids` actuales, así
  los roles del seed (`admin`, `user`, `planner` → `["overview"]`) quedan protegidos sin que nadie
  toque la consola. `tab_ids` no se borra ni se deja de aceptar.
- **Para ustedes:** la consola de roles puede pasar a escribir `tab_keys` y dejar de mandar
  `tab_ids`. El campo `key` de cada pestaña ya viaja en `/config/me`, `/config/tabs/{id}`, el
  preview y el builder.

Medido: planner con `tab_keys: ["overview"]` ve la pestaña aunque su `tab_ids` apunte a un id de
otra versión; con `["marca"]` no la ve; con `[]` vuelve al fallback. Una key inexistente da 400 con
la frase en español.

## Las tres preguntas

**B1.32 · `cut`.** Sí: los únicos valores son `day` y `month`, y **lo aplica el front**. Ningún
código del backend lee `cut` ni `normalization` (ni `order` de tablas): son `layout_params`
declarativos que viajan en `options` del panel y los honra quien dibuja. Lo mismo vale para
`horizon_cut` de `forecast` cuando exista dato.

**B2.12 · ¿con qué se provoca `ERROR` hoy?** Dos caminos:
1. **Materialización fallida sin `AVAILABLE` previo**: si la query o el transformador fallan y no
   hay fila `AVAILABLE` para ese (métrica, período), se escribe `ERROR` con `message` técnico. En
   local se reproduce apuntando `DD_SNOWFLAKE_ECOMM_TABLE` a una tabla inexistente y corriendo
   `POST /admin/tenants/{id}/materialize` sobre un período que nunca se materializó (p. ej. un mes
   futuro). Si ya había `AVAILABLE`, la regla lo preserva y verán `DEGRADED`, no `ERROR`.
2. **`options` inválidas en un panel ya publicado** (`gauge` sin `maximum`, `forecast` sin
   `horizon`, JSON roto): el batch responde `ERROR` con «Configuración del panel inválida: …». El
   builder ya lo rechaza al validar, así que solo pasa con layouts publicados antes de esa
   validación o editados por fuera.

**B2.14 · ¿habrá `/config/solicitudes`?** Es decisión de producto y la llevamos. Mientras tanto
el estado ya viene declarado (`reason` + `unlocks_with`), así que pueden pintarlo **sin CTA**;
si producto dice que sí, la ruta sería `POST /config/access-requests` reusando el flujo de
`access_requests` que ya existe para el alta de usuarios.

## Lo que sigue esperando

- **B2.15** · prender `DD_MATERIALIZE_PROSE_ENABLED` en dev tras el deploy y avisar. Fecha, no
  código.
- **B1.21 · `GET /config/plots`**. Dicen que nos pasaron los tres archivos el 28; **no nos
  llegaron** (no están en el repo ni en el canal). Sin la tabla de 49 y el contrato de `Grafico`
  y `MinimoDeDatos` no hay contra qué implementar. Reenvíenlos, o el path del fork, y va en el
  siguiente commit.

## Sobre su chequeo de vigencia

Bien. Para que no se venza en falso: este commit toca once rutas o formas (`/config/chat`,
`/admin/agents`, `panels:batch`, roles, publicaciones y las cuatro del alta). Remidan contra él
antes de regenerar `PARA-BACKEND.md`; los seis pedidos de código de su lista deberían caerse
solos, y los dos que quedan (B2.15 y B1.21) están explicados arriba.

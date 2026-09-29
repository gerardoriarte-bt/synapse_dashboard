# Para el equipo de backend · medido contra `de881e1` · 2026-09-29

> Empujaron, y medimos. **De los diez pedidos que teníamos abiertos quedan
> siete**, y de esos siete **tres ya no dependen de ustedes**.
>
> Todo lo de abajo sale de construir `de881e1` y levantarlo acá, no de leer su
> respuesta. Su documento llegó a la mañana y el commit a la tarde; no cerramos
> nada hasta poder medirlo.

## Lo que entró y está verificado

| | Qué | Medido |
|---|---|---|
| **B0.4** ✅ | Los errores en español, **las dos rutas** | `POST /admin/agents` → «el campo 'tenant_id' es obligatorio; …» · `POST /config/chat` → «el campo 'question' es obligatorio». **Ni un nombre de struct.** Cierra una tarea abierta desde el 2026-09-14 |
| **B1.28** ✅ | `stale_since` | `2026-09-12T14:38:08Z` con `reason` «Los datos tienen más de 3 días: la última actualización fue el 2026-09-09». Es `materialized_at` + tolerancia |
| **B4.18** ✅ | `roles.tab_keys` | Ver abajo · **se verificó la sustancia, no el campo** |
| **B2.14** ⚠ | `FORBIDDEN` con razón | `reason` «Tu rol no tiene acceso a esta métrica» y `unlocks_with` «Pedile al administrador del tenant que la habilite para tu rol» |
| — | El diff sin `null` | Una publicación **nueva** sale con `[]` en todas sus colecciones. Las viejas conservan `null`, como avisaron |

### B4.18 · lo verificamos rompiendo, no mirando

Que la columna exista no prueba nada. Lo que prueba es que un rol sobreviva:

> Se le puso a `planner` un `tab_ids` apuntando a un **uuid inexistente**,
> dejándole `tab_keys: ["overview"]`. `GET /config/me` le devolvió **su pestaña
> igual**. Con el `tab_ids` roto y sin `tab_keys`, la habría perdido.

Y la migración hace lo que dijeron: `admin`, `planner` y `user` quedaron en
`["overview"]` sin que nadie tocara la consola.

**Una advertencia, y el error fue nuestro:** la primera medición dio `tab_keys:
[]` en los cuatro roles y por un momento pareció que la migración no corría. **Se
había levantado el servicio sin `DB_AUTO_MIGRATE=true`**, así que la columna no
existía y el campo salía vacío por defecto. Lo decimos por si alguien más lo mide
y se confunde igual.

### `B2.14` · con esto F2.3 se puede construir

El estado ya declara qué pasa y qué lo desbloquea, y **la redacción no promete una
acción que no existe** — dice a quién pedirle, no «solicitá acceso». Es
exactamente lo que el criterio pedía, así que **pintamos sin CTA** y la ruta queda
como decisión de producto de su lado, sin bloquearnos.

## Los tres del alta · llegaron, y lo que falta NO es suyo

`e1037d9` trae las tres rutas. Las tres responden. **Ninguna se pudo ejercitar
hasta el final, y el motivo es de datos:**

```
GET /admin/tenants/{id}/schema-check    → 502
  "snowflake sql: status 401: 390422 · Incoming request with IP/Token
   190.27.36.15 is not allowed to access Snowflake"

POST /admin/tenants/{id}/sync-catalog   → 502  (mismo bloqueo)
```

**Las rutas llegan hasta intentar la consulta** — o sea que están bien cableadas.
Lo que falta es que datos habilite nuestra IP de salida, que cambió desde el
2026-09-24, cuando la habilitaron para el chat. **Va pedido a datos, no a
ustedes.**

**`POST .../service-key`** existe, y su guarda es lo mejor que trae:

```
409 CONFLICT_KEY_EXISTS · "el tenant ya tiene una clave de servicio;
                           enviá rotate=true para reemplazarla"
```

**No probamos la rotación a propósito**: en este tenant la clave es la real, la
que hace andar el chat contra Cortex. Rotarla habría roto el entorno para
comprobar algo que la guarda ya demuestra. Se cierra con el próximo alta real, que
es cuando importa.

## Lo que sigue esperando · y son dos

**`B1.21 · GET /config/plots`.** Tenían razón: los tres archivos **nunca les
llegaron**, porque estaban en nuestro repositorio. Van en uno solo y completo:

> **`docs/ENTREGA-2026-09-29-repertorio-de-graficos.md`** · 537 líneas · el
> repertorio de los 49, la decisión de los mínimos y el fragmento del contrato
> con `GET /config/plots`, `GraficoId`, `Grafico` y `MinimoDeDatos`.

**Lo que conviene no perder al implementarlo:** el mínimo es **de la forma**, y un
gráfico lo sube sólo si su geometría lo exige — sólo tres lo hacen. Y
`MinimoDeDatos` lleva `forma` porque **nueve de los 49 sirven dos formas** con
umbrales distintos sobre la misma variable.

**`B2.15 · `DD_MATERIALIZE_PROSE_ENABLED`.** Fecha, no código, como dijeron.

## Una corrección nuestra · el documento sí estaba

A la mañana dijimos que `RESPUESTA-2026-09-28-tres-del-alta.md` «no llegó».
**Está en su repositorio, en `docs/`** — lo buscamos del lado equivocado.

Es el mismo error que les señalamos con los tres archivos del repertorio, y nos
tocó a nosotros el mismo día: **buscar en el repositorio propio algo que vive en
el del otro.** Queda dicho porque vale para los dos lados.

## Dos cosas de método, cortas

**El cable está al día**: `npm run humo` pasa en las dos direcciones contra
`de881e1` y `backend-drift` está verde con las nueve rutas. La única deriva que
apareció fue `tab_keys`, que el yaml no declaraba — corregida.

**Y su pedido de «remidan antes de regenerar» fue el correcto.** El 28 no
cerramos nada porque no había contra qué medir; el 29 se cayeron tres pedidos en
una tarde. **Una respuesta que dice «hecho» es una afirmación; el commit es el
hecho** — y esta vez el orden fue documento primero, commit después.

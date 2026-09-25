# Corte · qué formas y qué estados llegan del servicio real · 2026-09-25

> **Un corte verificado contra el servicio, con fecha. No se actualiza: se
> reemplaza.** Cierra la mitad que le faltaba al criterio de **B2.12** y nombra,
> con medición, por qué la otra mitad no se puede cerrar hoy.

**Contra qué se verificó**, que el criterio lo pide explícitamente: binario del
backend `6e595e3` de `AntPack-dev/synapse-api-go`, rama
`feature/dynamic-dashboard-backend`, **limpio y sin parches nuestros**, contra
Postgres local en Docker, tenant `e65f81ae-50ba-4ceb-bb11-d4c0bb76d111`, período `2026-09` salvo donde se
indique, con token de rol `admin`.

---

## Los seis estados · 3 verificados, 3 no alcanzables hoy

| Estado | | Cómo |
|---|---|---|
| `DISPONIBLE` | ✅ | 10 de 12 paneles, con cifras del negocio |
| `DEGRADADO` | ✅ | Los dos paneles de prosa · `Never materialized: Requires BT_UA_DECISION_LOG…` |
| `BLOQUEADO` | ✅ | Pidiendo un período sin materializar —`2024-01`—: los 12 vuelven `BLOCKED` con razón `No materialization for this period` |
| `CARGANDO` | ✅ | Lo deriva el front mientras el batch vuela; se ve en cada carga |
| `SIN_PERMISO` | ⊘ | **Haría falta un usuario con rol `planner`, y no hay cómo conseguirlo**: `GET /admin/users` da 404 y el único usuario de la base local es admin. Es el mismo hueco que **B4.17** |
| `ERROR` | ⊘ | La receta del criterio es «un `gauge` sin `maximum`», y **ninguno de los doce paneles es `gauge`**. Haría falta componer y publicar uno |

**`DEGRADADO` se alcanzó por un camino distinto al que el criterio anticipaba.**
Decía «envejeciendo `materialized_at` en la base»; llegó solo, porque el backend
agregó en `6e595e3` la degradación de las filas nunca materializadas. El estado
quedó verificado igual, y por un camino que además es el real.

## Las once formas · 5 llegan, 6 no tienen métrica

| Llega del cable | Métricas que la declaran |
|---|---|
| `scalar` | 9 |
| `multi_series` | 3 |
| `categorical` | 2 |
| `prose` | 2 |
| `tabular` | 2 |

**Y seis formas del contrato no las declara NINGUNA métrica del catálogo real:**

```
composicion · distribucion · escalarConIntervalo · ranking · serieConBanda · serieTemporal
```

**Pero no por la misma razón, y mezclarlas fue un error de la primera versión de
este corte.** Son dos grupos con dueños distintos:

| | Formas | Qué pasa |
|---|---|---|
| **El backend SÍ las sabe producir** | `escalarConIntervalo` · `serieTemporal` · `ranking` · `composicion` | Están entre las nueve de `TransformValue`. **UA MX no tiene métricas de esas formas hoy**, y eso no es un hueco: es este cliente. Otro las va a tener |
| **El backend NO las sabe producir** | `distribucion` · `serieConBanda` | No están en el `switch` de `transform.go`: cualquier métrica con esa forma sincroniza y **falla al materializar con `ErrUnknownShape`** |

**Producto lo aclaró el 2026-09-25:** la intención es tener **todas** las formas
disponibles, no sólo las que este cliente grafica. UA MX es uno de los clientes.
Así que las cuatro del primer grupo **no se anotan como «no aplica»**: están
listas y esperando un tenant que las tenga.

## Lo que sí queda como pedido · B1.14

`distribucion` y `serieConBanda` **tienen esquema en el contrato y cuerpo
escrito** —`DistributionBody` y `ForecastBody`— y el backend no las materializa.
El plan ya lo pide en **B1.14**, con la receta: un caso más en el `switch`,
emitiendo `{shape, cuts:[{label, v}]}` y `{shape, level, points:[{t, v, lo, hi}]}`.

**`serieConBanda` es la que más pesa**: `design.md` tiene una regla dura
—«prohibida la estimación puntual sin intervalo; un pronóstico sin banda no se
publica»— y el cuerpo que la cumple no puede recibir un dato del backend hoy.

## Dónde se ven las formas que el dato real no trae

**En `npm run dev:mock`, que cubre las nueve** que el backend sabe producir —
medido el 2026-09-25 sobre `dev/mocks/`. Es lo que evita que cuatro cuerpos
queden sin verse nunca sólo porque este cliente no tiene esas métricas.

Las dos que faltan ahí son justamente `distribution` y `series_band`, y falta por
la misma razón: **los mocks hablan el cable, y el cable no las tiene**. El día
que B1.14 las agregue, van a los mocks primero.

## Qué haría falta para cerrar los dos estados que quedan

| | De quién |
|---|---|
| `SIN_PERMISO` | Un usuario con rol no-admin · **B4.17**, la ruta que liste usuarios, o darlo de alta a mano |
| `ERROR` | Componer y publicar un `gauge` sin `maximum` · es nuestro, y toca el camino de guardar/publicar del builder contra el servicio |

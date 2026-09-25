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
| `SIN_PERMISO` | ⊘ | **Haría falta un usuario con rol `planner`, y no hay cómo conseguirlo**: `GET /admin/users` da 404 y el único usuario de la base local es admin. Es el mismo hueco que **B4.16** |
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

**No es que no se vean: es que no hay de dónde.** No se arregla componiendo un
panel, porque un panel se ancla a un `metricId` y ninguna métrica tiene esas
formas. Seis de nuestros cuerpos —entre ellos `ForecastBody`,
`DistributionBody` y `CompositionBody`— **nunca han dibujado un dato real**, y
sólo los sostienen sus pruebas con fixtures.

**La que más conviene mirar es `serieConBanda`.** `design.md` tiene una regla
dura —«prohibida la estimación puntual sin intervalo; un pronóstico sin banda no
se publica»— y el cuerpo que la cumple existe. Si UA MX no tiene métricas de
pronóstico, la regla no se ejercita nunca y el cuerpo envejece sin uso.

## Qué haría falta para cerrar lo que queda

| | De quién |
|---|---|
| `SIN_PERMISO` | Un usuario con rol no-admin · **B4.16**, la ruta que liste usuarios, o darlo de alta a mano |
| `ERROR` | Componer y publicar un `gauge` sin `maximum` · es nuestro, y toca el camino de guardar/publicar del builder contra el servicio |
| Las seis formas | **Datos**: o el catálogo de UA MX no tiene métricas de esas formas —y entonces se anota y se cierra—, o faltan por curar |

**La pregunta para datos no es «cúrenlas»**, es más simple y más útil: *¿UA MX
tiene métricas de pronóstico, de composición, de ranking o de distribución, o
esas formas son para otros clientes?* Con esa respuesta, seis cuerpos pasan de
«sin verificar» a «no aplica en este tenant», que es una conclusión y no un
pendiente.

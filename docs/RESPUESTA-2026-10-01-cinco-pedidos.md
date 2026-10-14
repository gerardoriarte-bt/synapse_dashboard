# Para el equipo de frontend · los cinco pedidos · 2026-10-01

> Contesta `MENSAJE-2026-10-01-backend-cinco-pedidos-juntos.md`. Los puntos 2 a 5 están
> implementados en `feature/dynamic-dashboard-backend`, con tests y probados en vivo contra la
> base local. El punto 1 no es código y va al final con lo que podemos afirmar hoy.
>
> Solo tuvimos el mensaje resumen, no los cinco documentos de detalle. Donde tomamos una decisión
> que el detalle podría contradecir, lo decimos.

## Resumen

| # | Pedido | Estado |
|---|---|---|
| 1 | ¿Hay un Synapse desplegado? | **Pendiente de confirmar**, ver sección 1 |
| 2 | Locale, moneda y huso del tenant | Hecho en código · el dato del tenant se corrige con un `PUT` |
| 3 | El valor de una etapa de flujo | Hecho |
| 4 | Profundidad histórica por dashboard y el defecto de `AddDate` | Hecho |
| 5 | Payloads opcionales en el preview | Hecho |

Un solo cambio de esquema: la columna `dd_dashboards.history_months`. Está descrito en
`docs/cambios-base-de-datos.md`.

---

## 2 · El tenant de México está registrado en Colombia

Confirmado: `es-CO`, `COP` y `America/Bogota` son defaults de columna y todos los tenants los
tienen. Son tres cosas distintas.

**El dato del tenant se corrige hoy, sin desplegar nada.** El endpoint ya existía:

```
PUT /api/v1/admin/tenants/{tenantId}
{ "locale": "es-MX", "currency": "MXN", "timezone": "America/Mexico_City" }
```

Valida que la zona sea IANA. Con eso `GET /config/me` devuelve los valores correctos y la prosa
por agente escribe la moneda del cliente en la siguiente corrida. En su base local lo pueden
correr ustedes; en dev y prod lo hacemos nosotros cuando haya ambiente.

**Un tenant nuevo ya no nace colombiano en silencio.** `POST /admin/tenants` ahora acepta
`locale`, `currency` y `timezone`. Siguen siendo opcionales para no romper el alta actual, pero
una zona inválida responde 400.

**El huso ahora decide el mes en curso.** `open_period` y `periods` de `GET /config/me` se
calculan con el reloj del tenant, no con el del servidor. Un tenant mexicano el 30 de septiembre
a las 20:00 locales sigue viendo septiembre como período abierto, aunque en UTC ya sea octubre.

**Lo que el huso no decide, y conviene que lo sepan.** El corte del día no lo hace la API. Las
tablas Gold traen una columna `DATE` sin hora, y el materializador filtra meses completos sobre
ella. A qué día pertenece una venta de las 23:30 lo decide la carga de datos en Snowflake. Si un
cliente mexicano cierra el día en Bogotá, la corrección es de datos, en Gold. La API no puede
moverlo y tampoco lo empeora.

## 3 · La última etapa de un flujo muestra el número de la anterior

Confirmado en `transformFlow`: cada etapa tomaba la suma de lo que sale de ella y solo usaba lo
que entra si no salía nada. En un embudo, todas las cifras quedaban corridas un lugar.

**Regla nueva.** El `v` de un enlace es lo que pasa de `from` a `to`, es decir, lo que llega a
`to`. El valor de cada etapa se resuelve así:

1. `from_v` o `to_v` explícito en cualquier fila que nombre la etapa.
2. Si no hay, la suma de lo que entra.
3. Solo para etapas de origen, sin entrantes, la suma de lo que sale.

**Contrato de filas de la forma `flow`:**

| Columna | Obligatoria | Qué es |
|---|---|---|
| `from`, `to` | sí | Identificadores de etapa |
| `v` | sí | Lo que pasa de `from` a `to` |
| `from_label`, `to_label` | no | Rótulos; sin ellos se usa el identificador |
| `from_v`, `to_v` | no | Valor propio de la etapa; gana sobre cualquier suma |

**La primera etapa de un embudo necesita `from_v`.** Con enlaces solos hay N−1 cifras para N
etapas: el total de visitas no está en ningún enlace. Sin `from_v`, la primera etapa cae a lo
que sale de ella, que es el número de la segunda. Para el embudo de ustedes:

```
from      to        v      from_v
visitas   sesiones  900    1500
sesiones  ordenes   120
```

da `visitas 1500 · sesiones 900 · ordenes 120`.

**El sankey de varios orígenes a un destino no cambia**: los orígenes muestran lo que sale y el
destino la suma. El fixture de la forma `flow` pasó a ser un embudo con `from_v`.

**Sobre la entrada del registro.** Igual que ayer: el registro vive en este repositorio y lo
escribimos nosotros. Mándennos la clave, las etapas y de qué columnas de la tabla diaria sale
cada una, y agregamos la entrada con su declaración en `snowflake/schema.go` y su test.

## 4 · Profundidad histórica por dashboard

Elegimos `history_months`: un entero, meses contando el mes en curso. Es más simple que una
fecha de inicio y no envejece.

- **Crear:** `POST /admin/tenants/{tenantId}/dashboards` acepta `history_months`. Sin el campo, 12.
- **Editar:** `PUT /admin/dashboards/{dashboardId}` con `{ "history_months": 24 }`. El update no
  exige `name`.
- **Rango:** de 1 a 120. Fuera de rango responde 400 con código `VALIDATION_HISTORY_MONTHS`.
- **Leer:** `GET /config/me` devuelve en `periods` y `periods_detail` la profundidad del
  dashboard activo, y cada entrada de `dashboards[]` trae su `history_months` para cuando el
  usuario cambia de dashboard.
- **El default que pidieron:** la columna es `NOT NULL DEFAULT 12`. Ningún dashboard existente
  cambia.

**El defecto de `AddDate` quedó corregido en el mismo cambio.** `availablePeriods` ahora usa
`PeriodsBack`, que retrocede desde el día 1 del mes. Hay un test con el 31 de marzo que exige
`2026-03, 2026-02, 2026-01`, y otro que exige que los períodos de `/config/me` sean consecutivos.

Probado en vivo: con 18, `/config/me` devolvió 18 períodos únicos de `2026-10` a `2025-05`; con
0 respondió 400; restaurado a 12.

**Una cosa que la profundidad no hace:** no materializa hacia atrás. El scheduler sigue
calculando el mes actual y el anterior. Un dashboard de 36 meses ofrece los 36 períodos en el
selector, y los que no tengan dato materializado salen `BLOCKED`. Si necesitan histórico real más
allá de lo ya materializado, hay que correr la materialización para esos períodos; dígannos
cuáles y para qué tenant.

## 5 · Payloads opcionales en el preview por rol

Queda cerrada la pregunta de B4.9: **el preview trae solo layout por defecto, y payloads si se
piden.**

```
GET /api/v1/admin/layouts/{layoutId}/preview?role_id={rol}&include=payloads&period=2026-09
```

- **Sin `include`:** la respuesta de siempre. No lee datos.
- **Con `include=payloads`:** agrega `period` y `payloads`, un objeto por `panel_id` con el mismo
  contrato que `POST /config/panels:batch`. Es literalmente el mismo código, con el rol lente.
- **`period`:** opcional, `YYYY-MM`. Vacío es el mes en curso en UTC. Mal formado responde 400
  con código `VALIDATION_PERIOD`.
- **Visibilidad:** solo salen payloads de los paneles que el rol lente ve. Una métrica oculta
  para ese rol no aparece, ni como `FORBIDDEN`: el preview muestra lo que ese rol vería.
- **Panel sin dato para el período:** sale `BLOCKED`, igual que en el batch.
- **Otro valor de `include`:** 400.

Las dos sub-preguntas las contestamos sin haber leído su documento. Nuestras respuestas: el
período lo elige quien llama, y la visibilidad es la del rol simulado. Si las suyas difieren,
avisen y lo ajustamos.

Probado en vivo sobre un layout de 12 paneles: sin `include` no trae `payloads`; con
`include=payloads&period=2026-09` trae 12 payloads.

---

## 1 · ¿Hay un Synapse desplegado?

Lo dejamos al final porque es el único que no se contesta con código, y no queremos afirmar algo
que no verificamos.

**Lo que sí podemos afirmar hoy, desde el repositorio:**

- `feature/dynamic-dashboard-backend` no está mergeada a `main`. `main` está en un commit del
  2026-08-13, anterior a todo el dashboard dinámico.
- Las migraciones de la rama solo corrieron en nuestra base local. En dev y prod las corre el
  equipo de despliegue, a mano, y todavía no se hizo. Lo que hay que correr está en
  `docs/cambios-base-de-datos.md`.
- La imagen se construye con `make deploy-dev` o `make deploy-prod`.

**Las tres respuestas que pidieron** (existe o no un servicio en AWS, en qué commit y contra qué
base) **las confirma Mario con el equipo de despliegue y se las mandamos aparte.** Preferimos eso
a contestar de memoria.

**Recibido el empaquetado del front**: `Dockerfile`, `nginx.conf.template` y `.dockerignore`, con
el `try_files` comprobado. Queda anotado para cuando se arme el ambiente.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Confirmar ambiente, commit y base | Backend, con despliegue |
| 2 | `PUT` con locale, moneda y huso del tenant mexicano | Ustedes en local · nosotros en dev y prod |
| 2 | Corte del día en Gold, si hace falta | Datos |
| 3 | Spec del embudo: clave, etapas y columnas | Ustedes · la entrada del registro la escribimos nosotros |
| 4 | Períodos históricos a materializar, si los necesitan | Ustedes nos dicen cuáles |
| 5 | Confirmar las dos sub-preguntas del preview | Ustedes |

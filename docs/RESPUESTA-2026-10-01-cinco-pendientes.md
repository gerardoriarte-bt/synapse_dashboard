# Para el equipo de frontend · los cinco pendientes · 2026-10-01 (tarde)

> Contesta `MENSAJE-2026-10-01-backend-cuatro-pendientes.md`. Los puntos 3, 4 y 5 están
> implementados en `feature/dynamic-dashboard-backend`, con tests. Del punto 2 hay dos métricas
> hechas y cuatro que esperan un archivo. El punto 1 espera otro archivo.
>
> Todo el backend se escribe en este repositorio: no traemos commits del fork. Lo que necesitamos
> de ustedes son los **datos** (el repertorio y la planilla), no la rama.

## Resumen

| # | Pedido | Estado |
|---|---|---|
| 1 | `GET /config/plots` | **Sin empezar** · falta el repertorio de 49 como archivo de datos |
| 2 | Seis métricas nuevas | **Dos hechas**, cuatro esperan `Metricas.xlsx` · una pregunta abierta sobre la matriz |
| 3 | `currency = USD` para UA MX y el default `COP` | Hecho en código · el `PUT` lo corren ustedes |
| 4 | La prosa usa la unidad de la métrica | Hecho · sin verificar todavía contra el agente real |
| 5 | El sembrado pisa el mes en curso | Hecho |

Sin cambios de esquema: ninguna columna ni tabla nueva.

**Un cambio que rompe contrato**, en el punto 3: `POST /admin/tenants` ahora exige `locale`,
`currency` y `timezone`. Reemplaza lo que les dijimos esta mañana.

---

## 1 · `GET /config/plots`

Confirmado: no existe en este repo. El `chart` del panel sí se guarda y viaja en el layout, sin
validarse contra ningún repertorio.

**No vamos a traer los tres commits del fork.** El endpoint lo escribimos acá. Para eso nos falta
lo mismo que pedimos el 28 y el 29 de septiembre: el repertorio como dato. `tools/gen-plots.py` y
`docs/backend/dd_seed_plots.go` están en su repositorio, no en el nuestro.

**Qué necesitamos, como archivos adjuntos:**

1. Las 49 entradas en JSON o CSV, con todos los campos de cada una.
2. La forma exacta de la respuesta que el builder espera de `GET /config/plots` (un ejemplo de
   una entrada completa alcanza).

Con eso son una tabla, un seed y un endpoint de lectura.

## 2 · Las seis métricas nuevas

**Hechas, sobre `GLD_PAID_MEDIA`** (`DATE`, `FUENTE`, `COST_USD`):

| Métrica | Shape | Qué devuelve |
|---|---|---|
| `media_investment_composition` | `composition` | Inversión del mes por plataforma; `percentage` calculado en backend, suma 100 |
| `media_platform_investment_matrix` | `matrix` | Plataforma × semana del mes |

**Pregunta abierta sobre la matriz.** El mensaje da una sola dimensión (`FUENTE`) y una matriz
necesita dos ejes. Elegimos **semana del mes** para las columnas: «Semana 1» son los días 1 a 7,
«Semana 2» del 8 al 14, hasta «Semana 5». Si la planilla dice otro eje (día, por ejemplo), nos
avisan y cambiamos el SQL.

Cómo llega la matriz:

- Filas: plataformas, de mayor a menor inversión del mes.
- Columnas: semanas en orden, solo las que tienen algún dato.
- Una plataforma sin inversión en una semana lleva `0`, no celda vacía. Así las columnas nunca
  salen desordenadas.

**Las otras cuatro esperan la planilla.** `docs/snowflake/Metricas.xlsx` no está en este repo.

| Métrica | Qué nos falta |
|---|---|
| `conversion_funnel` | La columna de adiciones al carrito en `GLD_ECOMM_DAILY_PERFORMANCE`. Hoy conocemos visitas y órdenes, no esa |
| `top_products_revenue` | Columnas de `GLD_PRODUCTO_ANALYTICS` (fecha, ingreso) |
| `instagram_followers_trend` | Columnas de `GLD_SOCIAL_MEDIA_FOLLOWERS` (fecha, seguidores, cómo se filtra Instagram) |
| `tiktok_comment_sentiment` | Columnas de `GLD_SOCIAL_MEDIA_POSTS` (fecha, conteo, cómo se filtra TikTok) |

Las tres tablas nuevas además entran al schema-check del alta de cliente. El embudo saldrá con
`from_v` en la primera etapa, como acordamos.

**Sobre «las diez primeras ya funcionan».** En este repo no es así. `spend_flow`, `platform_gap`
y `platform_month_matrix` no tienen entrada en nuestro registro: vienen de los commits de su
fork. Contra `d9147c3` quedan `BLOCKED` («No Snowflake query registered»). Si las necesitan,
mándennos su definición en la misma planilla y las registramos junto con las otras cuatro.

## 3 · `currency = USD` y el default de la columna

**El `PUT` no requiere cambios de backend.** `PUT /api/v1/admin/tenants/:id` ya acepta `locale`,
`currency` y `timezone`. El tenant `e65f81ae-…` existe en su ambiente, no en el nuestro: lo
corren ustedes con un token admin y el cuerpo que mandaron. Verificación: `GET /config/me` →
`tenant.currency == "USD"`.

**El default `COP` no cambia; lo que cambia es el alta.** La columna es `NOT NULL` y cualquier
default es un valor que nadie cargó: cambiarlo a `USD` haría nacer mal al próximo tenant
colombiano. En su lugar:

```
POST /api/v1/admin/tenants      ← locale, currency y timezone ahora son obligatorios
```

- Sin alguno de los tres responde **400**, con el campo nombrado: «el campo 'currency' es
  obligatorio».
- Una zona que no sea IANA sigue respondiendo 400.
- **Esto reemplaza lo de esta mañana**, cuando dijimos que seguían opcionales. Si su alta de
  tenant no manda los tres, hay que agregarlos.
- Los tenants que ya existen no se modifican. Los que nacieron con `es-CO`/`COP`/`America/Bogota`
  se corrigen con el `PUT`.

## 4 · La prosa usa la unidad de la métrica

Confirmado tal cual lo midieron: el pedido al agente llevaba `tenant.currency` y las cifras iban
sin unidades. Implementamos **las dos opciones**, porque se complementan.

**a · Cada cifra lleva su unidad.** El agente recibe, aparte de las cifras, la unidad de cada una
tomada del `unit` del catálogo, con la instrucción de escribirlas sin convertir:

```
"REVENUE": "USD",  "SPEND": "USD",  "ROAS": "x",  "ORDERS": "órdenes"
```

**b · La moneda sale de las métricas.** «Con montos en `<X>`» usa la unidad monetaria de las
métricas que alimentan el párrafo (ventas, inversión y sus metas).

| Caso | Resultado |
|---|---|
| Las métricas declaran una moneda | Gana la métrica, aunque `tenant.currency` diga otra cosa |
| El catálogo no declara ninguna | Respaldo: `tenant.currency` |
| Declaran más de una | **`ERROR`**, sin llamar al agente: «las métricas del período declaran más de una moneda (MXN, USD); corregir UNIT en la view» |

El `ERROR` sigue la regla de siempre: no pisa un `AVAILABLE` previo.

**Lo que falta:** la verificación que proponen (materializar con el agente encendido y leer el
`headline`) no la corrimos todavía. Está cubierto con tests sobre un generador simulado.

**Relacionado, sin tocar:** el rótulo `USD · TOTAL` de ventas e inversión es fijo en el backend,
no sale del `unit` del catálogo. Hoy coincide porque esas métricas están en USD. Si lo quieren
derivado del catálogo, lo pedimos como punto aparte.

## 5 · El sembrado ya no pisa el mes en curso

Confirmado, y lo reprodujimos en la base local: un tenant con datos reales en septiembre tenía
octubre lleno de maqueta `AVAILABLE`.

**Regla nueva**, la primera de sus tres opciones: el sembrado de demostración solo corre en un
tenant que **nunca materializó con éxito**. Un tenant con al menos una fila real no recibe
maqueta nunca más, en ningún mes.

- Los tenants sin tablas Gold siguen recibiendo la maqueta, como hasta hoy.
- De paso se corrigió el mismo defecto de `AddDate` de los días 29 a 31 en el cálculo de los
  meses a sembrar.

**Lo ya sembrado no se borra.** Las filas de maqueta de `2026-10` que ya existen siguen ahí hasta
que el materializador corra sobre octubre:

- Las métricas con consulta se reemplazan por el dato real.
- Las que no tienen consulta, o la prosa con el agente apagado, pasan a `DEGRADED` tras el primer
  intento: «Esta métrica todavía no se calculó con datos reales». Esa regla ya existía.

Para limpiar su ambiente hoy: `POST /admin/tenants/{id}/materialize` sobre `2026-10`.

**La verificación que proponen** (arrancar un día 1 contra una base con datos) solo se puede
observar en un cambio de mes. Comprobamos por consulta que la condición separa bien los tenants
reales de los de demostración.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Repertorio de 49 en JSON o CSV + ejemplo de la respuesta | **Ustedes** |
| 2 | `Metricas.xlsx` adjunta | **Ustedes** |
| 2 | Confirmar el eje de columnas de la matriz (semana u otro) | **Ustedes** |
| 2 | Registrar las cuatro métricas restantes y las tres del fork | Nosotros, al llegar la planilla |
| 3 | `PUT` de UA MX | Ustedes, en su ambiente |
| 3 | Mandar `locale`, `currency` y `timezone` en el alta de tenant | Ustedes, si hoy no los mandan |
| 4 | Verificar el `headline` con el agente encendido | Nosotros |
| 5 | Materializar `2026-10` para reemplazar la maqueta ya sembrada | Ustedes en local · nosotros en dev y prod |

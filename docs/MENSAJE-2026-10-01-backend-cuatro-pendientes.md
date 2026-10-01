# Para el equipo de backend · cinco pendientes · 2026-10-01 (tarde)

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Todo medido contra `d9147c3` levantado acá.

| # | Qué | Urgencia |
|---|---|---|
| 1 | `GET /config/plots` no existe · está escrita en nuestro fork, son 3 commits | **Alta · bloquea el selector de gráfico entero** |
| 2 | Seis métricas nuevas de datos, listas para registrar | **Alta · es trabajo nuevo que destraba pantallas** |
| 3 | `currency = USD` para UA MX · corrige lo que pedimos el 29 | Antes de tocar el tenant |
| 4 | La prosa usa la moneda del tenant; debe usar la unidad de la métrica | Media |
| 5 | El sembrado de arranque pisa el mes en curso con datos de maqueta | Media |

---

## 1 · `GET /config/plots` → 404

**Medido:** `d9147c3` responde 404. `git grep "config/plots"` sobre su rama no
devuelve ninguna línea.

**Qué bloquea:** el builder apaga la sección de gráfico cuando el repertorio
llega vacío, así que **no se puede elegir gráfico ni ver el que el panel ya
tiene**. La consola sigue dibujando porque el `chart` viaja en el layout.

**Está escrita y probada**, en nuestro fork:

```
repo    gerardoriarte-bt/synapse-api-go
rama    feature/config-plots       · 3 commits sobre de881e1

b6f0e09   GET /config/plots · las 49 entradas del repertorio
8876b4d   compared_categorical, matrix y flow en el materializador
4c80802   fix · platform_month_matrix devolvía las columnas desordenadas
```

Archivos nuevos salvo tres líneas en `manual_migrations.go`, `migrations.go` y
`app.go`. Las 49 filas se generan con `tools/gen-plots.py`; el resultado está en
`docs/backend/dd_seed_plots.go`.

**Verificación:** `GET /config/plots` → 200 con 49 entradas.

---

## 2 · Seis métricas nuevas · datos las entregó hoy

Planilla completa en `docs/snowflake/Metricas.xlsx`. Las diez primeras ya
funcionan; **estas seis necesitan registro**:

| Métrica | Shape | Unidad | Tabla fuente | Dimensiones | Qué pide |
|---|---|---|---|---|---|
| `conversion_funnel` | `flow` | — | `GLD_ECOMM_DAILY_PERFORMANCE` | `[]` | Registro **+ shape flow** |
| `media_platform_investment_matrix` | `matrix` | USD | `GLD_PAID_MEDIA` | `["FUENTE"]` | Registro **+ shape matrix** |
| `media_investment_composition` | `composition` | % | `GLD_PAID_MEDIA` | `["FUENTE"]` | Registro |
| `top_products_revenue` | `ranking` | USD | `GLD_PRODUCTO_ANALYTICS` | `["PRODUCT_ID","TITULO_PRODUCTO"]` | Registro |
| `instagram_followers_trend` | `time_series` | followers | `GLD_SOCIAL_MEDIA_FOLLOWERS` | `[]` | Registro |
| `tiktok_comment_sentiment` | `categorical` | comentarios | `GLD_SOCIAL_MEDIA_POSTS` | `["COMMENT_SENTIMENT"]` | Registro |

Las seis: `MIN_GRAIN = day`, `MEASUREMENT_WINDOW = mes calendario seleccionado`.

**`conversion_funnel` es el embudo que nos pidieron especificar**, y datos ya
puso las etapas en su `BASE`:

```
visitas  →  adiciones al carrito  →  órdenes
```

**Es el caso que necesita `from_v`**, por lo que ustedes mismos escribieron: sin
él la primera etapa muestra lo que sale de ella. `visitas` tiene que traer su
propio volumen.

**El front ya dibuja las seis formas.** `flow`, `matrix`, `composition`,
`ranking`, `time_series` y `categorical` tienen cuerpo y gráficos construidos:
apenas lleguen los payloads se ven.

---

## 3 · `currency = USD`, no `MXN`

**Corrección a `MENSAJE-2026-09-29-backend-tenant-colombiano.md`**, que pedía
`MXN`. Ese valor está mal.

```
PUT /api/v1/admin/tenants/e65f81ae-50ba-4ceb-bb11-d4c0bb76d111
{ "locale": "es-MX", "currency": "USD", "timezone": "America/Mexico_City" }
```

**Por qué USD:** el catálogo declara `unit: USD` en las métricas de dinero
—`revenue`, `spend`, `spend_flow`, `platform_gap`, `platform_month_matrix`, y
ahora `media_platform_investment_matrix` y `top_products_revenue`—. La moneda es
la del dato.

**Verificación:** `GET /config/me` → `tenant.currency == "USD"`.

**Y además:** que el default de la columna deje de ser `COP`. Los dos tenants
sembrados nacieron en `es-CO`/`COP`/`America/Bogota` sin que nadie los cargara.

---

## 4 · La prosa debe usar la unidad de la métrica

**Dónde:** `dd_materializer_service.go:244` arma el pedido con
`Currency: tenant.Currency`, y `dd_prose_generator.go:105` lo escribe en el
prompt: «con montos en `<X>`».

**Qué produce:** con `COP` en esa columna, el párrafo decía `COP 1.144.876`
mientras el KPI de la misma métrica mostraba `USD 1,232,721`.

**Qué pedimos:** que el agente reciba la unidad de cada métrica. Hoy
`DDProseRequest.Context` es `map[string]any` con las cifras y **sin unidades**.

| | Cualquiera de las dos sirve |
|---|---|
| **a** | Que cada entrada de `Context` lleve su `unit`, del catálogo que ya sincronizan |
| **b** | Que `Currency` salga del `unit` de las métricas monetarias del período. Si hay más de una moneda, **que sea error y no una elección** |

`tenant.currency` no se borra: queda como respaldo. Cuando discrepe con el
`unit` de la métrica, gana la métrica.

**Verificación:** materializar un período con el agente encendido y leer el
`headline` de `executive_summary`.

---

## 5 · El sembrado de arranque pisa el mes en curso

**Medido:** el binario arrancó el 2026-10-01 y sembró `2026-10`.

```
2026-10   12 AVAILABLE · 2 BLOCKED   revenue 4.280.000
          headline: «Sales closed the month at USD 4.28M…»     ← maqueta, en inglés
2026-09   14 AVAILABLE               revenue 1.232.721
          headline: «En septiembre de 2026 los ingresos…»      ← Snowflake
```

**Qué produce:** la consola abre en el período en curso y muestra la maqueta. El
panel dice `AVAILABLE`, con cifra, medidor y comparativo — **nada en pantalla
distingue un número del negocio de uno de la maqueta.**

**Qué pedimos:** que el sembrado de demostración no escriba sobre el mes en curso
de un tenant con datos reales. Cualquiera de estas alcanza:

- sembrar sólo si el tenant no tiene ninguna fila materializada, o
- que esas filas no queden en `AVAILABLE`, o
- que el sembrado se active por bandera, apagada por defecto.

**Verificación:** arrancar un día 1 contra una base con datos y comprobar que
`POST /config/panels:batch` del mes en curso no devuelve los valores de la
maqueta.

---

## Confirmaciones que nos pidieron

| | |
|---|---|
| Preview · **el período lo elige quien llama** | Confirmado, coincide con ustedes |
| Preview · **la visibilidad es la del rol simulado** | Confirmado, coincide con ustedes |
| La spec del embudo | **Ya no hace falta**: viene en la planilla de datos · ver §2 |

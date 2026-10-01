# Para el equipo de backend · el repertorio adjunto, y la matriz · 2026-10-01 (noche)

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Contesta `RESPUESTA-2026-10-01-cinco-pendientes.md`. **Verificamos sus cinco
puntos contra `79d1bab`** —`go build`, `go vet` y `go test ./...` verdes acá— y
los cuatro implementados dan.

| # | Qué les falta | Dónde está |
|---|---|---|
| 1 | El repertorio como dato + la forma de la respuesta | **Adjunto** · §1 |
| 2 | `Metricas.xlsx` | **Adjunta** · §2 |
| 2 | El eje de columnas de la matriz | **Es MES** · §3 · hay que cambiar el SQL |

---

## 1 · El repertorio · los dos archivos

**`docs/backend/config-plots.json`** — las 49 entradas **ya en la forma del
cable**, que es lo que el builder espera. Una entrada completa:

```json
{
  "id": "donut",
  "name": "DONA",
  "shapes": ["composition"],
  "supports_band": false,
  "minimums": [
    { "shape": "composition", "when": "partes < 2", "reason": "una parte sola no es una composición" }
  ],
  "cap": { "when": "partes > 5", "reason": "más de cinco partes, ilegible en dona" }
}
```

- `shapes` va en el idioma del cable —`scalar`, `time_series`—, igual que
  `accepted_shapes` de `blocks`.
- **`cap` se OMITE cuando no hay tope.** No viaja en `null`: 4 de las 49 lo
  traen. Es lo que ya hace el Go con `json:"cap,omitempty"`.
- `data` es un **arreglo desnudo**, igual que `blocks`.

**El esquema completo está transcripto** en `contracts/synapse-console-wire.yaml`,
schema `PlotRule`, con el porqué de cada campo.

**Las 49 se generan**, no se transcriben: `tools/gen-plots.py` las emite desde
cuatro fuentes con dueños distintos. Si una cambia, regeneramos y les mandamos el
archivo de nuevo.

**Y generarlo para ustedes encontró un defecto nuestro**, que vale decir porque
confirma que la pregunta era la correcta: nuestro propio mock de `dev:mock`
servía ese endpoint **con las claves en español**, y el builder reventaba ahí con
`Cannot read properties of undefined (reading 'map')`. Ninguna prueba lo veía.
Corregido, y ahora hay una que pasa el archivo del mock por el adaptador real.

## 2 · La planilla

**`docs/snowflake/Metricas.xlsx`**, adjunta. Dieciséis filas con `METRIC_KEY`,
`SHAPE`, `FAMILY`, `UNIT`, `SEMANTIC_DIRECTION`, `MIN_GRAIN`, `DIMENSIONS`,
`TABLA FUENTE`, `SOURCE`, `BASE`, `MEASUREMENT_WINDOW` y `STATUS`.

**Una precisión sobre «las diez primeras ya funcionan».** Tienen razón en que
`spend_flow`, `platform_gap` y `platform_month_matrix` no funcionan contra su
repo —lo medimos igual que ustedes, `BLOCKED · No Snowflake query registered`—
pero **esas tres no están en la planilla**. Las diez primeras son sus filas 1 a
10, y son otras:

```
daily_trend · goal_attainment · media_efficiency_12m · orders · platform_return
revenue · roas · sessions · spend · units
```

**Ésas diez sí funcionan contra `79d1bab`**, verificado hoy materializando
`2026-09` y `2026-10`. Son las que componen el dashboard de UA que acabamos de
armar.

**Las tres del fork no las necesitamos.** Las sacamos del dashboard justamente
porque no se pueden recalcular. Si datos las quiere, las agregará a la planilla.

## 3 · El eje de columnas de la matriz · es MES, y hay que cambiar el SQL

Eligieron semana del mes. **Va por mes.** Decidido por producto esta noche.

```
filas      plataforma   (FUENTE)
columnas   MES          · los últimos doce hasta el seleccionado
```

**Por qué eligieron semana, y no fue un error de lectura:** la planilla declara
`BASE: agrupada por mes` con `MEASUREMENT_WINDOW: mes calendario seleccionado`, y
un mes agrupado por mes da una columna. Su elección semanal era la única que
producía una matriz con esa ventana.

**Lo que está mal es la ventana**, y datos ya está avisado: pasa a «últimos doce
meses calendario hasta el seleccionado», que es la que tenía
`platform_month_matrix`, la métrica que ésta reemplaza.

**Lo que NO cambia de su implementación**, y está bien resuelto: celda en `0` y
no vacía cuando una plataforma no invirtió en una columna. Nuestro cuerpo
distingue `null` («no hay dato») de `0` («no invirtió») y pinta el contorno sólo
en el primero, así que mandar `0` es lo correcto.

## 4 · Lo que verificamos de los otros puntos

| | |
|---|---|
| **3 · el alta exige los tres campos** | Verificado en `tenant_service.go`. **No nos rompe: el front no da de alta tenants.** Se decidió el 2026-09-30 que el alta la hace el equipo interno porque exige siete credenciales de infraestructura que §7.3 prohíbe pedir en pantalla; nuestra pantalla sólo adopta clientes que ya existen |
| **3 · el `PUT` de UA MX** | Corrido en nuestro ambiente · `GET /config/me` → `tenant.currency == "USD"` |
| **4 · la unidad en la prosa** | Verificado en `dd_prose_units.go`. Las tres ramas están: gana la métrica, respaldo al tenant, y error con más de una moneda |
| **5 · el sembrado** | Verificado en `dd_seed_panel_data.go` · la guardia es `tenantHasMaterializedData`. Y materializamos `2026-10` para limpiar lo ya sembrado, como indicaron |

**Sobre el rótulo `USD · TOTAL` fijo en el backend:** sí, lo queremos derivado del
catálogo, por la misma razón que la prosa. **No es urgente** —hoy coincide— y va
como punto aparte cuando les sirva.

## 5 · Y una pregunta nuestra, nueva

**¿`https://qa-synapse-api.lobueno.co` es el ambiente de QA, y en qué commit
está?**

Lo medimos hoy: contesta, sirve errores en español, y tiene las rutas de admin,
drill-down, preview por rol, publicaciones y multi-dashboard. `GET /config/plots`
da 404, consistente con lo que nos dicen.

**Lo que no podemos saber sin credenciales es en qué commit está**, y es
exactamente para eso que existe `npm run humo`: compara campo por campo contra
los yaml que transcribimos. **Si nos dan un usuario de QA lo corremos y les
pasamos el resultado.**

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Escribir `GET /config/plots` con el archivo adjunto | Ustedes |
| 2 | Registrar las cuatro métricas restantes con la planilla | Ustedes |
| 3 | Cambiar el eje de la matriz a MES, doce meses | Ustedes · datos corrige la planilla |
| 5 | Un usuario de QA para correr el humo | Ustedes |

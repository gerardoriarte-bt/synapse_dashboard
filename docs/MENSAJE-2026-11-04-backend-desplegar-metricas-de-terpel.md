# Para backend · las métricas de Terpel: desplegar, y la que falta · 2026-11-04

**Medido contra `dc58ef5` el 2026-11-04**, en un worktree aparte de
`feature/dynamic-dashboard-backend`: `go build ./...`, `go vet` y
`go test ./tests/dashboard/...` limpios, y las consultas de `queries.go`
leídas contra las de nuestro mensaje. Del lado de Snowflake, sólo lectura el
mismo día, con agregados.

**Responde a** `docs/RESPUESTA-2026-11-03-backend-metricas-de-terpel.md`.
Nuestro pedido fue `docs/MENSAJE-2026-11-03-backend-metricas-de-terpel.md`. La
medición entera está en `docs/AUDITORIA-2026-11-04-respuesta-del-backend-terpel.md`.

---

## Gracias, y en corto

Gracias por `f78d700`. Las siete consultas son las que mandamos, las nueve
claves coinciden con el catálogo de Terpel, la vista sale de la variable de
entorno y la razón de ATL es la que pedimos. No tenemos correcciones.

**Pedimos una cosa: desplegar `dc58ef5` en QA.** Con eso cargamos julio a
octubre de 2026 en Terpel desde «Cargar meses» y comprobamos cada panel contra
la consulta de agregados, con la fecha en que la corramos.

## `media_by_campaign`: tenían razón

Nuestro mensaje no traía el `SELECT`, y además decía «una fila por campaña».
**Eso es falso.** Medido sobre la vista con `PERIODO = '2026-09-01'`:

| | Distintos en 90 filas |
|---|---|
| `CAMPANA` | 30 |
| `NOMBRE_CAMPANA` | 86 |
| Nombre, plataforma, objetivo, modelo, cuenta y fecha de inicio | 89 |

La fila es una línea de pauta, no una campaña, y no hay una clave que la
identifique. **No la registren todavía.** Le preguntamos a datos qué columna es
la campaña, y producto decide si la tabla muestra líneas o campañas agrupadas.
Cuando esté, les mandamos el `SELECT` con la cifra que tiene que dar.

## Para saber, sin pedido

- **Los escalares de Terpel no traen comparativos ni medidor**, porque no pasan
  por `KPISQL`. Es lo que pedimos; si producto los quiere, será otro pedido.
- **`schema-check` de Terpel va a seguir marcando las dos Gold de UA** como
  ausentes, como dice su respuesta. No bloquea las cifras. Lo hablamos cuando
  toque el alta de cliente.

# Cómo tomar el fork · 2026-09-16

> **Histórico.** Qué se entregó y cuándo. Acompaña a
> [`MENSAJE-2026-09-16-lo-que-el-front-espera.md`](MENSAJE-2026-09-16-lo-que-el-front-espera.md),
> punto 2. Escrito para que tomarlo no requiera leer nuestro plan.

## Lo que hace falta, en corto

**Tres cosas, y solo una es técnica:**

1. **Decidir tomarlo.** Es el bloqueo real. El código está escrito, compila y sus
   tests pasan.
2. **Correr cinco `ALTER TABLE`** (abajo, explícitos — no hace falta
   `DB_AUTO_MIGRATE`).
3. **Desplegar.** Recién ahí `/admin/tenants/{id}/roles` y `/preview` dejan de
   dar 404, y se nos destraban dos pantallas ya construidas.

## El estado del código · verificado hoy

| | |
|---|---|
| Repositorio | `gerardoriarte-bt/synapse-api-go`, rama `feature/roles-y-preview` |
| Sobre qué está | `733c13c`, la cabeza actual de `feature/dynamic-dashboard-backend` |
| ¿Hace falta rebasar? | **No.** Su rama no se movió desde el 2026-09-11 |
| ¿Compila? | Sí · `go build ./...` limpio |
| ¿Sus tests? | **Pasan todos** · `go test ./...` sin fallos |
| Commits nuestros | Dos · `d326ebf` y `b13fccd` |

**Cero churn en código de ustedes.** Los dos commits agregan archivos y campos;
no reformatean ni reordenan nada existente. Es deliberado: un fork que reformatea
es un fork que nadie puede revisar.

## Las dos formas de tomarlo

**Con remoto** — si les sirve tener la rama:

```sh
git remote add front https://github.com/gerardoriarte-bt/synapse-api-go.git
git fetch front feature/roles-y-preview
git cherry-pick d326ebf          # B4.8 y B4.9
git cherry-pick b13fccd          # B1.25, B1.27, B4.1, B4.2, B4.4
```

**Con parches** — si prefieren no agregar un remoto, se los mandamos como dos
`.patch` (`git format-patch`, 112 KB) y se aplican con `git am`. Pídannoslos.

**Los dos commits son independientes.** Se puede tomar solo el primero —roles y
preview, que es lo que nos destraba— y dejar el segundo para después.

## Las cinco columnas · explícitas, sin `AutoMigrate`

El segundo commit agrega cinco campos a structs existentes. `AutoMigrate` las
aplicaría, pero **`DB_AUTO_MIGRATE=true` toca todas las tablas** y en una RDS
compartida eso es más superficie de la que este cambio necesita. Estas cinco
sentencias hacen exactamente lo mismo y nada más:

```sql
ALTER TABLE dd_catalog_metrics
  ADD COLUMN IF NOT EXISTS measurement_window text NOT NULL DEFAULT '';

ALTER TABLE dd_layout_versions
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS published_by_email text DEFAULT '';

ALTER TABLE dd_tabs
  ADD COLUMN IF NOT EXISTS chat_suggestions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS icon text DEFAULT '';
```

**Son aditivas y todas con default o nulables**, así que el binario viejo sigue
funcionando con la tabla nueva — se pueden correr antes de desplegar.

**Y dejan un `AutoMigrate` posterior en no-op** para estas cinco: GORM agrega
columnas faltantes y no toca las que ya están.

**Nosotros no las corrimos.** Es un cambio de esquema en producción y esa
decisión no es nuestra.

## Qué destraba cada commit

**`d326ebf` · B4.8 y B4.9** — es el que nos importa:

- `GET/POST/PUT/DELETE /admin/tenants/{id}/roles` · CRUD de roles por tenant
- `GET /admin/layouts/{id}/preview?roleId=` · la composición como la ve un rol

Destraba **F4.3** (gestión de roles) y **F4.12** (vista previa por rol), las dos
construidas y hoy probadas solo contra mocks.

**Una nota de diseño que va con esto:** el preview reusa `GetTab`, el **mismo**
camino que sirve a la consola, así que `tab_ids`, `hidden_metric_ids` y
`layout_overrides` se aplican una sola vez y en un solo lugar. Si el preview
reimplementara el filtro, terminaría mostrando algo distinto de lo que la consola
muestra.

**Y `DDRoleRepository` es un puerto aparte a propósito.** Ensanchar
`RoleRepository` rompía ocho mocks de ustedes; con un puerto nuevo, cero.

**`b13fccd` · B1.25, B1.27, B4.1, B4.2, B4.4** — lo que arregla cosas que hoy se
ven mal:

| Campo | Qué arregla |
|---|---|
| `measurement_window` | La línea de BASE sale hoy `Base · COMPLETED · MONTH ·` con el separador colgando. **El nombre del campo JSON lo acordamos igual a la columna** para no tener un tercer nombre que mantener |
| `open_period` | Que el selector pueda decir que el mes en curso está incompleto |
| `published_by` · `published_by_email` | Quién publicó cada versión |
| `chat_suggestions` · `icon` | Las sugerencias de chat y el ícono de la pestaña |

Más `GET /admin/layouts/{layoutId}/diff`, que compara dos versiones **por id y no
por posición** — comparar por posición reporta «cambió» cuando alguien solo movió
un panel.

## Si prefieren no tomarlo

Nos sirve saberlo igual. Lo que nos destraba es que esas rutas existan, no que
existan con nuestro código: si lo van a escribir ustedes, con la forma del cable
que ya está en `synapse-admin-wire.yaml` alcanza para que sigamos.

# Para el equipo de front · QA desplegado: migraciones · 2026-11-24

Respuesta a `docs/MENSAJE-2026-11-24-backend-qa-desplegado.md`, medido por ustedes contra `f1ccbbe`.

**Hecho en `1d3013d`.** Los dos pedidos del mensaje.

**No hecho (ops).** Correr las migraciones en QA sigue siendo del despliegue: el binario solo las aplica con `DB_AUTO_MIGRATE=true` y un usuario dueño de las tablas (no `synapse_local`). Con ese arranque una vez quedan `unsubscribe_token`, `archived_at` / `is_archived` y los títulos ES de la semilla.

## Pedidos

### 1 · Migraciones de `5b917f7` / `a13d27c` en QA

El código ya las tiene. Lo que faltaba en QA es **ejecutarlas** (esquema desfasado del binario).

Tras `DB_AUTO_MIGRATE=true` con el dueño de BD:

| Síntoma | Qué queda |
|---------|-----------|
| Crear reporte con destinatario → 500 | Columna + índice `unsubscribe_token` |
| Archivar dashboard → 500 `archived_at` | Columnas `is_archived` / `archived_at` |
| Títulos en inglés | `migrateSeedCatalogMetricNamesES` renombra la semilla |

### 2 · `unsubscribe_token` seguro con destinatarios existentes

AutoMigrate ya no exige `NOT NULL` sin default ni índice único en el tag GORM (rompía con filas previas, `SQLSTATE 23502`).

Orden de la migración manual:

1. Columna nullable (si falta).
2. Relleno de tokens en filas vacías/null.
3. `DEFAULT ''` + `NOT NULL`.
4. Índice único.

## Contrato

Sin cambio de rutas ni JSON. Solo esquema.

## QA

Tras desplegar `1d3013d` y correr migraciones una vez: crear reporte, archivar Overview y `GET /config/me` con títulos en español.

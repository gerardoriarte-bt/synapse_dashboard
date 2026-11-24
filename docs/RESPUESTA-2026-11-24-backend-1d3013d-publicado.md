# Para el equipo de front · 1d3013d no estaba en remoto ni en QA · 2026-11-24

Respuesta a `docs/MENSAJE-2026-11-24-backend-1d3013d-no-esta-en-qa.md`, medido por ustedes contra `f1ccbbe`.

**Hecho en local: `1d3013d` (+ anotación `db48310`).** El código de las tres respuestas del 2026-11-24 está en la máquina de backend; **no se había hecho `git push`**, por eso no aparecía en `git ls-remote` ni en QA. Eso explica la tabla (sin `thresholds`, sin `archived_at`, títulos en inglés, rentabilidad `BLOCKED`).

## Pedidos

| # | Pedido | Estado |
|---|--------|--------|
| 1 | Publicar `1d3013d` en `feature/dynamic-dashboard-backend` | **En curso:** push desde la máquina de Luis (esta sesión no tiene acceso SSH al remoto). Cuando esté en remoto, la cabeza debe ser `db48310` (anota el hash) o al menos incluir `1d3013d`. |
| 2 | Desplegar QA + migraciones una vez (`DB_AUTO_MIGRATE=true`, dueño de tablas) | **Pendiente** tras el push. Sin eso QA sigue en `f1ccbbe` / esquema viejo. |
| 3 | Desplegar front `main` (`4b58dbd`) | **Front / ops** (fuera de este repo). |
| 4 | Materializar UA MX `2026-10` | **Pendiente** tras desplegar el binario con el registry nuevo. |

## Contrato

Sin cambio nuevo respecto a las tres respuestas ya enviadas. Solo faltaba publicar y desplegar.

## Cómo lo verifican ustedes

```bash
git fetch origin feature/dynamic-dashboard-backend
git cat-file -t 1d3013d   # debe existir en el remoto
```

En QA, tras deploy + migrate + materialize:

- `GET /config/blocks` → `thresholds` en `kpi` y `gauge`
- archivar Overview sin 500
- títulos ES de la semilla
- rentabilidad deja de ser `BLOCKED` «sin fuente» (si la vista Gold existe)

**Sigue vigente:** no mezclar las métricas nuevas con `revenue` / `spend` / `daily_trend` hasta el OK de datos.

## QA

Commit desplegado hoy: sigue `f1ccbbe` hasta el push + deploy. Avisamos cuando el remoto tenga `1d3013d` y QA esté migrado.

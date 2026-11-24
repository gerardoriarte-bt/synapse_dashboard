# Para el equipo de front · `thresholds` en kpi y gauge · 2026-11-24

Respuesta a `docs/MENSAJE-2026-11-24-backend-umbrales-en-kpi-y-gauge.md`, medido por ustedes contra `f1ccbbe`.

**Hecho en `1d3013d`.** Los dos puntos del pedido.

## Pedidos

1. `"thresholds"` en `layout_params` de `kpi` y `gauge` en el seed (`defaultBlockSeedRows`).
2. Migración `migrateBlockThresholdsLayoutParams`: `UPDATE blocks SET layout_params = …` para esos dos `block_type` (el seed es `OnConflict DoNothing`).

## Contrato

Sin validación nueva de `options`: se guarda como viene. El front puede mandar:

```json
{ "thresholds": { "bien": 3.0, "mal": 1.5 } }
```

## Cómo comprobar

`GET /config/blocks` → `kpi` y `gauge` incluyen `"thresholds"` en `layout_params`.

## QA

Tras desplegar `1d3013d` con `DB_AUTO_MIGRATE=true` (una vez), el `GET /config/blocks` de QA debe traer `thresholds` en ambos.

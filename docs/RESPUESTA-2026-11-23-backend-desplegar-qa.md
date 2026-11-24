# Para el equipo de front · desplegar QA: front de `main` y reportes · 2026-11-23

Respuesta a `docs/MENSAJE-2026-11-23-backend-desplegar-qa.md`, medido por ustedes contra `fb3ca0c`.

**Hecho en código:** tzdata y tablas de reportes ya van en `5b917f7` / `49ebb26`; meses cerrados en `8366936`. La respuesta escrita de este mensaje y el corte UA MX (títulos/prosa) están en `a13d27c` (misma rama).

## 1 · El front · `main` en `fd3d239`

**No hecho (no es de este repo).** El despliegue del front en QA lo corre front/ops. Confirmamos: con backend ≥ `49ebb26` Reportes deja de mostrar «Este servidor todavía no ofrece esta función».

## 2 · El backend · cinco condiciones + meses cerrados

### Condiciones para el despliegue

| # | Pedido | Estado |
|---|--------|--------|
| 1 | `tzdata` / `time/tzdata` | **Hecho en `5b917f7`.** Binario con `import _ "time/tzdata"` e imagen Alpine con `apk add tzdata`. |
| 2 | Tablas `dd_reports`, `dd_report_recipients`, `dd_report_runs` | **Ya en `migrations.go` desde `49ebb26`.** Con `DB_AUTO_MIGRATE=false` hay que crearlas en el despliegue (AutoMigrate o script del equipo de deploy). |
| 3 | `DD_REPORTS_ENABLED=true` | **Ops / entorno.** Sin ella se crean y validan, pero el programador no envía. |
| 4 | `EMAIL_ENABLED` + SES | **Ops.** El arranque debe loguear «SES inicializado», no «correos deshabilitados»; si no, `NoopSender` marca enviado sin mandar. |
| 5 | DKIM de `lobueno.co` | **Ops.** Sigue fuera del API. |

### Meses cerrados (`8366936`)

**Hecho en `8366936`** (anotado en `7203fe8`). En esta rama ya está **después** de `fb3ca0c`:

`fb3ca0c` → `8366936` → … → `5b917f7` → `0a13a91`.

Si QA sigue en `fb3ca0c`, es porque **ese binario no se desplegó** (y el push de esta rama a veces falla por SSH). Hay que publicar y desplegar al menos `8366936`; idealmente HEAD con `5b917f7` (tzdata + reportes ajustes + Terpel).

**Contrato.** Sin rutas nuevas en este mensaje. Checklist de deploy.

**Commit en QA:** al medir ustedes, `fb3ca0c`. `8366936` y `5b917f7` no están en QA hasta el deploy.

## Cómo comprobarlo después (igual que su §3)

1. Consola: «Resumen del mes», Decisions sin desborde, series por serie.
2. Terpel Lubricantes: `timezone` = `America/Bogota` guarda sin 400.
3. Reportes: lista abre; crear → validar → activar en ~3 min → llega el correo (si no llega y «Ver envíos» dice ok → SES/Noop).
4. Con `8366936`: marzo sin aviso de degradado por edad.

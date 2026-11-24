# Para el equipo de backend · QA desplegado: dos cosas que faltan · 2026-11-24

**Medido contra `f1ccbbe` el 2026-11-24**, con su binario levantado en local
y `npm run humo`. En QA, ese mismo día, la consola y la administración de UA
MX y Terpel, y el archivado de Overview. El detalle está en `docs/AUDITORIA-2026-11-24-qa-desplegado.md`.

Hola. Gracias por el despliegue. En QA ya funcionan:

- los meses cerrados (enero a noviembre, todos disponibles);
- las zonas horarias (Terpel Lubricantes y Lealtad guardaron `America/Bogota`);
- Reportes.

El front de `main` también está desplegado, y sigue alineado con `f1ccbbe`:
lo de reportes es todo agregado, y transcribimos `is_archived`.

Faltan dos cosas.

## 1 · En QA no corrieron las migraciones · el más importante

Lo muestran dos síntomas:

- **Archivar un dashboard da 500.** `POST /admin/dashboards/{dashboardId}/archive`
  sobre Overview de UA MX contesta:
  `column "archived_at" of relation "dd_dashboards" does not exist (SQLSTATE 42703)`.
- **Los títulos siguen en inglés**: «Decisions», «Investment» y
  «Twelve-month efficiency». El mismo binario, arrancado en local con
  `DB_AUTO_MIGRATE=true`, los renombra a «Decisiones», «Inversión» y
  «Eficiencia de doce meses».

El código de `5b917f7` está desplegado, porque las zonas horarias y Reportes
funcionan, pero su esquema no. **Pedido:** correr las migraciones de
`5b917f7` y `a13d27c` en QA, o el script equivalente. Con eso queremos
archivar Overview en UA MX y Terpel Combustibles. Ya no lo ve ningún rol,
pero un rol nuevo lo vería.

## 2 · La migración de `5b917f7` rompe con destinatarios existentes

`dd_report_recipients` gana `unsubscribe_token text NOT NULL` sin valor por
defecto. En una base que ya tiene destinatarios, AutoMigrate falla y el
servicio no arranca:

```
ERROR: column "unsubscribe_token" of relation "dd_report_recipients" contains null values (SQLSTATE 23502)
```

En QA no pasó porque las tablas nacieron vacías. Producción va a tener la
misma suerte si llega sin reportes, pero cualquier base con reportes cargados
se cae. **Pedido:** crear la columna nullable, llenar los tokens y recién
después pasarla a `NOT NULL`, o darle un default.

Gracias.

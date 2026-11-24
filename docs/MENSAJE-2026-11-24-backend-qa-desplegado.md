# Para el equipo de backend · QA desplegado: dos cosas que faltan · 2026-11-24

**Medido contra `f1ccbbe` el 2026-11-24**, con su binario levantado en local
y `npm run humo`. En QA, ese mismo día, la consola y la administración de UA
MX y Terpel. El detalle está en `docs/AUDITORIA-2026-11-24-qa-desplegado.md`.

Hola. Gracias por el despliegue. En QA ya funcionan:

- los meses cerrados (enero a noviembre, todos disponibles);
- las zonas horarias (Terpel Lubricantes y Lealtad guardaron `America/Bogota`);
- Reportes.

El front de `main` también está desplegado, y sigue alineado con `f1ccbbe`:
lo de reportes es todo agregado, y transcribimos `is_archived`.

Faltan dos cosas.

## 1 · Los títulos siguen en inglés en QA

«Decisions», «Investment» y «Twelve-month efficiency» siguen así en el
catálogo de UA MX. El mismo binario, arrancado en local con
`DB_AUTO_MIGRATE=true`, los renombra a «Decisiones», «Inversión» y
«Eficiencia de doce meses». **En QA la migración de `a13d27c` no corrió.**
¿Se puede correr, o desplegar `a13d27c` si no está?

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

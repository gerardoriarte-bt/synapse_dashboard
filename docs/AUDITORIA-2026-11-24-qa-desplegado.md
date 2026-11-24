# QA desplegado: lo que se verificó · 2026-11-24

**Medido en QA el 2026-11-24**, como superadmin, después del despliegue que
contestó el backend en `docs/RESPUESTA-2026-11-23-backend-desplegar-qa.md` y
`docs/RESPUESTA-2026-11-23-backend-ua-mx.md`. El backend publicó hasta
`f1ccbbe`, y ese commit es solo formato (`gofmt`).

## 1 · Qué está desplegado

| Parte | Cómo se midió | Resultado |
|---|---|---|
| Front | El bundle es del 2026-11-24 a las 14:36 GMT y trae «Todavía no has preguntado nada» | **`main` de este repositorio**, con el #118 |
| Backend | `GET /admin/tenants/{tenantId}/reports` contesta 200; guardar `America/Bogota` en Terpel Lubricantes y Lealtad contesta 200; los dashboards traen `is_archived` | **`5b917f7` o posterior** |
| Las migraciones | Archivar Overview da 500: falta la columna `archived_at`. Los títulos del catálogo de UA MX siguen en inglés: «Decisions», «Investment», «Twelve-month efficiency». En local, el mismo binario los renombra al arrancar | **No corrieron en QA**: ni `5b917f7` ni `a13d27c` |

## 2 · UA MX, punto por punto

| Qué | Resultado |
|---|---|
| Meses cerrados | **Enero a noviembre: 13 de 13 `AVAILABLE`**. Marzo ya no muestra el aviso de degradado |
| Diciembre de 2025 | 12 de 13. El top 10 de productos sale bloqueado |
| La prosa de «Decisions» | Hace scroll dentro del panel; el pie no se pisa |
| La consola | «Resumen del mes», las preguntas cortas, y las cifras abreviadas («1.51M», «14.2K») |
| Reportes | Abre con su estado vacío y «Nuevo reporte» |
| Zonas horarias | Los dos clientes nuevos de Terpel quedaron en `America/Bogota` |
| Títulos en español | **Falta**: la migración no corrió |
| Correo real de un reporte | **Sin probar**: hace falta un destinatario |

## 3 · Alineación del front con `f1ccbbe`

Se midió con `npm run humo` contra `f1ccbbe` levantado en local:

- **Una sola diferencia**: `dashboard.is_archived`, que llegó con `5b917f7`.
  Quedó transcripto en `contracts/synapse-admin-wire.yaml`.
- Los cambios de reportes son **todos agregados**: las fuentes de cada
  respuesta, el envío de prueba, la baja y los avisos por externos. No
  cambió ni se borró ningún campo que el front lea.
- **El front desplegado sigue alineado.** Lo nuevo todavía no lo usa.

## 4 · Un defecto de la migración de `5b917f7`

`dd_report_recipients` gana `unsubscribe_token text NOT NULL`, sin valor por
defecto. Con destinatarios ya cargados, AutoMigrate falla y **el servicio no
arranca**:

```
ERROR: column "unsubscribe_token" of relation "dd_report_recipients" contains null values (SQLSTATE 23502)
```

Pasó en la base local, con los dos destinatarios de la prueba del
2026-11-18. **En QA no se nota**, porque las tablas nacieron vacías con este
despliegue. Pero cualquier base que ya tenga reportes la va a encontrar.

## 5 · Lo nuevo del backend que el front puede tomar

Todo está en `5b917f7` y ya está desplegado en QA:

- `POST /admin/tenants/{tenantId}/reports/{reportId}/test`: «Enviarme una
  prueba», que el `.pen` dibuja.
- Las fuentes de cada respuesta (`sources`, con fuente, período y frescura), y
  la marca de respuesta vieja.
- `GET /admin/report-external-notices`: los avisos por externos.
- `POST /admin/dashboards/{dashboardId}/archive`: archivar Overview de verdad
  en UA MX y Terpel.
- `GET /reports/unsubscribe`: la baja.

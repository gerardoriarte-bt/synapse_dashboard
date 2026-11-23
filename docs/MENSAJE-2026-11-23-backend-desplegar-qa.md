# Para el equipo de backend · desplegar QA: el front de `main` y los reportes · 2026-11-23

**Medido contra `fb3ca0c` el 2026-11-23**, con su binario levantado en local
sobre una base descartable:

- **`npm run humo`** contra ese servicio, con el front de `main`
  (`fd3d239`): **las 12 rutas medibles de la consola y las 12 de
  administración coinciden campo por campo, en las dos direcciones**. Las tres
  que no se prueban (el chat por SSE, el drill-down en vivo y borrar un hilo)
  se saltean con razón. Las de reportes se recorrieron de punta a punta el
  2026-11-18, con el reporte creado, validado, activado y enviado por
  `NoopSender`.
- **Del código:** `migrations.go`, `internal/bootstrap/app.go` y
  `dd_report_dispatcher.go`.

**En QA, ese mismo día:**

- el front es del 2026-11-18 a las 20:08 GMT;
- `GET /admin/tenants/{tenantId}/reports` contesta 404, así que el backend de
  QA es anterior a `49ebb26`.

Hola. Queremos dejar QA listo para ir a producción, y para eso hay que
desplegar las dos partes. **Los dos repositorios están alineados**: el front
de `main` habla exactamente el cable de `fb3ca0c`.

## 1 · El front · `main` en `fd3d239`

Desde lo que sirve QA entraron:

- los desbordes de panel;
- los formatos;
- el chat legible;
- la interfaz en tú;
- las series con su unidad;
- los reportes en la hora del cliente.

El detalle está en el PR #118.

**No depende del orden.** Con el backend de hoy, Reportes dice «Este
servidor todavía no ofrece esta función» en vez de quedarse cargando. Con
`fb3ca0c` funciona entero.

## 2 · El backend · `fb3ca0c`, con cinco condiciones

1. **Las zonas horarias en la imagen: bloqueante.** El `Dockerfile` usa
   `alpine:latest` sin `tzdata`, y nada importa `time/tzdata`. QA rechaza
   `America/Bogota` y calcula todo en UTC, incluida la hora de los reportes.
   Basta con `apk add --no-cache tzdata`, o con `import _ "time/tzdata"`.
   Detallado en `docs/MENSAJE-2026-11-20-backend-terpel-tres-clientes.md`.
2. **Las tres tablas:** `dd_reports`, `dd_report_recipients` y
   `dd_report_runs`, en `migrations.go`. Con `DB_AUTO_MIGRATE=false` no se
   crean solas, así que van antes del despliegue o junto con él.
3. **`DD_REPORTS_ENABLED=true`**, para que el programador envíe. Sin ella, los
   reportes se crean, se validan y se activan, pero ninguno sale.
4. **`EMAIL_ENABLED` y SES** (`SES_REGION`, `SES_FROM_EMAIL`). Si la
   configuración está incompleta, el servicio usa `NoopSender`: **registra el
   envío como hecho y no manda nada**. La señal está en el log del arranque,
   que tiene que decir «SES inicializado» y no «correos deshabilitados».
5. **La firma DKIM de `lobueno.co`.** Sin ella, el correo puede caer en spam.

**Y el commit 8366936**, el de los meses cerrados, que respondieron el 18 como
hecho: **no está publicado**. Si lo publican antes del despliegue, va junto.
Sin él, de enero a septiembre los 13 paneles de UA MX salen «degradados».

## 3 · Cómo lo comprobamos después

En QA, con UA MX:

1. **El front:** la consola dice «Resumen del mes», la prosa de «Decisions» no
   se sale de su panel y los gráficos de varias series van uno por serie.
2. **Las zonas horarias:** en la ficha de Terpel Lubricantes, cambiar la zona
   a `America/Bogota` tiene que guardar sin error.
3. **Los reportes:** Administración → Reportes abre la lista. Creamos uno con
   un correo nuestro, generamos las respuestas, lo activamos para dentro de
   tres minutos y **tiene que llegar el correo**. Si «Ver envíos» lo muestra
   como enviado y el correo no llega, es la condición 4.
4. **Los meses cerrados**, si va 8366936: marzo sin el aviso de degradado.

Y volvemos a correr el humo contra QA.

Gracias.

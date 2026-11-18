# Para el equipo de backend · los reportes por correo: lo aceptado y cinco ajustes · 2026-11-18

**Medido contra `fb3ca0c` el 2026-11-18**, que contiene `49ebb26`. Leí
`dd_report_service.go`, `dd_report_answerer.go`, `dd_report_dispatcher.go`,
`dd_report_mailer.go` y las rutas en `router.go`. `go test ./tests/services
-run Report` pasa: 10 de 10. **No lo probamos en QA**, porque todavía no está.
El detalle está en `docs/AUDITORIA-2026-11-18-respuesta-reportes-por-correo.md`.

Hola. Gracias por los reportes: el ciclo de estados, la validación, el alcance
por cliente y la hora del cliente están como los pedía el plan.

## 1 · Lo que producto acepta como lo hicieron

Donde lo construido difiere de `plan-fase-6.md`, **producto decidió el
2026-11-18 quedarse con lo de ustedes**. No hay que cambiar nada de esto:

- **Frecuencia diaria**, además de semanal y mensual.
- **Tope de 50 destinatarios**, no 20.
- **Agregar un externo no vuelve a borrador.** Sólo las preguntas y el rol.
- **No se borra**: pausar es la baja.
- **Cada envío le vuelve a preguntar al agente.** Lo que llega no es lo que se
  leyó al validar, y producto lo acepta. Por eso pesa el punto 1 de abajo.

## 2 · Cinco ajustes

### 1 · Que cada respuesta diga de dónde sale su cifra

Hoy cada respuesta es `{question, answer, error}`, con el texto del agente.
B6.5 pide fuente, período y frescura en cada una, igual que un panel, y que la
respuesta lo diga si el dato está vencido.

**Es el ajuste que más importa**, porque cada envío trae respuestas nuevas que
nadie leyó. Con la fuente al lado, quien lee el correo puede ver de dónde salió
una cifra que no le cierra.

La forma la eligen ustedes. Para el front alcanza con un campo por respuesta,
por ejemplo `sources`, con la fuente, el período y la frescura, y que el correo
lo muestre debajo de cada respuesta.

### 2 · Un correo que ya es de un usuario no entra como externo

`user_ids` exige el rol del reporte, pero `emails` acepta cualquier correo.
Así, un usuario con otro rol, o de otro cliente, entra como «externo» y recibe
las respuestas de un rol que no es el suyo. Proponemos que `emails` rechace con
400 un correo que pertenece a un usuario, y que la respuesta diga que se agrega
por `user_ids`.

### 3 · La baja en cada correo

Cada correo tiene que traer cómo dejar de recibir ese reporte. Para un externo,
que no tiene cuenta, es la única forma de salir. Puede ser un enlace que
desactiva su destinatario.

### 4 · Enviar una prueba ahora

Una ruta que manda el reporte sólo a quien la llama, sin esperar la hora y
marcada como prueba en `runs`. Es lo que va a usar la pantalla antes de
activar.

### 5 · La lista de avisos por externos

El correo a los superadmins ya sale. Falta poder verlos después: una lectura de
los destinatarios externos agregados, con cliente, reporte, correo, quién y
cuándo. Producto decidió mostrarla en Clientes (P6.4). Hoy sólo queda
`notified_at` en el destinatario, y si el correo falla, el aviso queda sólo en
el log.

## 3 · Para QA

Cuando lo desplieguen: las tablas `dd_reports`, `dd_report_recipients` y
`dd_report_runs`, y `DD_REPORTS_ENABLED=true`. Nosotros transcribimos las rutas
al cable de administración y las probamos contra QA.

## Cómo lo comprobamos

1. Validar un reporte de UA: cada respuesta trae su fuente, período y
   frescura.
2. Poner en `emails` el correo de un usuario: 400.
3. El correo que llega trae la baja, y al usarla ese destinatario queda
   inactivo.
4. La prueba llega sólo a quien la pidió, y figura como prueba en `runs`.
5. Agregar un externo y verlo en la lista de avisos.

Gracias.

# Para backend · la plantilla del correo del reporte, y la alerta al admin · 2026-11-27

**Medido contra `8435296` el 2026-11-27**, en `feature/dynamic-dashboard-backend`:

- `internal/core/services/dd_report_mailer.go`: hoy el cuerpo es texto plano
  que `textToHTML` envuelve en un solo `<div>`;
- `internal/core/ports/email.go` e `internal/adapters/ses/mime.go`: cómo viajan
  las imágenes embebidas;
- `DDReport.CreatedBy` y `DDReportRun` en `internal/core/domain/dd_report.go`.

De nuestro lado, la plantilla se ejecutó con `html/template` de Go
(`go run correo/vista-previa.go`) y se miró sobre un fondo claro y uno oscuro.

Hola. Ya llegan los correos del reporte, gracias. Les mandamos cómo tienen que
verse. **La plantilla ya está escrita**, en la misma sintaxis que usan
ustedes, y lo que les pedimos es conectarla. Las decisiones son de producto,
del 2026-11-27, y están en `plan-fase-6.md` como P6.10–P6.15.

## 1 · La plantilla

Está en nuestro repositorio: `correo/reporte.html`
(<https://github.com/gerardoriarte-bt/synapse_dashboard/blob/main/correo/reporte.html>).
Es `html/template`; en la cabecera dice qué datos recibe y de dónde sale cada
uno. Lo que cambia frente a hoy:

- **El logo es el de la plataforma**: `src/assets/images/wordmark-marca.png`
  (<https://github.com/gerardoriarte-bt/synapse_dashboard/blob/main/src/assets/images/wordmark-marca.png>),
  la palabra con su degradado. **No es su `synapse-logo.png`**: ese trae «BY …
  GROUP» con la parte del medio en blanco, que sobre fondo blanco no se ve. Les
  proponemos sumarlo con otro content-ID (por ejemplo `synapse-wordmark`) y no
  tocar los correos de acceso.
- **Los títulos son los del reporte**: el nombre que le puso quien lo creó, y
  cada pregunta como la escribió. Sin numeración ni rótulos agregados.
- **Sin colores**: ni fondo ni color de texto, para que mande el cliente de
  correo, claro u oscuro.
- **Los estilos van escritos en cada etiqueta, no en variables.**
  `html/template` cambia por `ZgotmplZ` un estilo que llega desde una variable;
  nos pasó al armarla.

Para un **externo**, `ConsoleURL` va vacío y el botón no sale (P6.7). Para un
usuario, les pedimos que abra la consola del cliente en el período del
reporte; hoy el correo no lleva ese enlace.

## 2 · Sólo las preguntas con respuesta

**Quien recibe no ve una pregunta sin dato ni una con la fuente vencida**
(P6.12). Antes de ejecutar la plantilla, una respuesta queda fuera si:

- trae `Error`;
- su `Answer` está vacía;
- alguna de sus `Sources` viene con `Stale`.

**Si no queda ninguna, el correo no sale** (P6.13). El envío se registra como
saltado, no como fallido.

Esto reemplaza lo que hoy hace `reportNoAnswerText` («No hubo respuesta para
esta pregunta en este envío»), que deja de aparecer en el correo.

## 3 · La alerta al admin

Cada vez que una pregunta queda fuera, o se salta el envío, **le llega un
correo a quien creó el reporte** (`DDReport.CreatedBy`). Dice qué preguntas
quedaron fuera y por qué: sin dato, error, o fuente vencida con su última
carga (P6.14). Puede ir en texto plano, como el aviso de externos.

Un envío de prueba no genera alerta: quien la pidió ya está mirando las
respuestas.

**Y lo mismo dentro de la plataforma.** Les pedimos que `DDReportRun` lo diga,
para mostrarlo en el historial de envíos. Por ejemplo:

- un estado `skipped` cuando no salió;
- por cada pregunta fuera, el texto de la pregunta y su razón (`no_data`,
  `error` o `stale`, con la fuente y su frescura).

La forma la eligen ustedes; nos avisan y la transcribimos.

## 4 · Dos cosas del envío con imágenes embebidas

Al conectar el logo, el correo pasa por `buildRawMIME`, y ahí vimos dos cosas:

1. **Se pierde la versión en texto plano.** Arma `multipart/related` sólo con
   el HTML y las imágenes: `TextBody` no viaja. Lo usual es un
   `multipart/alternative` con el texto y el `related` adentro.
2. **El HTML se declara `quoted-printable` pero se escribe sin codificar.** Un
   `=` seguido de dos caracteres hexadecimales se decodifica: el enlace
   `?period=2026-09` llegaría como `?period 26-09`, porque `=20` es un espacio.
   Las líneas de más de 76 caracteres tampoco son válidas en ese esquema. Se
   resuelve pasando el HTML por `mime/quotedprintable.NewWriter` o declarándolo
   `8bit`.

El segundo afecta también a los correos de acceso, en cuanto lleven un `=`
seguido de dos hexadecimales.

Gracias.

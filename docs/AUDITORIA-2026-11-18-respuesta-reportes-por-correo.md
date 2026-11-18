# La respuesta del backend sobre los reportes por correo, medida · 2026-11-18

**Medido contra `fb3ca0c` el 2026-11-18**, que contiene `49ebb26`. Leí el
servicio, el que contesta las preguntas, el que envía, el que arma el correo,
el dominio y las rutas. Además corrí `go test ./tests/services -run Report`:
**10 pruebas, las 10 pasan**. **No está en QA**, así que nada de esto se probó
contra el servicio.

La respuesta es `docs/RESPUESTA-2026-11-17-backend-reportes-por-correo.md`.
**No hubo mensaje nuestro**: el backend trabajó desde las tareas B6.3 a B6.6 de
`plan-fase-6.md` y las decisiones de producto del 2026-11-04 (P6.1 a P6.7).
Contra eso se mide acá.

## En corto

- **Lo grueso está, y bien hecho**:
  - los cuatro estados;
  - de 3 a 5 preguntas;
  - no se activa sin validar;
  - cambiar una pregunta o el rol vuelve a borrador;
  - la hora del cliente;
  - cada admin sólo con su cliente;
  - el aviso por correo a los superadmins por cada externo;
  - un usuario suspendido deja de recibir.
- **Cuatro decisiones de producto no se aplicaron**: hay frecuencia diaria, el
  tope es de 50 destinatarios, agregar un externo no vuelve a borrador, y no
  hay lista de avisos en Clientes. La respuesta cita «F6.5» para la del
  externo; la decisión es P6.1.
- **Las respuestas no dicen de dónde sale su cifra**, ni avisan si el dato está
  vencido. Es el criterio central de B6.5 y no está.
- **Faltan «Enviar una prueba ahora» y la baja en cada correo** (B6.6).
- **Una cosa que producto tiene que saber**: cada envío le vuelve a preguntar al
  agente. Lo que llega por correo no es lo que se leyó al validar.

## 1 · Contra los criterios de B6.3 · el reporte como objeto

| Criterio | Qué hay | |
|---|---|---|
| Menos de 3 o más de 5 preguntas, o una vacía: 400 | `reportMinQuestions = 3`, `reportMaxQuestions = 5` | ✓ |
| No se activa sin validar, y la validación queda con quién la hizo y qué leyó | Activar un borrador da 409. `validated_by` y una corrida `validation` con las respuestas | ✓ |
| Cambiar una pregunta vuelve a borrador | Sí, y cambiar el rol también | ✓ |
| **Agregar un externo vuelve a borrador** (P6.1) | **No**: «nombre, horario y destinatarios no bajan el estado» | ✗ |
| **Semanal o mensual; otra frecuencia, 400** (P6.2) | **Acepta `daily`** | ✗ |
| **Más de 20 destinatarios, 400** (P6.5) | **El tope es 50** (`reportMaxRecipients`) | ✗ |
| Externo es todo correo sin usuario en la plataforma (P6.6) | Todo lo que va en `emails` es externo, **aunque sea el correo de un usuario** | ⚠️ |
| La hora es del cliente | `send_time` en `tenants.timezone` | ✓ |
| Un externo genera una advertencia a los superadmins: quién, qué reporte y qué correo, **por correo y en una lista de Clientes** (P6.4) | El correo sí, con cliente, reporte, correo, quién y cuándo. **La lista no**: no hay ruta, sólo `notified_at` en el destinatario. Si el correo falla, queda en el log y no se reintenta | ⚠️ |
| Un usuario suspendido deja de recibir | Se filtra al enviar, y también quien cambió de cliente o de rol | ✓ |

**El ⚠️ de P6.6 tiene una consecuencia.** `user_ids` exige que el usuario tenga
el rol del reporte, porque el rol decide qué datos ve. Pero el correo de un
usuario con otro rol se puede poner en `emails`, y entonces recibe igual las
respuestas de este rol. Los superadmins reciben el aviso, así que no pasa en
silencio. Aun así, conviene que un correo que ya es de un usuario no se acepte
como externo.

## 2 · Contra B6.4 · las rutas

| Criterio | Qué hay | |
|---|---|---|
| Un admin sólo con su cliente; un superadmin con cualquiera | `RequireRouteTenant("tenantId")`, igual que las demás rutas de admin, y cada reporte se busca dentro del cliente | ✓ |
| Ningún otro rol crea ni edita | `AdminOnlyMiddleware` | ✓ |
| Borrar | **No hay**: pausar es la baja y nada se elimina. Es una decisión razonable, pero distinta del criterio. La decide producto | ⚠️ |
| Generar las respuestas sin enviar ni cambiar el estado | `validate` las genera y, si todas contestan, **pasa a `validated`**. No hay forma de verlas sin validar. Para la pantalla F6.10 alcanza | ⚠️ |

## 3 · Contra B6.5 · contestar las preguntas

**Contesta el agente Cortex del rol**, en un hilo por pregunta, con un prompt
que pide texto plano, cinco oraciones como máximo y «si no hay datos, decilo».
D6.1 decía «el generador de prosa consultando Snowflake»; es lo mismo en el
fondo.

| Criterio | Qué hay | |
|---|---|---|
| **Cada respuesta declara fuente, período y frescura** | **No**: cada respuesta es `{question, answer, error}`, y el texto es del agente | ✗ |
| Una pregunta sin datos se declara y no se rellena | Lo pide el prompt; queda en manos del agente. Una respuesta que dice «no hay datos» cuenta como contestada y deja validar | ⚠️ |
| Si el feed está vencido, lo dice | **No** se consulta la frescura | ✗ |
| El largo tiene un tope declarado | «Máximo cinco oraciones», en el prompt. No se verifica | ⚠️ |
| Los usuarios reciben enlaces a la consola; un externo, no (P6.7) | **Ningún correo lleva enlaces.** Para el externo se cumple; para el usuario falta | ⚠️ |

## 4 · Contra B6.6 · programar y enviar

| Criterio | Qué hay | |
|---|---|---|
| Sólo salen los activos | Sí, y no envía si el cliente está desactivado | ✓ |
| Cada envío registrado: reporte, destinatario, hora y resultado | Una corrida por envío, con la lista de correos enviados y las fallas en un texto. **No hay registro por destinatario, ni rebotes** | ⚠️ |
| **«Enviar una prueba ahora»** | **No hay** | ✗ |
| **Cada correo trae cómo darse de baja** | **No**. Para un externo, que no tiene cuenta, es la única forma de salir | ✗ |

**Y lo que avisan ellos**: el DKIM de SES para `lobueno.co` está pendiente de
operaciones, así que el correo puede caer en spam. Además, QA necesita las tres
tablas nuevas y `DD_REPORTS_ENABLED=true`.

## 5 · Lo que producto tiene que saber

**Validar comprueba que el agente contesta, no lo que va a decir.** Cada envío
le vuelve a preguntar al agente, así que lo que reciben los destinatarios es una
respuesta nueva que nadie leyó. D6.1 aceptó que el agente consulte por su
cuenta, y lo justificaba con D6.4: nadie activa un reporte sin haber leído sus
respuestas. Eso se cumple **sólo la primera vez**. Si el agente da una cifra
distinta de la del panel —el ROAS 7,28 contra 2,07 del 2026-10-19—, va a llegar
por correo sin que nadie la vea.

**Lo que lo atenúa es el criterio de B6.5 que falta**: que cada respuesta diga
de dónde salió su cifra. Por eso conviene pedirlo primero.

## 6 · Qué sigue

**Del front, ya se puede tomar F6.4**: transcribir las rutas al cable de
administración desde su OpenAPI. El humo espera a QA.

**Del backend**, si producto lo confirma, un mensaje con:

1. **Las cuatro decisiones de producto**: P6.1, P6.2, P6.4 y P6.5.
2. **Que un correo de un usuario no entre como externo** (P6.6).
3. **Fuente, período y frescura en cada respuesta**, y el aviso de dato vencido
   (B6.5).
4. **La baja y el envío de prueba** (B6.6).
5. **Desplegar en QA**, con sus tablas y la variable.

**De producto**: si se acepta que cada envío vuelva a preguntar (§5), y si
borrar se reemplaza por pausar (§2).

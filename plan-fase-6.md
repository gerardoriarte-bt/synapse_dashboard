# Plan de trabajo · Fase 6 · Las métricas de cada cliente y el reporte programado

**Abierta el 2026-11-03 por decisión humana.** Es la continuación de
`plan-de-trabajo.md` y vive aparte para que se lea sola: qué entra, qué se
decidió, en qué orden se hace y quién tiene cada pieza.

**Las reglas son las de `plan-de-trabajo.md`, sin excepción**: los estados
(✅ ⚠️ ⬜ 🕓 ➕ 🔒), que toda tarea lleve criterio de aceptación, que una tarea
`B*` sólo se cierra verificada contra el servicio corriendo, y que lo que se le
pide al backend viva en la tarea que lo espera. **`npm run plan` lee los dos
archivos**: estas tareas salen en `plan-tareas.csv`, en la página, en
`docs/ESTADO.md` y en `docs/PARA-BACKEND.md` igual que las demás.

**Se numera 6 y no 2 porque la Fase 2 ya existe** —materialización en el
backend, estados en pantalla en el front— y el número va dentro del
identificador. Hacia afuera se la puede llamar «Fase 2 del proyecto»; acá es
`B6.x` y `F6.x`. **Ojo con el documento del backend**:
`docs/dynamic-dashboard-backend.md` llama «Fase 6» a la prosa por agente, que
acá es B2.15. Son numeraciones distintas, como ya pasaba con la Fase 1.

## 1 · El objetivo

Dos frentes, independientes entre sí:

1. **Que las métricas que datos entregó se calculen**, para que Terpel muestre
   cifras y UA tenga las que le faltan. Del front no hay código: los cuerpos ya
   dibujan esas formas.
2. **Un reporte por correo, programado**, que contesta de tres a cinco
   preguntas de negocio. Lo programan el admin, para su cliente, y el
   superadmin, para cualquiera.

**La fase está terminada cuando:**

- La consola de Terpel en QA muestra sus métricas con cifra, y cada cifra se
  reproduce con una consulta sobre su vista.
- Las métricas nuevas de UA están igual, o la fase dice por escrito qué falta
  de datos para que lo estén.
- Un admin de un cliente crea un reporte, lee sus respuestas con datos reales,
  lo activa, y el correo llega a la hora del cliente, también a un externo.

## 2 · Qué entra y qué no

| Entra | No entra |
|---|---|
| La tanda A de Terpel, en `MetricRegistry` | Las vistas por métrica (opción B de B1.26) |
| Las métricas nuevas de UA, cuando datos las corrija | Slack como canal |
| El reporte: preguntas, destinatarios, hora, validación, envío, baja | Las alertas fuera de banda: necesitan la línea base con banda, §2.5 de `docs/PROPUESTA-2026-10-29-asistente-de-crecimiento.md` |
| Destinatarios externos, con advertencia al superadmin | Que cada usuario configure su propio brief desde el perfil, como dibuja `Propuesta · Crecimiento · 2` |
| El mapa de UX y el pedido de dibujo | |

## 3 · Las decisiones

**Las cinco se tomaron el 2026-11-03 (humano).** Se planteó cada una con una
propuesta del front; queda lo que se decidió y, donde la decisión cambió la
propuesta, qué cubre el riesgo.

| | Pregunta | Decisión | Qué cambia en el plan |
|---|---|---|---|
| **D6.1** | ¿Cómo se contesta una pregunta escrita por el admin? | **La contesta el generador de prosa, consultando Snowflake**, con respuestas cortas y concisas | La propuesta era contestar sólo con lo materializado, porque un agente que consulta por su cuenta puede contradecir al panel —el ROAS 7,28 contra 2,07 del 2026-10-19—. **Ese riesgo lo cubre D6.4**: nadie activa un reporte sin haber leído sus respuestas. Y cada respuesta declara de dónde salió su cifra |
| **D6.2** | ¿Cómo se calculan las métricas nuevas? | **En código, por ahora**: una entrada en `MetricRegistry` por clave. Es la opción A de B1.26 | B1.26 sigue como estaba. `docs/PROPUESTA-2026-10-29-metricas-como-vistas.md` queda sin presentar |
| **D6.3** | ¿A quién se le puede mandar? | **A usuarios del cliente y también a correos externos**, y un externo **genera una advertencia al superadmin** | B6.3 y B6.6. Dónde y cómo la ve el superadmin lo resuelve el mapa de UX (F6.5) |
| **D6.4** | ¿Qué pasa con una pregunta sin dato, como «¿qué hago?»? | Se declara en el correo, igual que un panel bloqueado, y no se rellena. **Además, las respuestas se validan en el front antes de activar el reporte** | B6.3 suma el estado de borrador y B6.4 la ruta que genera las respuestas sin enviar. F6.10 es la pantalla |
| **D6.5** | Las pantallas no están dibujadas | **Primero un plan de diseño que mapee la UX** de punta a punta; después el dibujo | F6.5 es ese mapa. F6.6, F6.7 y F6.10 esperan el dibujo |

**Las preguntas de producto, decididas el 2026-11-04 (humano)**: se aceptaron
las propuestas del mapa de UX (F6.5), con P6.1 y P6.5 cerradas en la misma
respuesta. **Sólo P6.3 sigue abierta**, y no frena nada.

| | Pregunta | Decisión | Frena |
|---|---|---|---|
| **P6.1** | ¿Cambiar destinatarios u hora devuelve el reporte a borrador? | **No, salvo agregar un externo**, que sí lo devuelve: cambia quién lee las cifras del cliente. Cambiar una pregunta lo devuelve siempre | B6.3 y F6.7 |
| **P6.2** | ¿Qué frecuencias se ofrecen? | **Semanal y mensual.** Diaria no, por ahora: multiplica los correos y las corridas contra Snowflake | B6.3 y F6.7 |
| **P6.3** | ¿Cuáles son las tres preguntas que se proponen al crear un reporte? | **Abierta.** Hasta que producto las defina, el editor arranca vacío | Nada |
| **P6.4** | ¿Dónde ve el superadmin la advertencia por un externo? | **En los dos lugares**: un correo en el momento y una lista en Clientes (A1) | B6.3 y F6.5 |
| **P6.5** | ¿Hay un tope de destinatarios por reporte? | **Sí, 20**, entre usuarios y externos | B6.3 y F6.7 |
| **P6.6** | ¿Un correo del dominio del cliente sin usuario cuenta como externo? | **Sí.** Externo es quien no tiene usuario en la plataforma, sea de la empresa que sea | B6.3 |
| **P6.7** | ¿Un externo ve enlaces a la consola? | **No**: le pedirían iniciar sesión con una cuenta que no tiene | B6.5 |

## 4 · Lo que ya existe

**Medido contra `db91b5d` el 2026-11-03** en `AntPack-dev/synapse-api-go`, rama
`feature/dynamic-dashboard-backend`:

- **Correo:** `internal/adapters/ses/` y `internal/adapters/email/`, con un
  renderizador y plantillas. Las que hay son de solicitud de acceso y de cambio
  de contraseña.
- **Programador:** la materialización corre sola, a la hora de
  `DD_MATERIALIZE_AT`. Es una variable de entorno: una hora para el proceso, no
  una por reporte. **Programar por reporte es trabajo nuevo.**
- **Redacción:** el generador de prosa ya escribe el resumen del período, detrás
  de `DD_MATERIALIZE_PROSE_ENABLED` · B2.15.
- **Terpel:** ninguna de las claves que nombra la entrega (`atl_*`, `media_*`)
  está en `internal/core/dashboard/snowflake/queries.go`.

**Medido en Snowflake el 2026-11-03**, con el rol de Synapse: las vistas de ATL
de Terpel responden con 85 y 259 filas, y `PERIODO` viene nulo en las 85. De UA,
lo medido está en `docs/MENSAJE-2026-11-03-datos-entrega-de-ua-medida.md`,
enviado a datos ese día.

## 5 · El orden

```
MÉTRICAS
  Terpel   F6.1 pedido ──▶ B6.1 registro ──▶ F6.3 verificar en QA
  UA       datos corrige ──▶ F6.2 pedido ──▶ B6.2 registro ──▶ F6.3

REPORTE
  diseño   F6.5 mapa de UX ──▶ dibujo en el .pen ──┐
  backend  B6.3 objeto ──▶ B6.4 rutas ──▶ F6.4 cable ──┴─▶ F6.6 lista · F6.7 editor · F6.10 validar
           B6.5 respuestas ──▶ B6.6 envío ──▶ F6.9 mirar un correo real
  correo   F6.8 colores ──▶ la plantilla del backend
```

**Las dos columnas avanzan en paralelo.** Lo que se puede tomar hoy, del front:
**F6.8**. El resto espera algo con nombre.

**Los hitos**, en el orden en que se espera verlos:

| | Hito | Se cumple con |
|---|---|---|
| **H1** | Terpel muestra cifras en QA | B6.1 desplegada y F6.3 |
| **H2** | La UX del reporte está mapeada y dibujada | F6.5 y el dibujo |
| **H3** | Las rutas del reporte están en QA | B6.3, B6.4 y F6.4 |
| **H4** | El primer reporte validado y activo llega por correo | F6.10, B6.6 y F6.9 |
| **H5** | UA tiene sus métricas nuevas | Datos, B6.2 y F6.3 |

## 6 · Quién tiene qué

| Equipo | Qué |
|---|---|
| **Front** | Los dos pedidos al backend, el mapa de UX, el cable, las tres pantallas, los colores del correo y la verificación en QA |
| **Backend** | El registro de las métricas, el reporte como objeto, sus rutas, las respuestas, el programador y el envío |
| **Datos** | Corregir la entrega de UA, y el período de ATL de Terpel |
| **Diseño** | Dibujar las pantallas a partir del mapa de UX |
| **Producto** | P6.3: las tres preguntas que se proponen |

---

# Backend

### ➕ B6.1 ⚠️ Calcular la tanda A de Terpel
**Contestado el 2026-11-04** · `docs/RESPUESTA-2026-11-03-backend-metricas-de-terpel.md`, medido en `docs/AUDITORIA-2026-11-04-respuesta-del-backend-terpel.md`. Siete claves registradas y las dos `atl_*` bloqueadas en `f78d700`, leído contra `dc58ef5`: las consultas son las del mensaje, y compila con sus pruebas. **Falta desplegarlo en QA.** `media_by_campaign` falta, y el error es nuestro: el pedido no traía el `SELECT`, y la vista no tiene una fila por campaña (30 `CAMPANA`, 86 `NOMBRE_CAMPANA` en 90 filas). **Datos y producto contestaron el 2026-11-09**: la campaña es `CAMPANA`, con su familia y su cuenta (`docs/AUDITORIA-2026-11-09-campanas-de-terpel.md`). El `SELECT` va en `docs/MENSAJE-2026-11-09-backend-tabla-por-campana-de-terpel.md`, **enviado el 2026-11-09** por el humano. **Enviado el 2026-11-04**, por el humano: `docs/MENSAJE-2026-11-04-backend-desplegar-metricas-de-terpel.md` y `docs/MENSAJE-2026-11-04-datos-campanas-de-terpel.md`. **Lo que sigue es esperar, no volver a pedirlo.**
**Descripción.** Las métricas del catálogo de Terpel que datos entregó el
2026-10-29 · `docs/ENTREGA-2026-10-29-synapse-metricas-terpel.md`. Una entrada
en `MetricRegistry` por clave (D6.2).
**Criterio de aceptación.**
- En QA, los paneles de Terpel de esas métricas salen `AVAILABLE` con su
  gobierno y su procedencia.
- **Las `atl_*` no se calculan por período.** `PERIODO` viene nulo en las 85
  filas de ATL y `MES` no trae año; medido el 2026-11-03. Hasta que datos lo
  resuelva, o van sin período con la ventana declarada en la BASE, o quedan
  `BLOCKED` con esa razón.
- La cifra de cada métrica se puede reproducir con una consulta de agregados
  sobre la vista. La consulta va en el cierre de la tarea.

### ➕ B6.2 ⬜ Calcular las métricas de UA que faltan
**Descripción.** Las once filas nuevas del catálogo de UA, con las claves que
propuso datos, en `MetricRegistry` igual que B6.1.
**Datos contestó el 2026-11-09** · `docs/RESPUESTA-2026-11-09-datos-metricas-de-ua.md`,
medido en `docs/AUDITORIA-2026-11-09-respuesta-de-datos-ua.md`: las columnas
existen, las cifras de septiembre se reproducen y la vista de control quedó en
10 filas, todas `CLAVE DESCONOCIDA`. **Nueve se piden** en
`docs/MENSAJE-2026-11-09-backend-metricas-de-ua.md` (F6.2); `category_mix`
espera a que datos decida qué hacer con la división nula.
**Criterio de aceptación.**
- Se toma cuando `SYNAPSE_METRIC_CATALOG_ISSUES` de UA no devuelva para esas
  claves nada más que `CLAVE DESCONOCIDA`, que sólo se va al registrarlas.
  Decidido el 2026-11-09 (humano): el criterio decía «cero filas», y eso no
  puede pasar antes de que el backend las registre.
- `mer_total` no se calcula mientras sea la misma cuenta que `roas`.
- Igual que B6.1: `AVAILABLE` en QA y la cifra reproducible.

### ➕ B6.3 ⬜ El reporte programado como objeto
**Descripción.** Un reporte pertenece a un cliente y lleva: nombre; de tres a
cinco preguntas; destinatarios, usuarios del cliente o correos externos;
frecuencia, día y hora; su estado; y quién lo creó y lo cambió por última vez.
**Los estados son cuatro**: borrador, validado, activo y pausado (D6.4).
**Criterio de aceptación.**
- Menos de tres o más de cinco preguntas, o una pregunta vacía, se rechaza con
  400.
- **Un reporte no se activa sin estar validado**: activar un borrador se
  rechaza. La validación queda registrada con quién la hizo y qué respuestas
  leyó.
- **Cambiar una pregunta lo devuelve a borrador**, porque las respuestas
  validadas ya no son las que va a recibir nadie. **Agregar un externo también**;
  cambiar otros destinatarios o la hora, no (P6.1).
- **Frecuencia semanal o mensual**; otra se rechaza con 400 (P6.2).
- **Más de 20 destinatarios** entre usuarios y externos se rechaza con 400
  (P6.5).
- **Externo es todo correo sin usuario en la plataforma**, aunque sea del
  dominio del cliente (P6.6).
- **La hora es del cliente**, en su zona horaria: la misma que usa la consola
  para cortar el día. Un reporte de las 08:00 sale a las 08:00 de
  `America/Mexico_City` para UA, sin importar dónde corra el servidor.
- **Un destinatario externo genera una advertencia a los superadmins** (D6.3):
  quién lo agregó, a qué reporte y a qué correo. Queda registrada, **le llega
  por correo y se lista en Clientes** (P6.4).
- Un usuario suspendido deja de recibir.

### ➕ B6.4 ⬜ Rutas para administrar reportes
**Descripción.** Listar, crear, editar, validar, activar, pausar y borrar los
reportes de un cliente, y **generar sus respuestas sin enviarlas**, que es lo
que se lee para validar. Las rutas las propone el backend, y el front las
transcribe al cable de administración.
**Criterio de aceptación.**
- **Un admin sólo ve y toca los reportes de su cliente**: pedir los de otro se
  rechaza, igual que en las dos rutas que cerró `7324b26`.
- Un `superadmin` opera sobre cualquier cliente.
- Ningún otro rol puede crear ni editar.
- Generar las respuestas no envía nada ni cambia el estado.

### ➕ B6.5 ⬜ Contestar las preguntas
**Descripción.** El generador de prosa contesta cada pregunta consultando
Snowflake, en respuestas cortas y concisas (D6.1).
**Criterio de aceptación.**
- **Cada respuesta declara de dónde sale su cifra**: la fuente, el período y la
  frescura, igual que un panel. Ninguna cifra sin BASE.
- Una pregunta que no se puede contestar con datos se declara: qué falta y qué
  la desbloquea. **No se rellena** (D6.4).
- Si el feed de una fuente está vencido, la respuesta lo dice en vez de dar el
  número viejo. Es la regla que el `.pen` escribe al pie del brief.
- El largo de la respuesta tiene un tope declarado.
- Los enlaces del correo abren la consola del cliente en el período del
  reporte. **El correo de un externo no lleva enlaces a la consola** (P6.7).

### ➕ B6.6 ⬜ Programar y enviar
**Descripción.** El envío por correo, a la hora de cada reporte, con el adaptador
de SES que ya existe.
**Criterio de aceptación.**
- Sólo salen los reportes activos.
- Queda registrado cada envío: reporte, destinatario, hora y resultado (enviado,
  rebotado o fallido).
- **«Enviar una prueba ahora»**: sólo a quien lo pide, sin esperar la hora, y
  marcado como prueba en el registro.
- Cada correo trae cómo darse de baja, también para un externo, y la baja vale
  para ese reporte.

---

# Frontend

### ➕ F6.1 ✅ Pedirle al backend el cálculo de Terpel

**Enviado el 2026-11-03**, por el humano: `docs/MENSAJE-2026-11-03-backend-metricas-de-terpel.md`. **Lo que sigue es esperar, no volver a pedirlo**: B6.1, y después F6.3.

**Descripción.** El mensaje que pide B6.1 con la tanda A medida, en
`MetricRegistry` (D6.2).

**Criterio de aceptación.**
- Un `MENSAJE-*` que lleva, por métrica, la clave, la forma, la familia y la
  consulta que comprueba la cifra.
- Dice lo que el backend tiene que saber antes de programar: `atl_*` sin
  período, y que las cifras cambian entre corridas porque la carga sigue.

### ➕ F6.2 ✅ Pedirle al backend las de UA

**Redactado el 2026-11-09**: `docs/MENSAJE-2026-11-09-backend-metricas-de-ua.md`,
con nueve claves, su SQL y la cifra de julio a octubre. **Enviado el
2026-11-09**, por el humano. **Lo que sigue es esperar, no volver a pedirlo**:
B6.2, y después F6.3. `category_mix` queda afuera hasta que datos decida la división nula.

**Descripción.** Lo mismo que F6.1 para B6.2, cuando datos conteste
`docs/MENSAJE-2026-11-03-datos-entrega-de-ua-medida.md`.
**Criterio de aceptación.** Se escribe recién con la vista de control de UA
sin problemas de datos para esas claves, medido: sólo `CLAVE DESCONOCIDA`, que
desaparece cuando el backend las registra. **No antes**: pedirle al backend que
programe sobre columnas que no existen es el pedido sin medir que costó un
viernes el 2026-10-05.

### ➕ F6.3 ⬜ Verificar en QA las métricas de Terpel y de UA · 🔒 depende de B6.1 y B6.2
**Descripción.** Cuando B6.1 y B6.2 estén desplegadas, medir panel por panel.

**Espera del backend.** Ninguna métrica de Terpel se calcula · sin una entrada en el registro, el cliente no muestra ninguna cifra aunque el dato esté en Snowflake.

**Lo tiene: BACKEND** · B6.1: desplegar `dc58ef5` en QA. Lo pide F6.1.

**Medido contra `dc58ef5` el 2026-11-04** · las siete claves `media_*` y las dos `atl_*` están en `internal/core/dashboard/snowflake/queries.go`; en QA sigue `db91b5d`, que no las tiene.
**Criterio de aceptación.**
- Cada cifra del panel coincide con la consulta de agregados sobre la vista,
  en el mismo período. Las diferencias se escriben con su causa.
- La BASE, la procedencia y la frescura se leen en pantalla.
- **Se mira la consola de Terpel abierta**, no sólo el cable.

### ➕ F6.4 ⬜ Transcribir las rutas de reportes al cable de administración
**Descripción.** Las rutas de B6.4 en `synapse-admin-wire.yaml`, con su humo.

**Espera del backend.** Las rutas de reportes programados no existen · sin ellas no hay qué transcribir ni contra qué construir F6.6 y F6.7.

**Lo tiene: BACKEND** · B6.3 y B6.4.

**Medido contra `db91b5d` el 2026-11-03** · las plantillas de `internal/adapters/email/templates/` son sólo de acceso y de contraseña, y no hay ruta ni tabla de reportes.
**Criterio de aceptación.** `npm run humo` pasa las rutas nuevas campo por
campo, y cada una lleva `x-verificado-en`.

### ➕ F6.5 ⚠️ El plan de diseño: el mapa de UX del reporte programado

**Escrito el 2026-11-03**: `docs/PROPUESTA-2026-11-03-reporte-programado-mapa-de-ux.md`, con doce recorridos, siete pantallas (V1–V7) y los estados de §8 de cada una. **Producto contestó P6.1, P6.2 y P6.4–P6.7 el 2026-11-04**, y el mapa ya las lleva; P6.3 sigue abierta y no lo frena. **Dibujado el 2026-11-04** en `design/Synapse_v2.pen`: las ocho pantallas `A7 · …` (V1–V7 más el vacío de la lista), cada una con su nota, en la fila de administración desde x = 24250. Falta que diseño las revise.

**Descripción.** Antes de dibujar, mapear la experiencia de punta a punta (D6.5).
Lo que se entrega es una `PROPUESTA-*` para diseño, y con ella se pide el dibujo
en el `.pen`.
**Criterio de aceptación.**
- **Los recorridos, uno por uno, con quién los hace**: crear un reporte,
  escribir las preguntas, elegir destinatarios —usuarios y externos—, validar
  las respuestas, activar, pausar, editar un reporte activo, ver los envíos y
  darse de baja desde el correo.
- **Cómo ve el superadmin la advertencia por un externo** (D6.3): dónde aparece,
  qué dice y qué puede hacer con ella.
- **Qué devuelve un reporte a borrador** y cómo se le avisa a quien lo edita
  (B6.3).
- **Los seis estados de §8 en cada pantalla**: cargando, vacío, degradado,
  bloqueado, sin permiso y error. Entre ellos, una respuesta que no se pudo
  generar y una pregunta sin dato (D6.4).
- **La lista de pantallas a dibujar**, con lo que se toma del brief de
  `Propuesta · Crecimiento · 2` —el correo, «lo que el brief no hace», la hora
  del cliente— y lo que cambia: quién programa, quién escribe las preguntas y
  la validación antes de activar.
- Dónde viven las pantallas dentro de la administración, y cómo se llega desde
  la ficha del cliente.

### ➕ F6.6 ⬜ Los reportes de un cliente, en administración · 🔒 depende de F6.4 y del dibujo de F6.5
**Descripción.** La lista de reportes del cliente activo: nombre, estado,
destinatarios, cuándo sale, último envío y su resultado.
**Criterio de aceptación.**
- **Un admin ve sólo su cliente. Un superadmin ve el cliente de trabajo**, y
  cambiarlo cambia la lista, igual que el resto de la administración.
- Un destinatario externo se distingue de un usuario.
- Pausar y borrar disparan su llamada; borrar pide confirmación y va con
  `<Accion variante="peligro">`.
- El historial de envíos de un reporte se puede abrir, con rebotes y fallos.
- Se construye mirando el dibujo, con su ancla `§PEN:`.

### ➕ F6.7 ⬜ Crear y editar un reporte · 🔒 depende de F6.4 y del dibujo de F6.5
**Descripción.** El editor: nombre, de tres a cinco preguntas, destinatarios
—usuarios del cliente o correos externos—, frecuencia, día y hora.
**Criterio de aceptación.**
- No deja guardar con menos de tres preguntas, más de cinco o una vacía. **Y el
  400 del servicio también se muestra**, porque la regla es suya.
- Al agregar un correo externo, dice antes de guardar que los superadmins van a
  recibir una advertencia (D6.3).
- La hora se muestra con la zona del cliente escrita al lado, no la del
  navegador. Es la distinción de las dos zonas de `CLAUDE.md`.
- Editar una pregunta de un reporte activo avisa que vuelve a borrador antes
  de guardar, no después.
- Las tres preguntas que se proponen al crear un reporte las define producto;
  hasta entonces el editor arranca vacío.

### ➕ F6.10 ⬜ Validar las respuestas antes de activar · 🔒 depende de F6.4 y del dibujo de F6.5
**Descripción.** La pantalla donde el admin o el superadmin lee las respuestas
que el reporte daría hoy, con datos reales, y recién entonces lo activa (D6.4).
**Criterio de aceptación.**
- Pide las respuestas a la ruta que las genera sin enviar (B6.4) y las muestra
  como saldrían en el correo, con la fuente, el período y la frescura de cada
  cifra.
- **Activar no está disponible hasta validar**, y validar registra quién y
  cuándo.
- Una pregunta sin dato se ve declarada. El admin decide si activa igual o
  cambia la pregunta; la pantalla no la esconde.
- Se puede volver a generar, y «Enviar una prueba» dispara su llamada y dice a
  quién se mandó.
- La prueba verifica que activar DISPARE la llamada, no que el botón exista.

### ➕ F6.8 ⬜ Los colores del producto en el correo
**Descripción.** Un correo no lee variables CSS, así que la plantilla necesita
los colores escritos. Se generan desde el `.pen`, igual que `tokens.css`.
**Criterio de aceptación.**
- Un archivo generado con los tokens que la plantilla usa, con su chequeo de
  deriva en la puerta.
- Se respetan las mismas reglas que en pantalla: sin naranja en datos, deltas
  en neutro, sin ámbar.
- Se entrega al backend, que es dueño de la plantilla en
  `internal/adapters/email/templates/`.

### ➕ F6.9 ⬜ Mirar un correo real · 🔒 depende de B6.5 y B6.6
**Descripción.** Recibir el reporte en una casilla de prueba y abrirlo en al
menos dos clientes de correo.
**Criterio de aceptación.**
- Cada cifra declara su fuente, su período y su frescura.
- **Una cifra que también está en un panel se compara con el panel** en el
  mismo período. Si difiere, se escribe con su causa: la respuesta consulta
  Snowflake por su cuenta (D6.1) y esa diferencia es la que hay que ver.
- Una pregunta sin dato se ve declarada, sin número.
- Un externo recibe el correo y su baja funciona. Después de darse de baja no
  llega el siguiente envío.


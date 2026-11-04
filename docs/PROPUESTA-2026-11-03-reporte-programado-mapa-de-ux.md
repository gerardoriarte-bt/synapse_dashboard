# Propuesta para diseño · el reporte programado, mapeado antes de dibujarlo · 2026-11-03

**Es F6.5 de `plan-fase-6.md`.** Mapea la experiencia del reporte por correo de
punta a punta, para que diseño dibuje las pantallas con todos los casos a la
vista y no sólo el camino feliz. **No es un dibujo ni una especificación
visual**: dice quién hace qué, en qué orden, qué ve en cada paso y qué tiene que
pasar cuando algo falla.

**De dónde sale:** las decisiones humanas del 2026-11-03 (§3 de
`plan-fase-6.md`), el brief que ya está dibujado en el `.pen`
(`Propuesta · Crecimiento · 2 · El brief semanal y sus preferencias`), §7.3 y
§8 de `design/design.md`, y cómo está armada hoy la administración
(`src/surfaces/admin/pantallas.ts`).

## 0 · Lo que se pidió, literal

Del humano, el 2026-11-03: «un proceso de reporte automatizado a email,
respondiendo 3 preguntas de negocio, esto debe poder programar el admin y super
admin». Y después: «Debería ser parametrizable por el usuario, va a depender del
negocio, yo propongo 3 pero quizás podría ser de 3 a 5». Y sobre esta tarea:
«Hay que hacer el plan de diseño de estas pantallas, requiere mapear bien la
UX».

## 1 · Lo que ya está dibujado, y qué cambia

El `.pen` tiene el brief semanal como propuesta del 2026-10-29: **un correo** y
**una pantalla de preferencias en el perfil de cada usuario**. Las decisiones del
2026-11-03 conservan el correo y cambian quién lo configura.

| Del dibujo | Se conserva | Cambia |
|---|---|---|
| El correo: cliente, período, titular y bloques | **Sí**, como estructura | Los bloques fijos —«lo que cambió», «por qué», «qué se recomienda»— pasan a ser **las preguntas que escribió el admin**, de tres a cinco |
| La tabla «Lo que cambió» con «contra lo esperado» | — | No entra: «contra lo esperado» necesita la banda, que no existe. La nota del dibujo ya lo decía |
| «Lo que el brief no hace» | **Sí, entero**: no inventa una cifra, y si una fuente está vencida lo dice en vez de mandar el número viejo | — |
| La hora del cliente («08:00 · hora del cliente») | **Sí** | — |
| Las preferencias en el perfil del usuario | — | **Las reemplaza la administración**: programa el admin para su cliente y el superadmin para cualquiera |
| El pie: «Recibes este correo como CEO de UA MX · Cambiar preferencias · Darse de baja» | La baja | «Cambiar preferencias» se va: el destinatario no las tiene. Un externo lee otra frase (§6, V6) |
| Las alertas «todavía no disponible» | — | Fuera de esta fase |

## 2 · Quiénes intervienen

| Actor | Qué puede | Dónde |
|---|---|---|
| **Admin de un cliente** | Crear, editar, validar, activar, pausar y borrar **los reportes de su cliente**. Ver sus envíos | Administración, con su cliente fijo |
| **Superadmin** | Lo mismo, **sobre el cliente de trabajo**, que elige en la barra del cliente activo. Recibe las advertencias por destinatarios externos de **todos** los clientes | Administración |
| **Usuario destinatario** | Leer el correo, abrir la consola desde un enlace, darse de baja de ese reporte | Su correo y la consola |
| **Destinatario externo** | Leer el correo y darse de baja. **No tiene cuenta**: un enlace a la consola le pediría iniciar sesión | Su correo |
| Cualquier otro rol | Nada. No ve la pantalla, y el servicio no le acepta la escritura | — |

**El cliente de un reporte no se cambia.** Igual que el tenant de un usuario en
A3: un reporte de UA que pasa a Terpel es otro reporte, con otras métricas y
otros destinatarios.

## 3 · Dónde vive

**Una pantalla nueva de administración, «Reportes», con alcance de cliente**,
como Catálogo y Salud de feeds. Se suma a las cuatro de
`src/surfaces/admin/pantallas.ts`:

```
Clientes · Usuarios · Catálogo de métricas · Salud de feeds · Reportes
```

- **El admin** entra directo a los reportes de su cliente.
- **El superadmin** ve los del cliente de trabajo, y cambiar de cliente en la
  barra cambia la lista, como en el resto de la administración.
- **La ficha del cliente suma una línea de resumen** —«2 reportes activos ·
  próximo envío lunes 08:00»— que lleva a la pantalla. Es lo que permite ver
  desde la ficha que un cliente recibe correos, sin ir a buscarlo.

**Las advertencias por externos** necesitan un lugar que vea el superadmin sin
importar el cliente de trabajo, porque llegan de todos. Ver P6.4 en §8.

## 4 · El ciclo de vida de un reporte

```
            crear
              │
              ▼
         ┌─────────┐   generar y leer las respuestas    ┌──────────┐
         │BORRADOR │ ─────────────────────────────────▶ │ VALIDADO │
         └─────────┘ ◀──────── cambia una pregunta ──── └──────────┘
              ▲                                              │ activar
              │ cambia una pregunta                          ▼
         ┌─────────┐ ◀──────────── pausar ─────────── ┌──────────┐
         │ PAUSADO │                                   │  ACTIVO  │ ── envía a su hora
         └─────────┘ ───────────── reanudar ─────────▶ └──────────┘
```

- **Sólo el activo envía.** Un borrador o un validado no mandan nada, nunca.
- **Validar es leer las respuestas que daría hoy, con datos reales**, y
  confirmarlas. Queda registrado quién validó y qué leyó.
- **Cambiar una pregunta vuelve a borrador**, esté validado, activo o pausado,
  porque las respuestas que se leyeron ya no son las que se van a mandar.
- **Si cambiar los destinatarios o la hora también vuelve a borrador es P6.1.**
  La propuesta es que **no**: no cambian lo que se responde. Con una excepción
  que conviene discutir: **agregar un externo** cambia quién lee las cifras del
  cliente, y podría pedir validar de nuevo.
- **Reanudar un pausado no pide validar otra vez**, salvo que se haya cambiado
  una pregunta mientras estaba pausado.
- **Borrar es definitivo** y pide confirmación. El historial de envíos se
  conserva para auditoría aunque el reporte ya no esté.

## 5 · Los recorridos

Cada recorrido dice quién lo hace, qué pasos tiene y lo que no puede pasar.

### R1 · Crear un reporte

**Admin o superadmin.** Reportes → «Nuevo reporte».

1. Nombre del reporte.
2. Las preguntas (R2).
3. Los destinatarios (R3).
4. Cuándo sale (R4).
5. Guardar. **Queda en borrador**, y la pantalla dice qué falta para activarlo:
   validar.

No puede pasar: guardar con menos de tres preguntas, más de cinco o alguna
vacía. **El servicio también lo rechaza**, y su mensaje se muestra tal cual.

### R2 · Escribir las preguntas

Texto libre, de tres a cinco. Arranca vacío hasta que producto defina las tres
que se proponen (P6.3).

- **Cada pregunta muestra una ayuda corta**: qué tipo de pregunta se puede
  contestar con datos («¿Cuánto invertimos este mes y cómo vamos contra el
  presupuesto?») y cuál no («¿Qué deberíamos hacer?», que se declara sin dato).
- **Se pueden reordenar**: el orden es el del correo.
- No se puede contestar todavía desde acá; eso es R5.

### R3 · Elegir destinatarios

Dos fuentes, distinguibles a la vista:

- **Usuarios del cliente**, elegidos de su lista. No hace falta escribir el
  correo.
- **Correos externos**, escritos a mano. **Antes de guardar, la pantalla dice
  que los superadmins van a recibir una advertencia** con quién lo agregó, a qué
  reporte y a qué correo (D6.3). No se esconde y no se pregunta dos veces.

No puede pasar: un correo con formato inválido, el mismo destinatario dos veces,
o un reporte sin ningún destinatario.

Un usuario suspendido **sigue figurando, marcado como suspendido**, y no recibe.
Así quien mira la lista entiende por qué alguien dejó de recibir.

### R4 · Programar cuándo sale

Frecuencia, día y hora. **Qué frecuencias se ofrecen es P6.2.**

- **La hora es del cliente y se escribe al lado**: «08:00 · hora de
  America/Mexico_City». No es la hora del navegador de quien lo programa, que
  puede estar en otro país. Es la distinción de las dos zonas de `CLAUDE.md`.
- Debajo, **el próximo envío con fecha**: «Próximo envío: lunes 10 de noviembre,
  08:00». Es lo que confirma que se entendió.
- **Qué período cubre** se dice con palabras: un reporte semanal del lunes cubre
  la semana anterior; uno mensual, el mes anterior.

### R5 · Validar las respuestas · F6.10

**Es el paso que la decisión D6.4 pide y el que más cuida la confianza.**

1. «Generar respuestas». Se piden al servicio **sin enviar nada**.
2. Mientras se generan, cada pregunta muestra su propio estado de carga: las
   respuestas llegan de a una, no todas o ninguna.
3. **Se muestran como saldrían en el correo**, con la fuente, el período y la
   frescura de cada cifra debajo.
4. Quien valida puede:
   - **Validar**, y el reporte pasa a validado.
   - **Volver a generar**, si el dato cambió o quiere comparar.
   - **Editar una pregunta**, que lo deja en borrador.
   - **Enviarse una prueba**, que llega sólo a quien la pidió y queda marcada
     como prueba.

**Una pregunta sin dato se ve declarada, no escondida** (D6.4): qué falta y qué
la desbloquea. Quien valida decide si activa igual o la cambia.

**Una respuesta que no se pudo generar** —Snowflake no contestó, el agente
falló— **bloquea validar**, con qué falló y «Volver a generar». No se valida un
reporte con un hueco que no se entiende.

**La fuente se nombra como la nombra el catálogo**, nunca con el nombre de una
tabla: «Reporte de pauta DataTerpel · metas y resultados por campaña», no
`VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE`. Es la regla dura de §7.3 sobre el
vocabulario de infraestructura.

### R6 · Activar

Sólo desde validado. Al activar, la pantalla confirma **cuándo sale el primero y
a cuántos destinatarios**, separando usuarios y externos.

### R7 · Editar un reporte activo

- **Cambiar una pregunta avisa antes de guardar** que el reporte vuelve a
  borrador y deja de enviarse hasta que se valide. No después.
- Cambiar destinatarios u hora se guarda sin salir de activo, si P6.1 se
  resuelve como se propone.

### R8 · Pausar, reanudar y borrar

- **Pausar** no pide confirmación y se deshace con «Reanudar».
- **Borrar** pide confirmación, nombra el reporte y cuántos destinatarios dejan
  de recibirlo, y va con `<Accion variante="peligro">`: es de las acciones que
  el rojo puede marcar.

### R9 · Ver los envíos

Por reporte, una lista de envíos: fecha, destinatarios y el resultado de cada
uno —enviado, rebotado o fallido—. Las pruebas, marcadas como tales.

- **Un rebote se explica** con el motivo que dé el servicio de correo, si lo da.
- Abrir un envío muestra **qué se mandó**: las respuestas de ese día, no las de
  hoy. Si alguien pregunta por qué el correo del lunes decía algo, la respuesta
  tiene que estar.

### R10 · La advertencia al superadmin · D6.3

Cuando se guarda un reporte con un externo nuevo, cada superadmin recibe la
advertencia: **quién lo agregó, a qué reporte, de qué cliente y qué correo**.

- **Dónde la ve es P6.4.** La propuesta es **los dos**: un correo en el momento,
  y una lista en Clientes (A1), que es la pantalla de alcance plataforma, para
  verlas juntas.
- **La advertencia informa, no bloquea.** El externo recibe el reporte sin
  esperar al superadmin; así lo decidió D6.3.
- Desde la advertencia se llega al reporte. **Quitar al externo** lo hace el
  superadmin en el propio reporte, igual que cualquier otra edición.
- **Marcar como vista** la saca de pendientes sin borrarla.

### R11 · Darse de baja

Desde el pie del correo, en un clic.

- **Lleva a una página propia, sin iniciar sesión**, que confirma de qué reporte
  se dio de baja y ofrece deshacerlo. Es la única pantalla de este trabajo que
  queda fuera de la sesión, y la abre un enlace personal de ese destinatario.
- **La baja es de ese reporte**, no de todos los correos de Synapse.
- En la administración, el destinatario figura **dado de baja**, con la fecha.
  El admin no puede volver a suscribirlo por su cuenta: lo puede pedir el
  propio destinatario.

### R12 · Cuando el dato no está a la hora del envío

A la hora programada, si la fuente de una pregunta está vencida, **esa respuesta
lo dice** —«El reporte de pauta tiene 31 horas»— en vez de mandar el número
viejo. El resto del correo sale igual. Es la regla de «lo que el brief no hace».

Si el envío entero falla, queda en R9 como fallido, con su motivo, y **no se
reintenta en silencio**: un correo que llega tres horas tarde sin explicación es
peor que uno que no llega.

## 6 · Las pantallas a dibujar

**Cuatro pantallas de administración, el correo y la página de baja.** Van
numeradas V1–V7, con V de vista, para no confundirlas con las preguntas
P6.x. Se
proponen como `A7`, porque A6 ya existe. Cuando estén dibujadas, `pen-pantallas`
exige declararlas en el registro del plan.

| | Pantalla | Recorridos | Lo que no puede faltar |
|---|---|---|---|
| **V1** | `A7 · Reportes del cliente` · la lista | R6, R8, R9 | Estado de cada reporte, cuándo sale, el último envío y su resultado, cuántos externos |
| **V2** | `A7 · Editor de reporte` | R1–R4, R7 | Las preguntas con su ayuda, usuarios y externos distinguidos, la hora con la zona del cliente, el próximo envío |
| **V3** | `A7 · Validar respuestas` | R5, R6 | Cada respuesta como saldría en el correo, con su fuente; una pregunta sin dato; una respuesta que falló |
| **V4** | `A7 · Envíos de un reporte` | R9 | Resultado por destinatario y qué se mandó ese día |
| **V5** | La advertencia al superadmin | R10 | Quién, qué reporte, qué cliente, qué correo. Depende de P6.4 |
| **V6** | El correo | todos | Adaptado del brief: las preguntas y sus respuestas, la procedencia de cada cifra, la baja, y una frase distinta para el externo: «Recibes este correo porque [quién] te agregó al reporte [nombre] de [cliente]» |
| **V7** | La página de baja | R11 | Qué reporte, deshacer, y nada más |

## 7 · Los estados de §8 en cada pantalla

**Toda pantalla que carga datos los implementa todos**, y acá están los que
tienen un caso propio:

| | Cargando | Vacío | Degradado | Bloqueado | Sin permiso | Error |
|---|---|---|---|---|---|---|
| **V1** lista | Filas esqueleto | «Este cliente no tiene reportes» y «Nuevo reporte» | Un reporte cuyo último envío falló | — | Un rol que no es admin ni superadmin | La lista no cargó: reintentar |
| **V2** editor | El formulario esqueleto | — | Un destinatario suspendido o dado de baja | — | Ídem | El guardado falló, con el mensaje del servicio |
| **V3** validar | **Por pregunta**, cada una con su carga | — | Una fuente vencida | **Una pregunta sin dato** (D6.4) | Ídem | **Una respuesta que no se generó**: bloquea validar |
| **V4** envíos | Filas esqueleto | «Todavía no se envió» con la fecha del primero | Un rebote | — | Ídem | La lista no cargó |
| **V6** correo | — | — | Una fuente vencida, dicha en la respuesta | Una pregunta sin dato | — | — |

## 8 · Lo que este mapa no decide

Son de producto, y las cuatro primeras ya están en `plan-fase-6.md`:

| | Pregunta | Lo que propone este mapa |
|---|---|---|
| **P6.1** | ¿Cambiar destinatarios u hora vuelve a borrador? | No, salvo quizás agregar un externo (§4) |
| **P6.2** | ¿Qué frecuencias se ofrecen? | Semanal y mensual para empezar. Diaria multiplica los correos y las corridas contra Snowflake |
| **P6.3** | ¿Cuáles son las tres preguntas que se proponen? | — |
| **P6.4** | ¿Dónde ve el superadmin la advertencia? | Los dos: correo en el momento y lista en Clientes (R10) |
| **P6.5** | ¿Hay un tope de destinatarios por reporte? | Sí, para que un error de tipeo no mande cifras a una lista entera. El número lo pone producto |
| **P6.6** | ¿Un correo del dominio del cliente cuenta como externo si no tiene usuario? | Sí. Lo que importa es que la plataforma no lo conoce, no de qué empresa es |
| **P6.7** | ¿Un externo ve enlaces a la consola? | No: le pedirían iniciar sesión con una cuenta que no tiene |

## 9 · Qué sigue

1. **Producto revisa este mapa** y contesta P6.1–P6.7. Las que cambien un
   recorrido se escriben acá antes del dibujo.
2. **Diseño dibuja V1–V7** en el `.pen`, con estos recorridos y estos estados.
3. **Con el dibujo y las rutas del backend** (B6.3, B6.4) se construyen F6.6,
   F6.7 y F6.10, mirando el dibujo antes de la primera línea.
